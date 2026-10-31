import "server-only";
// bidcore.in as the gateway for the installed Bidcore programs (Phase 1: activation + the contractor directory as company cards).
// - Activation: the program sends its signed licence + its computer code. The licence is verified HERE (signature, product, dates, computer), checked against the
//   revocation list and the licence's device limit, and bound to that computer. The program gets a random access token that lives 24 hours; only its hash is stored.
// - Every protected call needs that token; the licence's revocation and expiry are checked again on every call.
// - Every call (accepted or refused) is written to software_api_log; the rate limits count those rows, so they hold across Vercel's many instances.
// Tables are created on first use (like the directory tables) and are not in prisma/schema.prisma on purpose.
import { db } from "@/lib/db";
import {
  DIRECTORY_PAGE_MAX,
  DIRECTORY_PRODUCTS,
  LIMITS,
  PRODUCT_KEYS,
  TOKEN_HOURS,
  bearer,
  decodeCursor,
  encodeCursor,
  hashIp,
  hashToken,
  isMachineCode,
  newToken,
  toCard,
  verifyLicence,
  type DirectoryCard,
} from "@/lib/software-licence-core";
import { SOFTWARE_SCHEMA_SQL } from "@/lib/software-schema";

let ready = false;
export async function ensureSoftwareTables() {
  if (ready) return;
  for (const sql of SOFTWARE_SCHEMA_SQL) await db.$executeRawUnsafe(sql);
  ready = true;
}

export interface Refusal {
  status: number;
  code: string;
  message: string;
}

const salt = () => process.env.SOFTWARE_LOG_SALT || process.env.SESSION_SECRET || "bidcore";
export function clientIpHash(headers: Headers): string {
  const ip = (headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || headers.get("x-real-ip") || "unknown";
  return hashIp(ip, salt());
}

export async function logCall(e: { endpoint: string; status: number; activationId?: number | null; licenceId?: string | null; ipHash: string; detail?: string }) {
  try {
    await db.$executeRawUnsafe(
      `INSERT INTO software_api_log (endpoint, status, activation_id, licence_id, ip_hash, detail) VALUES ($1, $2, $3, $4, $5, $6)`,
      e.endpoint,
      e.status,
      e.activationId ?? null,
      e.licenceId ?? null,
      e.ipHash,
      (e.detail ?? "").slice(0, 200) || null,
    );
  } catch {
    // the log must never block the answer
  }
}

async function countLastHour(column: "activation_id" | "ip_hash" | "licence_id", value: string | number, endpoint: string): Promise<number> {
  const rows = await db.$queryRawUnsafe<{ n: bigint }[]>(
    `SELECT COUNT(*) AS n FROM software_api_log WHERE ${column} = $1 AND endpoint = $2 AND at > now() - interval '1 hour'`,
    value,
    endpoint,
  );
  return Number(rows[0]?.n ?? 0);
}

export interface ActivationResult {
  token: string;
  tokenExpiresAt: string;
  licenceId: string;
  product: string;
  licensee: string | null;
  licenceExpiresAt: string;
  services: { directory: boolean };
}

/** POST /api/software/activate. Never trusts the program: everything is checked here. */
export async function activate(body: unknown, ipHash: string): Promise<{ ok: true; result: ActivationResult } | { ok: false; refusal: Refusal; licenceId?: string }> {
  const refuse = (status: number, code: string, message: string, licenceId?: string) => ({ ok: false as const, refusal: { status, code, message }, licenceId });
  await ensureSoftwareTables();
  if ((await countLastHour("ip_hash", ipHash, "activate")) >= LIMITS.activatePerIpPerHour) return refuse(429, "RATE_LIMITED", "Too many activation attempts. Try again in an hour.");

  const b = (body ?? {}) as { licence?: unknown; machine?: unknown; install?: unknown; version?: unknown };
  if (!isMachineCode(b.machine)) return refuse(400, "BAD_MACHINE", "The computer code is missing or not valid.");
  const machine = b.machine.trim().toUpperCase();
  const install = typeof b.install === "string" && /^[A-Za-z0-9-]{8,64}$/.test(b.install) ? b.install : null;
  const version = typeof b.version === "string" ? b.version.slice(0, 40) : null;

  const check = verifyLicence(b.licence, machine);
  if (!check.ok) return refuse(check.status === "expired" ? 403 : 401, `LICENCE_${check.status.toUpperCase()}`, check.reason);
  const { payload, expiresAt, deviceLimit } = check;

  const revoked = await db.$queryRawUnsafe<{ licence_id: string }[]>(`SELECT licence_id FROM software_licence_revocations WHERE licence_id = $1`, payload.licenseId);
  if (revoked.length) return refuse(403, "LICENCE_REVOKED", "This licence has been revoked. Contact Bidcore.", payload.licenseId);
  if ((await countLastHour("licence_id", payload.licenseId, "activate")) >= LIMITS.activatePerLicencePerHour)
    return refuse(429, "RATE_LIMITED", "Too many activations for this licence. Try again in an hour.", payload.licenseId);

  const others = await db.$queryRawUnsafe<{ n: bigint }[]>(
    `SELECT COUNT(*) AS n FROM software_activations WHERE licence_id = $1 AND machine <> $2 AND deactivated_at IS NULL`,
    payload.licenseId,
    machine,
  );
  if (Number(others[0]?.n ?? 0) >= deviceLimit)
    return refuse(409, "DEVICE_LIMIT", `This licence is already in use on ${deviceLimit === 1 ? "another computer" : `${deviceLimit} computers`}. Contact Bidcore to move it.`, payload.licenseId);

  const token = newToken();
  const tokenExpires = new Date(Date.now() + TOKEN_HOURS * 3600 * 1000);
  await db.$executeRawUnsafe(
    `INSERT INTO software_activations (licence_id, product, licensee, machine, install_id, app_version, licence_expires_at, token_hash, token_expires_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     ON CONFLICT (licence_id, machine) DO UPDATE SET product = EXCLUDED.product, licensee = EXCLUDED.licensee, install_id = EXCLUDED.install_id,
       app_version = EXCLUDED.app_version, licence_expires_at = EXCLUDED.licence_expires_at, token_hash = EXCLUDED.token_hash,
       token_expires_at = EXCLUDED.token_expires_at, last_seen_at = now(), deactivated_at = NULL`,
    payload.licenseId,
    payload.product,
    payload.licensee ?? null,
    machine,
    install,
    version,
    expiresAt,
    hashToken(token),
    tokenExpires,
  );
  return {
    ok: true,
    result: {
      token,
      tokenExpiresAt: tokenExpires.toISOString(),
      licenceId: payload.licenseId,
      product: payload.product,
      licensee: payload.licensee ?? null,
      licenceExpiresAt: expiresAt.toISOString(),
      services: { directory: DIRECTORY_PRODUCTS.has(payload.product) },
    },
  };
}

export interface Caller {
  activationId: number;
  licenceId: string;
  product: string;
}

/** The program behind a request, or why it is refused. Revocation, deactivation, licence expiry and token expiry are all checked on every call. */
export async function authenticate(headers: Headers): Promise<{ ok: true; caller: Caller } | { ok: false; refusal: Refusal; caller?: Partial<Caller> }> {
  await ensureSoftwareTables();
  const token = bearer(headers.get("authorization"));
  if (!token) return { ok: false, refusal: { status: 401, code: "NO_TOKEN", message: "Activate the program first." } };
  const rows = await db.$queryRawUnsafe<
    { id: number; licence_id: string; product: string; token_ok: boolean; licence_ok: boolean; deactivated: boolean; revoked: boolean }[]
  >(
    `SELECT a.id, a.licence_id, a.product, a.token_expires_at > now() AS token_ok, a.licence_expires_at > now() AS licence_ok,
            a.deactivated_at IS NOT NULL AS deactivated, r.licence_id IS NOT NULL AS revoked
       FROM software_activations a LEFT JOIN software_licence_revocations r ON r.licence_id = a.licence_id
      WHERE a.token_hash = $1`,
    hashToken(token),
  );
  const a = rows[0];
  if (!a) return { ok: false, refusal: { status: 401, code: "BAD_TOKEN", message: "Activate the program again." } };
  const caller = { activationId: a.id, licenceId: a.licence_id, product: a.product };
  if (a.revoked) return { ok: false, refusal: { status: 403, code: "LICENCE_REVOKED", message: "This licence has been revoked. Contact Bidcore." }, caller };
  if (a.deactivated) return { ok: false, refusal: { status: 403, code: "DEACTIVATED", message: "This computer has been deactivated. Contact Bidcore." }, caller };
  if (!a.licence_ok) return { ok: false, refusal: { status: 403, code: "LICENCE_EXPIRED", message: "This licence has expired." }, caller };
  if (!a.token_ok) return { ok: false, refusal: { status: 401, code: "TOKEN_EXPIRED", message: "Activate the program again." }, caller };
  if (!PRODUCT_KEYS[a.product]) return { ok: false, refusal: { status: 403, code: "LICENCE_UNKNOWN_PRODUCT", message: "This licence is not for a Bidcore program." }, caller };
  await db.$executeRawUnsafe(`UPDATE software_activations SET last_seen_at = now() WHERE id = $1`, a.id);
  return { ok: true, caller };
}

export async function directoryRateOk(caller: Caller): Promise<boolean> {
  return (await countLastHour("activation_id", caller.activationId, "directory")) < LIMITS.directoryPerActivationPerHour;
}

/** One page of company cards after `cursor`, in (updated_at, id) order. The SELECT names its columns: phone, e-mail, address and source are never read. */
export async function directoryPage(cursor: string | null, limit: number): Promise<{ items: DirectoryCard[]; cursor: string | null; more: boolean } | { bad: true }> {
  const after = decodeCursor(cursor);
  if (cursor && !after) return { bad: true };
  const size = Math.min(Math.max(Number.isInteger(limit) ? limit : DIRECTORY_PAGE_MAX, 1), DIRECTORY_PAGE_MAX);
  // the directory tables are created by the directory itself; until then there is nothing to send
  const exists = await db.$queryRawUnsafe<{ t: string | null }[]>(`SELECT to_regclass('directory_companies')::text AS t`);
  if (!exists[0]?.t) return { items: [], cursor: cursor, more: false };
  const rows = await db.$queryRawUnsafe<
    { id: number; listed: boolean; slug: string; name: string; type: string; city: string; state: string | null; trades: string[] | null; website: string | null; updated_at: string }[]
  >(
    `SELECT id, listed, slug, name, type, city, state, trades, website,
            to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS updated_at
       FROM directory_companies
      WHERE $1::timestamptz IS NULL OR (updated_at, id) > ($1::timestamptz, $2::int)
      ORDER BY updated_at, id
      LIMIT ${size + 1}`,
    after?.updatedAt ?? null,
    after?.id ?? 0,
  );
  const more = rows.length > size;
  const page = rows.slice(0, size);
  const last = page[page.length - 1];
  return { items: page.map(toCard), cursor: last ? encodeCursor(last.updated_at, last.id) : cursor, more };
}
