import "server-only";
// The tender invitation gateway (Phase 2). bidcore.in keeps every contractor contact: the installed program sends a tender + the directory ids of the companies to
// invite; bidcore.in looks the address up, e-mails the invitation itself, runs the contractor's portal (answer, bid, files, messages, contact consent) and lets the
// program read the responses back - without any contractor e-mail or phone, unless the contractor approved sharing them with that company.
// Isolation: every tender has a tenant (the company account of the program, src/lib/software-gateway.ts); every software function below starts from the caller's
// tenant and reaches invitations / bids / files / messages only through that tenant's tenders.
import { randomUUID } from "node:crypto";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { LIMITS } from "@/lib/software-licence-core";
import { ensureSoftwareTables, type Caller } from "@/lib/software-gateway";
import {
  emailHash,
  hashInviteToken,
  inviteExpiry,
  missingRequired,
  newInviteToken,
  okMime,
  safeFileName,
  type Answer,
  type BidPayload,
  type TenderIn,
} from "@/lib/tc-core";

export const SITE = () => (process.env.SITE_URL || "https://www.bidcore.in").replace(/\/$/, "");
export const secret = () => process.env.SESSION_SECRET || "";

export class TcError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export async function event(e: { tenantId?: string | null; invitationId?: string | null; actor: string; event: string; detail?: string }) {
  try {
    await db.$executeRawUnsafe(
      `INSERT INTO tc_events (tenant_id, invitation_id, actor, event, detail) VALUES ($1, $2::uuid, $3, $4, $5)`,
      e.tenantId ?? null,
      e.invitationId ?? null,
      e.actor.slice(0, 120),
      e.event,
      (e.detail ?? "").slice(0, 500) || null,
    );
  } catch {
    // the record must never block the action
  }
}

const touch = (invitationId: string) => db.$executeRawUnsafe(`UPDATE tc_invitations SET updated_at = clock_timestamp() WHERE id = $1::uuid`, invitationId);
const actorOf = (c: Caller) => `program:${c.activationId}`;

// ======================================================================== tenders (software side)
interface TenderRow {
  id: string;
  tenant_id: string;
  local_ref: string;
  title: string;
  package_number: string | null;
  project_name: string | null;
  trade: string | null;
  location: string | null;
  description: string | null;
  inviter_company: string;
  inviter_name: string | null;
  currency: string;
  due_at: Date | null;
  bid_form: unknown;
  status: string;
}

export async function tenderOf(caller: Caller, localRef: string): Promise<TenderRow> {
  const rows = await db.$queryRawUnsafe<TenderRow[]>(`SELECT * FROM tc_tenders WHERE tenant_id = $1 AND local_ref = $2`, caller.tenantId, localRef);
  if (!rows[0]) throw new TcError(404, "NO_TENDER", "Publish the tender first.");
  return rows[0];
}

export async function upsertTender(caller: Caller, localRef: string, t: TenderIn) {
  await ensureSoftwareTables();
  const rows = await db.$queryRawUnsafe<{ id: string }[]>(
    `INSERT INTO tc_tenders (id, tenant_id, local_ref, title, package_number, project_name, trade, location, description, inviter_company, inviter_name, currency, due_at, bid_form, status)
     VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15)
     ON CONFLICT (tenant_id, local_ref) DO UPDATE SET title = EXCLUDED.title, package_number = EXCLUDED.package_number, project_name = EXCLUDED.project_name,
       trade = EXCLUDED.trade, location = EXCLUDED.location, description = EXCLUDED.description, inviter_company = EXCLUDED.inviter_company,
       inviter_name = EXCLUDED.inviter_name, currency = EXCLUDED.currency, due_at = EXCLUDED.due_at, bid_form = EXCLUDED.bid_form, status = EXCLUDED.status, updated_at = now()
     RETURNING id::text`,
    randomUUID(),
    caller.tenantId,
    localRef,
    t.title,
    t.packageNumber,
    t.projectName,
    t.trade,
    t.location,
    t.description,
    t.inviterCompany,
    t.inviterName,
    t.currency,
    t.dueAt,
    t.bidForm === null ? null : JSON.stringify(t.bidForm),
    t.status,
  );
  await event({ tenantId: caller.tenantId, actor: actorOf(caller), event: "tender_saved", detail: `${localRef} ${t.status}` });
  return { tenderId: rows[0].id };
}

// ======================================================================== files (stored in chunks of at most 4 MB; Vercel takes ~4.5 MB per request)
interface FileRow {
  id: string;
  tenant_id: string;
  tender_id: string;
  owner: string;
  invitation_id: string | null;
  bid_id: string | null;
  name: string;
  mime: string;
  size: string | number;
  sha256: string;
  chunks: number;
  status: string;
}

async function usedBytes(where: string, ...params: unknown[]): Promise<number> {
  const r = await db.$queryRawUnsafe<{ n: string | null }[]>(`SELECT COALESCE(SUM(size), 0)::text AS n FROM tc_files WHERE ${where}`, ...params);
  return Number(r[0]?.n ?? 0);
}

export async function beginFile(
  scope: { tenantId: string; tenderId: string; owner: "inviter" | "contractor"; invitationId: string | null },
  b: unknown,
): Promise<{ fileId: string; chunks: number; chunkBytes: number; existing: boolean }> {
  const o = (b ?? {}) as Record<string, unknown>;
  const name = safeFileName(o.name);
  const size = Number(o.size);
  const sha = typeof o.sha256 === "string" && /^[0-9a-f]{64}$/.test(o.sha256) ? o.sha256 : null;
  if (!name || !sha || !Number.isInteger(size) || size <= 0) throw new TcError(400, "BAD_FILE", "A file needs a name, its size and its SHA-256.");
  if (!okMime(o.mime)) throw new TcError(400, "BAD_TYPE", "Only PDF, Word, Excel, CSV, text, ZIP and image files can be shared.");
  if (size > LIMITS.fileBytesMax) throw new TcError(413, "FILE_TOO_LARGE", `A file can be at most ${LIMITS.fileBytesMax / 1048576} MB.`);
  // the same file already uploaded for this tender / bid is reused, not stored twice
  const same =
    scope.owner === "inviter"
      ? await db.$queryRawUnsafe<{ id: string; chunks: number }[]>(
          `SELECT id::text, chunks FROM tc_files WHERE tender_id = $1::uuid AND owner = 'inviter' AND sha256 = $2 AND name = $3 AND status = 'ready' LIMIT 1`,
          scope.tenderId,
          sha,
          name,
        )
      : await db.$queryRawUnsafe<{ id: string; chunks: number }[]>(
          `SELECT id::text, chunks FROM tc_files WHERE invitation_id = $1::uuid AND owner = 'contractor' AND sha256 = $2 AND name = $3 AND status = 'ready' AND bid_id IS NULL LIMIT 1`,
          scope.invitationId,
          sha,
          name,
        );
  if (same[0]) return { fileId: same[0].id, chunks: same[0].chunks, chunkBytes: LIMITS.chunkBytes, existing: true };
  const capWhere =
    scope.owner === "inviter"
      ? [`tender_id = $1::uuid AND owner = 'inviter'`, scope.tenderId, LIMITS.tenderFilesBytesMax, "tender"]
      : [`invitation_id = $1::uuid AND owner = 'contractor'`, scope.invitationId, LIMITS.bidFilesBytesMax, "bid"];
  if ((await usedBytes(capWhere[0] as string, capWhere[1])) + size > (capWhere[2] as number))
    throw new TcError(413, "QUOTA", `The files of one ${capWhere[3]} can be at most ${(capWhere[2] as number) / 1048576} MB in total.`);
  if ((await usedBytes(`tenant_id = $1`, scope.tenantId)) + size > LIMITS.tenantFilesBytesMax) throw new TcError(413, "QUOTA", "This company's file space on bidcore.in is full.");
  const id = randomUUID();
  const chunks = Math.ceil(size / LIMITS.chunkBytes);
  await db.$executeRawUnsafe(
    `INSERT INTO tc_files (id, tenant_id, tender_id, owner, invitation_id, name, mime, size, sha256, chunks) VALUES ($1::uuid, $2, $3::uuid, $4, $5::uuid, $6, $7, $8, $9, $10)`,
    id,
    scope.tenantId,
    scope.tenderId,
    scope.owner,
    scope.invitationId,
    name,
    o.mime,
    size,
    sha,
    chunks,
  );
  return { fileId: id, chunks, chunkBytes: LIMITS.chunkBytes, existing: false };
}

export async function putChunk(file: FileRow, idx: number, bytes: Uint8Array) {
  if (file.status !== "uploading") throw new TcError(409, "DONE", "This file is already complete.");
  if (!Number.isInteger(idx) || idx < 0 || idx >= file.chunks) throw new TcError(400, "BAD_CHUNK", "Wrong piece number.");
  const expected = idx < file.chunks - 1 ? LIMITS.chunkBytes : Number(file.size) - LIMITS.chunkBytes * (file.chunks - 1);
  if (bytes.length !== expected) throw new TcError(400, "BAD_CHUNK", `Piece ${idx} must be ${expected} bytes.`);
  await db.$executeRawUnsafe(
    `INSERT INTO tc_file_chunks (file_id, idx, data) VALUES ($1::uuid, $2, $3) ON CONFLICT (file_id, idx) DO UPDATE SET data = EXCLUDED.data`,
    file.id,
    idx,
    Buffer.from(bytes),
  );
}

export async function completeFile(file: FileRow) {
  const r = await db.$queryRawUnsafe<{ n: number; sha: string | null; size: string | null }[]>(
    `SELECT COUNT(*)::int AS n, encode(sha256(string_agg(data, ''::bytea ORDER BY idx)), 'hex') AS sha, SUM(length(data))::text AS size FROM tc_file_chunks WHERE file_id = $1::uuid`,
    file.id,
  );
  if (r[0].n !== file.chunks || Number(r[0].size) !== Number(file.size) || r[0].sha !== file.sha256) throw new TcError(400, "INCOMPLETE", "The file did not arrive complete. Upload it again.");
  await db.$executeRawUnsafe(`UPDATE tc_files SET status = 'ready' WHERE id = $1::uuid`, file.id);
}

export async function fileById(id: string): Promise<FileRow | null> {
  const r = await db.$queryRawUnsafe<FileRow[]>(`SELECT id::text, tenant_id, tender_id::text, owner, invitation_id::text, bid_id::text, name, mime, size::text, sha256, chunks, status FROM tc_files WHERE id = $1::uuid`, id);
  return r[0] ?? null;
}

export async function chunkBytes(fileId: string, idx: number): Promise<Buffer | null> {
  const r = await db.$queryRawUnsafe<{ data: Buffer }[]>(`SELECT data FROM tc_file_chunks WHERE file_id = $1::uuid AND idx = $2`, fileId, idx);
  return r[0] ? Buffer.from(r[0].data) : null;
}

/** The whole file as a stream (one 4 MB piece read at a time). */
export function fileStream(file: FileRow): ReadableStream<Uint8Array> {
  let i = 0;
  return new ReadableStream({
    async pull(ctrl) {
      if (i >= file.chunks) return ctrl.close();
      const b = await chunkBytes(file.id, i++);
      if (!b) return ctrl.error(new Error("missing piece"));
      ctrl.enqueue(new Uint8Array(b));
    },
  });
}

export async function keepTenderFiles(caller: Caller, tender: TenderRow, keep: string[]) {
  const ids = keep.filter((x) => /^[0-9a-f-]{36}$/.test(x));
  const n = await db.$executeRawUnsafe(
    `DELETE FROM tc_files WHERE tender_id = $1::uuid AND tenant_id = $2 AND owner = 'inviter' AND NOT (id::text = ANY($3::text[]))`,
    tender.id,
    caller.tenantId,
    ids,
  );
  return { removed: n };
}

export async function tenderFiles(tenderId: string) {
  return db.$queryRawUnsafe<{ id: string; name: string; mime: string; size: string; sha256: string; chunks: number }[]>(
    `SELECT id::text, name, mime, size::text, sha256, chunks FROM tc_files WHERE tender_id = $1::uuid AND owner = 'inviter' AND status = 'ready' ORDER BY name`,
    tenderId,
  );
}

// ======================================================================== invitations (bidcore.in sends them)
interface Company {
  key: string;
  name: string;
  email: string | null;
}

/** A directory company and the address its invitation goes to: its published e-mail, or a member company's own verified sign-up e-mail. Server-side only. */
async function companyFor(id: string): Promise<Company | null> {
  const m = /^dc-(\d{1,12})$/.exec(id);
  if (!m) return null;
  const r = await db.$queryRawUnsafe<{ key: string; name: string; email: string | null }[]>(
    `SELECT key, name, email FROM directory_companies WHERE id = $1 AND listed = TRUE`,
    Number(m[1]),
  );
  if (!r[0]) return null;
  let email = r[0].email;
  if (!email && r[0].key.startsWith("member:")) {
    const u = await db.$queryRawUnsafe<{ email: string }[]>(`SELECT email FROM users WHERE id = $1`, r[0].key.slice(7));
    email = u[0]?.email ?? null;
  }
  return { key: id, name: r[0].name, email };
}

function inviteMail(t: TenderRow, link: string, companyName: string) {
  const due = t.due_at ? new Date(t.due_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata" }) + " IST" : "not stated";
  const subject = `${t.inviter_company} invites ${companyName} to tender: ${t.title}`.slice(0, 200);
  const lines = [
    `${t.inviter_company}${t.inviter_name ? ` (${t.inviter_name})` : ""} has invited ${companyName} to submit a tender through Bidcore.`,
    "",
    `Tender: ${t.title}${t.package_number ? ` (${t.package_number})` : ""}`,
    t.project_name ? `Project: ${t.project_name}` : "",
    t.trade ? `Work: ${t.trade}` : "",
    t.location ? `Location: ${t.location}` : "",
    `Due: ${due}`,
    "",
    `View the tender and respond (Bidding / Not bidding / Not sure): ${link}`,
    "",
    "Your e-mail address and phone number are not shared with the inviting company unless you choose to share them.",
  ].filter((x) => x !== "");
  const footer = [
    "",
    "You received this because your company is listed in the Bidcore contractor directory.",
    `Stop all tender invitations from Bidcore: ${link}?action=unsubscribe`,
    `Report this invitation as unwanted: ${link}?action=report`,
  ];
  const text = [...lines, ...footer].join("\n");
  const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
  const html = `<div style="font-family:Arial,sans-serif;font-size:14px;color:#0f172a">${lines.map((l) => `<p style="margin:0 0 6px">${esc(l).replace(esc(link), `<a href="${esc(link)}">View the tender</a>`)}</p>`).join("")}
<p style="margin:14px 0"><a href="${esc(link)}" style="background:#f97316;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:bold">View this tender</a></p>
<hr style="border:none;border-top:1px solid #e2e8f0"><p style="font-size:12px;color:#64748b">You received this because your company is listed in the Bidcore contractor directory.<br>
<a href="${esc(link)}?action=unsubscribe">Stop all tender invitations from Bidcore</a> · <a href="${esc(link)}?action=report">Report this invitation as unwanted</a></p></div>`;
  return { subject, text, html };
}

export async function sendInvitations(caller: Caller, tender: TenderRow, companyIds: unknown) {
  if (!Array.isArray(companyIds) || !companyIds.length || companyIds.length > 100) throw new TcError(400, "BAD_LIST", "Send 1 to 100 company ids.");
  if (tender.status !== "open") throw new TcError(409, "CLOSED", "This tender is closed.");
  const reports = await db.$queryRawUnsafe<{ n: bigint }[]>(`SELECT COUNT(*) AS n FROM tc_abuse_reports WHERE tenant_id = $1 AND created_at > now() - interval '30 days'`, caller.tenantId);
  if (Number(reports[0]?.n ?? 0) >= LIMITS.abuseReportsToSuspend)
    throw new TcError(403, "SUSPENDED", "Invitations from this company are paused after reports from contractors. Contact Bidcore.");
  const today = await db.$queryRawUnsafe<{ n: bigint }[]>(
    `SELECT COUNT(*) AS n FROM tc_invitations WHERE tenant_id = $1 AND created_at > now() - interval '1 day'`,
    caller.tenantId,
  );
  const onTender = await db.$queryRawUnsafe<{ n: bigint }[]>(`SELECT COUNT(*) AS n FROM tc_invitations WHERE tender_id = $1::uuid`, tender.id);
  let dayLeft = (caller.trial ? LIMITS.invitationsPerDayTrial : LIMITS.invitationsPerDayLicence) - Number(today[0]?.n ?? 0);
  let tenderLeft = LIMITS.invitationsPerTender - Number(onTender[0]?.n ?? 0);
  const results: { companyId: string; status: string; invitationId?: string; companyName?: string }[] = [];
  for (const raw of companyIds.slice(0, 100)) {
    const id = String(raw);
    const c = await companyFor(id);
    if (!c) {
      results.push({ companyId: id, status: "not_found" });
      continue;
    }
    const existing = await db.$queryRawUnsafe<{ id: string }[]>(`SELECT id::text FROM tc_invitations WHERE tender_id = $1::uuid AND company_key = $2`, tender.id, c.key);
    if (existing[0]) {
      results.push({ companyId: id, status: "already_invited", invitationId: existing[0].id, companyName: c.name });
      continue;
    }
    if (!c.email) {
      results.push({ companyId: id, status: "no_email", companyName: c.name });
      continue;
    }
    const eh = emailHash(c.email, secret());
    const sup = await db.$queryRawUnsafe<{ reason: string }[]>(`SELECT reason FROM tc_suppressions WHERE email_hash = $1`, eh);
    if (sup[0]) {
      results.push({ companyId: id, status: sup[0].reason === "bounce" ? "bounced" : "unsubscribed", companyName: c.name });
      continue;
    }
    if (dayLeft <= 0 || tenderLeft <= 0) {
      results.push({ companyId: id, status: "limit", companyName: c.name });
      continue;
    }
    const token = newInviteToken();
    const invId = randomUUID();
    const inserted = await db.$executeRawUnsafe(
      `INSERT INTO tc_invitations (id, tender_id, tenant_id, company_key, company_name, token_hash, expires_at, email_hash) VALUES ($1::uuid, $2::uuid, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (tender_id, company_key) DO NOTHING`,
      invId,
      tender.id,
      caller.tenantId,
      c.key,
      c.name,
      hashInviteToken(token),
      inviteExpiry(tender.due_at ? new Date(tender.due_at) : null),
      eh,
    );
    if (!inserted) {
      results.push({ companyId: id, status: "already_invited", companyName: c.name });
      continue;
    }
    dayLeft--;
    tenderLeft--;
    const mail = inviteMail(tender, `${SITE()}/invite/${token}`, c.name);
    let status = "sent";
    try {
      await sendMail({ to: c.email, ...mail });
    } catch (e) {
      // a refusal by the receiving server (5xx) = a bad address: suppress it; anything else = try again later
      const code = Number((e as { responseCode?: number }).responseCode ?? 0);
      status = code >= 500 && code < 600 ? "bounced" : "failed";
      if (status === "bounced") await db.$executeRawUnsafe(`INSERT INTO tc_suppressions (email_hash, reason) VALUES ($1, 'bounce') ON CONFLICT DO NOTHING`, eh);
      await db.$executeRawUnsafe(`UPDATE tc_invitations SET status = $2, updated_at = clock_timestamp() WHERE id = $1::uuid`, invId, status);
    }
    await event({ tenantId: caller.tenantId, invitationId: invId, actor: actorOf(caller), event: `invitation_${status}`, detail: c.key });
    results.push({ companyId: id, status, invitationId: invId, companyName: c.name });
  }
  return { results };
}

// ======================================================================== what the program reads back (no contact unless the contractor approved)
export async function responses(caller: Caller, cursor: { at: string; id: string } | null, limit: number) {
  const rows = await db.$queryRawUnsafe<
    {
      id: string;
      tender_id: string;
      local_ref: string;
      company_key: string;
      company_name: string;
      status: string;
      answer: string | null;
      answered_at: Date | null;
      viewed_at: Date | null;
      expires_at: Date;
      at: string;
    }[]
  >(
    `SELECT i.id::text, i.tender_id::text, t.local_ref, i.company_key, i.company_name, i.status, i.answer, i.answered_at, i.viewed_at, i.expires_at,
            to_char(i.updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS at
       FROM tc_invitations i JOIN tc_tenders t ON t.id = i.tender_id
      WHERE t.tenant_id = $1 AND i.tenant_id = $1 AND ($2::timestamptz IS NULL OR (i.updated_at, i.id) > ($2::timestamptz, $3::uuid))
      ORDER BY i.updated_at, i.id LIMIT ${Math.min(Math.max(limit, 1), 200) + 1}`,
    caller.tenantId,
    cursor?.at ?? null,
    cursor?.id ?? "00000000-0000-0000-0000-000000000000",
  );
  const more = rows.length > Math.min(Math.max(limit, 1), 200);
  const page = rows.slice(0, Math.min(Math.max(limit, 1), 200));
  const items = [];
  for (const r of page) {
    const bid = await db.$queryRawUnsafe<{ id: string; revision: number; payload: BidPayload; submitted_at: Date }[]>(
      `SELECT id::text, revision, payload, submitted_at FROM tc_bids WHERE invitation_id = $1::uuid ORDER BY revision DESC LIMIT 1`,
      r.id,
    );
    const files = bid[0]
      ? await db.$queryRawUnsafe<{ id: string; name: string; mime: string; size: string; sha256: string; chunks: number }[]>(
          `SELECT id::text, name, mime, size::text, sha256, chunks FROM tc_files WHERE bid_id = $1::uuid AND status = 'ready' ORDER BY name`,
          bid[0].id,
        )
      : [];
    const cr = await db.$queryRawUnsafe<{ status: string; shared: unknown; decided_at: Date | null }[]>(
      `SELECT status, shared, decided_at FROM tc_contact_requests WHERE invitation_id = $1::uuid AND tenant_id = $2`,
      r.id,
      caller.tenantId,
    );
    const msgs = await db.$queryRawUnsafe<{ n: number; last: Date | null; unread: number }[]>(
      `SELECT COUNT(*)::int AS n, MAX(created_at) AS last, COUNT(*) FILTER (WHERE sender = 'contractor')::int AS unread FROM tc_messages WHERE invitation_id = $1::uuid`,
      r.id,
    );
    items.push({
      invitationId: r.id,
      tenderId: r.tender_id,
      localRef: r.local_ref,
      companyId: r.company_key,
      companyName: r.company_name,
      status: r.status,
      answer: r.answer,
      answeredAt: r.answered_at,
      viewedAt: r.viewed_at,
      expiresAt: r.expires_at,
      bid: bid[0] ? { id: bid[0].id, revision: bid[0].revision, submittedAt: bid[0].submitted_at, payload: bid[0].payload, files } : null,
      contactRequest: cr[0] ? { status: cr[0].status, decidedAt: cr[0].decided_at } : null,
      contact: cr[0]?.status === "approved" ? cr[0].shared : null, // only after the contractor approved sharing with THIS company account
      messages: { count: msgs[0].n, fromContractor: msgs[0].unread, lastAt: msgs[0].last },
      cursorAt: r.at,
    });
  }
  return { items, more };
}

export async function invitationForTenant(caller: Caller, invitationId: string) {
  const r = await db.$queryRawUnsafe<{ id: string; tender_id: string; company_name: string; email_hash: string | null; status: string }[]>(
    `SELECT i.id::text, i.tender_id::text, i.company_name, i.email_hash, i.status FROM tc_invitations i JOIN tc_tenders t ON t.id = i.tender_id
      WHERE i.id = $1::uuid AND t.tenant_id = $2 AND i.tenant_id = $2`,
    invitationId,
    caller.tenantId,
  );
  if (!r[0]) throw new TcError(404, "NOT_FOUND", "No such invitation.");
  return r[0];
}

// ======================================================================== messages (relayed: neither side sees the other's address)
export async function listMessages(invitationId: string) {
  return db.$queryRawUnsafe<{ id: string; sender: string; body: string; created_at: Date }[]>(
    `SELECT id::text, sender, body, created_at FROM tc_messages WHERE invitation_id = $1::uuid ORDER BY created_at, id`,
    invitationId,
  );
}

export async function postMessage(invitationId: string, sender: "inviter" | "contractor", body: unknown, tenantId: string, actor: string) {
  const text = typeof body === "string" ? body.trim().slice(0, 5000) : "";
  if (!text) throw new TcError(400, "EMPTY", "Write a message.");
  const id = randomUUID();
  await db.$executeRawUnsafe(`INSERT INTO tc_messages (id, invitation_id, sender, body) VALUES ($1::uuid, $2::uuid, $3, $4)`, id, invitationId, sender, text);
  await touch(invitationId);
  await event({ tenantId, invitationId, actor, event: `message_from_${sender}` });
  return { id };
}

/** E-mail a contractor through bidcore.in (address read from the directory now, never stored). */
export async function mailContractor(invitationId: string, subject: string, lines: string[]) {
  const r = await db.$queryRawUnsafe<{ company_key: string; email_hash: string | null }[]>(`SELECT company_key, email_hash FROM tc_invitations WHERE id = $1::uuid`, invitationId);
  const c = r[0] ? await companyFor(r[0].company_key) : null;
  if (!c?.email) return false;
  const sup = await db.$queryRawUnsafe<{ reason: string }[]>(`SELECT reason FROM tc_suppressions WHERE email_hash = $1`, emailHash(c.email, secret()));
  if (sup[0]) return false;
  try {
    await sendMail({ to: c.email, subject: subject.slice(0, 200), text: lines.join("\n"), html: `<div style="font-family:Arial,sans-serif;font-size:14px">${lines.map((l) => `<p>${l.replace(/[&<>]/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[x]!)}</p>`).join("")}</div>` });
    return true;
  } catch {
    return false;
  }
}

/** The invited address of an invitation, for the portal's 6-digit code (read now from the directory; must still match the address the invitation went to). */
export async function invitedEmail(invitationId: string): Promise<string | null> {
  const r = await db.$queryRawUnsafe<{ company_key: string; email_hash: string | null }[]>(`SELECT company_key, email_hash FROM tc_invitations WHERE id = $1::uuid`, invitationId);
  const c = r[0] ? await companyFor(r[0].company_key) : null;
  if (!c?.email || !r[0].email_hash || emailHash(c.email, secret()) !== r[0].email_hash) return null;
  return c.email;
}

// ======================================================================== contact sharing (consent)
export async function requestContact(caller: Caller, invitationId: string) {
  const inv = await invitationForTenant(caller, invitationId);
  const prev = await db.$queryRawUnsafe<{ status: string }[]>(`SELECT status FROM tc_contact_requests WHERE invitation_id = $1::uuid`, inv.id);
  if (prev[0]) return { status: prev[0].status, existing: true };
  await db.$executeRawUnsafe(
    `INSERT INTO tc_contact_requests (id, invitation_id, tenant_id, requested_by) VALUES ($1::uuid, $2::uuid, $3, $4) ON CONFLICT (invitation_id) DO NOTHING`,
    randomUUID(),
    inv.id,
    caller.tenantId,
    `${caller.licensee ?? "company"} (${actorOf(caller)})`,
  );
  await touch(inv.id);
  await event({ tenantId: caller.tenantId, invitationId: inv.id, actor: actorOf(caller), event: "contact_requested" });
  return { status: "pending", existing: false };
}

// ======================================================================== the portal (contractor side): an invitation by its link token
export interface PortalInvitation {
  id: string;
  tender_id: string;
  tenant_id: string;
  company_name: string;
  status: string;
  answer: string | null;
  expires_at: Date;
  expired: boolean;
  tender: TenderRow;
}

export async function invitationByToken(token: string): Promise<PortalInvitation | null> {
  await ensureSoftwareTables();
  const r = await db.$queryRawUnsafe<(Omit<PortalInvitation, "tender"> & { t: TenderRow })[]>(
    `SELECT i.id::text, i.tender_id::text, i.tenant_id, i.company_name, i.status, i.answer, i.expires_at, i.expires_at < now() AS expired, row_to_json(t.*) AS t
       FROM tc_invitations i JOIN tc_tenders t ON t.id = i.tender_id WHERE i.token_hash = $1`,
    hashInviteToken(token),
  );
  if (!r[0]) return null;
  const { t, ...rest } = r[0];
  return { ...rest, tender: { ...t, due_at: t.due_at ? new Date(t.due_at) : null } };
}

export function biddingOpen(inv: PortalInvitation): string | null {
  if (inv.expired) return "This invitation link has expired.";
  if (inv.tender.status !== "open") return "This tender is closed.";
  if (inv.tender.due_at && new Date(inv.tender.due_at).getTime() < Date.now()) return "The due date of this tender has passed.";
  return null;
}

export async function setAnswer(inv: PortalInvitation, answer: Answer) {
  await db.$executeRawUnsafe(`UPDATE tc_invitations SET answer = $2, answered_at = now(), status = 'answered', updated_at = clock_timestamp() WHERE id = $1::uuid`, inv.id, answer);
  await event({ tenantId: inv.tenant_id, invitationId: inv.id, actor: "contractor", event: `answer_${answer}` });
}

export async function submitBid(inv: PortalInvitation, bid: BidPayload, requestKey: string, fileIds: string[]) {
  const dup = await db.$queryRawUnsafe<{ revision: number }[]>(`SELECT revision FROM tc_bids WHERE invitation_id = $1::uuid AND request_key = $2`, inv.id, requestKey);
  if (dup[0]) return { revision: dup[0].revision, duplicate: true }; // the same submission sent twice (double click, retry) is recorded once
  if (bid.is_bidding) {
    const missing = missingRequired(inv.tender.bid_form, bid.answers);
    if (missing.length) throw new TcError(400, "REQUIRED", `Please answer all required questions: ${missing.slice(0, 3).join("; ")}`);
  }
  const ids = fileIds.filter((x) => /^[0-9a-f-]{36}$/.test(x)).slice(0, 20);
  const own = ids.length
    ? await db.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id::text FROM tc_files WHERE id::text = ANY($1::text[]) AND invitation_id = $2::uuid AND owner = 'contractor' AND status = 'ready' AND bid_id IS NULL`,
        ids,
        inv.id,
      )
    : [];
  if (own.length !== ids.length) throw new TcError(400, "BAD_FILES", "A file does not belong to this bid or is not uploaded completely.");
  const next = await db.$queryRawUnsafe<{ n: number }[]>(`SELECT COALESCE(MAX(revision), 0)::int + 1 AS n FROM tc_bids WHERE invitation_id = $1::uuid`, inv.id);
  const bidId = randomUUID();
  await db.$executeRawUnsafe(
    `INSERT INTO tc_bids (id, invitation_id, revision, request_key, payload) VALUES ($1::uuid, $2::uuid, $3, $4, $5::jsonb)`,
    bidId,
    inv.id,
    next[0].n,
    requestKey,
    JSON.stringify(bid),
  );
  if (ids.length) await db.$executeRawUnsafe(`UPDATE tc_files SET bid_id = $1::uuid WHERE id::text = ANY($2::text[])`, bidId, ids);
  await db.$executeRawUnsafe(
    `UPDATE tc_invitations SET answer = $2, answered_at = COALESCE(answered_at, now()), status = 'answered', updated_at = clock_timestamp() WHERE id = $1::uuid`,
    inv.id,
    bid.is_bidding ? "bidding" : "not_bidding",
  );
  await event({ tenantId: inv.tenant_id, invitationId: inv.id, actor: "contractor", event: "bid_submitted", detail: `revision ${next[0].n}` });
  return { revision: next[0].n, duplicate: false };
}

export async function portalState(inv: PortalInvitation) {
  const files = await tenderFiles(inv.tender_id);
  const bid = await db.$queryRawUnsafe<{ revision: number; payload: BidPayload; submitted_at: Date }[]>(
    `SELECT revision, payload, submitted_at FROM tc_bids WHERE invitation_id = $1::uuid ORDER BY revision DESC LIMIT 1`,
    inv.id,
  );
  const bidFiles = await db.$queryRawUnsafe<{ id: string; name: string; size: string }[]>(
    `SELECT f.id::text, f.name, f.size::text FROM tc_files f JOIN tc_bids b ON b.id = f.bid_id WHERE b.invitation_id = $1::uuid AND b.revision = $2 ORDER BY f.name`,
    inv.id,
    bid[0]?.revision ?? -1,
  );
  const cr = await db.$queryRawUnsafe<{ status: string; requested_by: string | null; requested_at: Date; shared: unknown }[]>(
    `SELECT status, requested_by, requested_at, shared FROM tc_contact_requests WHERE invitation_id = $1::uuid`,
    inv.id,
  );
  return {
    files,
    bid: bid[0] ?? null,
    bidFiles,
    messages: await listMessages(inv.id),
    contactRequest: cr[0] ? { status: cr[0].status, requestedAt: cr[0].requested_at, company: inv.tender.inviter_company, shared: cr[0].shared } : null,
  };
}
