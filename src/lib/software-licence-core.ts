// The installed Bidcore programs talk to bidcore.in with their signed licence. This file holds the pure rules (no database, no network) so they can be unit-tested:
// licence verification, which programs may use which website service, tokens and the directory card shape.
//
// Licence format = desktop/app/src/lib/license-core.js in the bidcoreai repo: { format: 1, payload: base64url(JSON bytes), signature: base64url(Ed25519 over those bytes) }.
// Only the PUBLIC keys are here (they can check a licence, never make one). The private keys stay with the administrator.
import { createHash, createPublicKey, randomBytes, verify as edVerify } from "node:crypto";

export const PRODUCT_KEYS: Record<string, { pem: string; market: "IN" | "US"; name: string }> = {
  "bidcore-india": {
    pem: "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAF6VEgzdE1UuoQdRPn8927hWuNCVIKiGp8PCDiSfpHyo=\n-----END PUBLIC KEY-----\n",
    market: "IN",
    name: "BidcoreAI IN",
  },
  "bidcore-tender-connect": {
    pem: "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA/NBkYHqz6d4fRGjCBwnMP0d3RilQ0N4dUzwC4PEvJOU=\n-----END PUBLIC KEY-----\n",
    market: "IN",
    name: "BidcoreAI Tender Connect",
  },
  "bidcore-takeoff-india": {
    pem: "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAn2RjAobVVjGaSblNvpty8/0mvdO073/THw/qjCn6Erg=\n-----END PUBLIC KEY-----\n",
    market: "IN",
    name: "BidcoreAI Takeoff IN",
  },
  "bidcoreai-us": {
    pem: "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAria9V9Lqh7hT23cnJDePizxz8+W/nHYjt0REMhf7SPQ=\n-----END PUBLIC KEY-----\n",
    market: "US",
    name: "BidcoreAI US",
  },
  "bidcoreai-takeoff-us": {
    pem: "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEAvMOR3pm0aBkL2kMepzHN2UfGIeVOeDz4YpMD7gjE6rI=\n-----END PUBLIC KEY-----\n",
    market: "US",
    name: "BidcoreAI Takeoff US",
  },
};

/** The Tender Connect directory is for the India programs that include Tender Connect. Takeoff-only and US programs are activated but get no directory. */
export const DIRECTORY_PRODUCTS = new Set(["bidcore-india", "bidcore-tender-connect"]);

export const TOKEN_HOURS = 24; // an access token lives one day; the program activates again (and is re-checked for revocation and expiry) after that
export const DIRECTORY_PAGE_MAX = 500;
export const TRIAL_DAYS = 30; // the server-recorded trial of an installed program without a licence (same length as the program's own trial)
export const LIMITS = {
  activatePerIpPerHour: 30,
  activatePerLicencePerHour: 20,
  directoryPerActivationPerHour: 120,
  trialsPerIpPerDay: 5,
  // invitations sent by bidcore.in on behalf of a company account
  invitationsPerDayLicence: 200,
  invitationsPerDayTrial: 20,
  invitationsPerTender: 300,
  // software calls per computer per hour
  tenderWritesPerHour: 300,
  responsesPerHour: 240,
  messagesPerHour: 120,
  // files (Neon free plan: 1 GB per project - keep tender files well inside it)
  chunkBytes: 4 * 1024 * 1024,
  fileBytesMax: 15 * 1024 * 1024,
  tenderFilesBytesMax: 40 * 1024 * 1024,
  bidFilesBytesMax: 20 * 1024 * 1024,
  tenantFilesBytesMax: 300 * 1024 * 1024,
  // contractor portal
  codeSendsPerInvitationPerHour: 5,
  codeAttempts: 5,
  portalHours: 12,
  abuseReportsToSuspend: 3,
};

export interface LicencePayload {
  licenseId: string;
  product: string;
  licensee?: string;
  email?: string;
  issuedAt?: string;
  notBefore?: string;
  expiresAt: string;
  deviceLimit?: number;
  machineId?: string;
  type?: string;
}

export type LicenceCheck =
  | { ok: true; payload: LicencePayload; expiresAt: Date; deviceLimit: number }
  | { ok: false; status: "malformed" | "invalid_signature" | "unknown_product" | "wrong_machine" | "not_yet_valid" | "expired"; reason: string };

const MACHINE = /^([0-9A-F]{4}-){4}[0-9A-F]{4}$/;
export const isMachineCode = (s: unknown): s is string => typeof s === "string" && MACHINE.test(s.trim().toUpperCase());

/** Checks a licence exactly as the programs do, plus: the product must be one of ours, and a licence bound to a computer only works for that computer's code. */
export function verifyLicence(
  licence: unknown,
  machine: string,
  now = Date.now(),
  keys: Record<string, { pem: string }> = PRODUCT_KEYS,
): LicenceCheck {
  const fail = (status: Exclude<LicenceCheck, { ok: true }>["status"], reason: string): LicenceCheck => ({ ok: false, status, reason });
  const l = licence as { format?: unknown; payload?: unknown; signature?: unknown } | null;
  if (!l || typeof l !== "object" || l.format !== 1 || typeof l.payload !== "string" || typeof l.signature !== "string" || l.payload.length > 8000 || l.signature.length > 200)
    return fail("malformed", "This is not a Bidcore licence.");
  let bytes: Buffer;
  let payload: LicencePayload;
  try {
    bytes = Buffer.from(l.payload, "base64url");
    payload = JSON.parse(bytes.toString("utf8"));
  } catch {
    return fail("malformed", "This is not a Bidcore licence.");
  }
  const key = payload && typeof payload.product === "string" ? keys[payload.product] : undefined;
  if (!key) return fail("unknown_product", "This licence is not for a Bidcore program.");
  let ok = false;
  try {
    ok = edVerify(null, bytes, createPublicKey(key.pem), Buffer.from(l.signature, "base64url"));
  } catch {
    ok = false;
  }
  if (!ok) return fail("invalid_signature", "The licence signature is not valid.");
  if (typeof payload.licenseId !== "string" || !/^[A-Za-z0-9-]{4,40}$/.test(payload.licenseId)) return fail("malformed", "The licence has no valid id.");
  if (payload.machineId && String(payload.machineId).toUpperCase() !== machine.toUpperCase())
    return fail("wrong_machine", "This licence was issued to a different computer.");
  const start = Date.parse(payload.notBefore || payload.issuedAt || "");
  const end = Date.parse(payload.expiresAt);
  if (Number.isNaN(start) || Number.isNaN(end)) return fail("malformed", "The licence dates cannot be read.");
  if (now < start) return fail("not_yet_valid", "This licence has not started yet.");
  if (now > end) return fail("expired", "This licence has expired.");
  const deviceLimit = Number.isInteger(payload.deviceLimit) && (payload.deviceLimit as number) > 0 ? (payload.deviceLimit as number) : 1;
  return { ok: true, payload, expiresAt: new Date(end), deviceLimit };
}

export const newToken = () => randomBytes(32).toString("base64url");
export const hashToken = (token: string) => createHash("sha256").update(`bidcore-software-token|${token}`).digest("hex");
export const hashIp = (ip: string, salt: string) => createHash("sha256").update(`${salt}|${ip}`).digest("hex").slice(0, 32);

/** Bearer token from an Authorization header, or null. */
export function bearer(header: string | null): string | null {
  const m = /^Bearer ([A-Za-z0-9_-]{20,100})$/.exec((header ?? "").trim());
  return m ? m[1] : null;
}

/** The ONLY fields of a directory company the programs ever receive. No phone, e-mail, address, contact person or source page - not even masked. */
export interface DirectoryCard {
  id: string;
  listed: boolean;
  updatedAt: string;
  slug?: string;
  name?: string;
  type?: string;
  city?: string;
  state?: string | null;
  trades?: string[];
  website?: string | null;
}

export function toCard(r: {
  id: number;
  listed: boolean;
  updated_at: string;
  slug: string;
  name: string;
  type: string;
  city: string;
  state: string | null;
  trades: string[] | null;
  website: string | null;
}): DirectoryCard {
  const id = `dc-${r.id}`;
  if (!r.listed) return { id, listed: false, updatedAt: r.updated_at }; // taken off the directory: the program removes it, nothing else is sent
  return { id, listed: true, updatedAt: r.updated_at, slug: r.slug, name: r.name, type: r.type, city: r.city, state: r.state, trades: r.trades ?? [], website: r.website };
}

// updated_at as UTC text with microseconds (to_char ... 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'), so the position survives the round trip exactly.
const CURSOR_TIME = /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{6}Z$/;

/** Cursor = the position after the last card sent: updated_at (microseconds) + the row id. */
export function encodeCursor(updatedAt: string, id: number): string {
  return Buffer.from(JSON.stringify([updatedAt, id])).toString("base64url");
}

export function decodeCursor(c: string | null): { updatedAt: string; id: number } | null {
  if (!c) return null;
  try {
    const v = JSON.parse(Buffer.from(c, "base64url").toString("utf8"));
    if (Array.isArray(v) && typeof v[0] === "string" && CURSOR_TIME.test(v[0]) && Number.isInteger(v[1]) && v[1] >= 0) return { updatedAt: v[0], id: v[1] };
  } catch {}
  return null;
}
