// The tender invitation gateway for installed programs (Phase 2). Every call needs the program's access token (src/lib/software-gateway.ts) and works only on the
// caller's own company account. Routes (relative to /api/software):
//   PUT    tenders/{ref}                         publish / update a tender (title, dates, bid form ...; status open | closed | cancelled)
//   GET    tenders/{ref}/files                   the tender's files
//   POST   tenders/{ref}/files                   start a file upload {name, mime, size, sha256} -> {fileId, chunks, chunkBytes, existing}
//   POST   tenders/{ref}/files/keep              {keep: [fileId]} removes the tender's other files
//   PUT    files/{id}/chunks/{n}                 one piece (raw bytes, at most 4 MB)
//   POST   files/{id}/complete                   checks size + SHA-256
//   GET    files/{id}?chunk=n                    one piece of a tender file or of a bid file received
//   POST   tenders/{ref}/invitations             {companyIds: ["dc-12", ...]} -> bidcore.in e-mails each company
//   GET    responses?cursor=                     what changed: answers, bids (+ files), messages, contact requests / shared contacts (only after consent)
//   GET    invitations/{id}/messages             the relayed conversation
//   POST   invitations/{id}/messages             {body}
//   POST   invitations/{id}/contact-request      asks the contractor to share their contact with this company
import { NextRequest, NextResponse } from "next/server";
import { DIRECTORY_PRODUCTS, LIMITS } from "@/lib/software-licence-core";
import { authenticate, clientIpHash, logCall, underHourlyLimit, type Caller } from "@/lib/software-gateway";
import { isLocalRef, isUuid, parseTender } from "@/lib/tc-core";
import {
  TcError,
  beginFile,
  chunkBytes,
  completeFile,
  event,
  fileById,
  invitationForTenant,
  keepTenderFiles,
  listMessages,
  mailContractor,
  postMessage,
  putChunk,
  requestContact,
  responses,
  sendInvitations,
  tenderFiles,
  tenderOf,
  upsertTender,
  SITE,
} from "@/lib/tc-gateway";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ path: string[] }> };
const json = (status: number, body: unknown) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

async function handle(req: NextRequest, ctx: Ctx, method: string) {
  const { path } = await ctx.params;
  const ipHash = clientIpHash(req.headers);
  const auth = await authenticate(req.headers);
  const endpoint = `tc:${method} ${path[0] ?? ""}`.slice(0, 60);
  if (!auth.ok) {
    await logCall({ endpoint, status: auth.refusal.status, activationId: auth.caller?.activationId, licenceId: auth.caller?.licenceId, ipHash, detail: auth.refusal.code });
    return json(auth.refusal.status, { error: auth.refusal.message, code: auth.refusal.code });
  }
  const caller = auth.caller;
  const log = (status: number, detail: string) => logCall({ endpoint, status, activationId: caller.activationId, licenceId: caller.licenceId, ipHash, detail });
  if (!DIRECTORY_PRODUCTS.has(caller.product)) {
    await log(403, "NOT_INCLUDED");
    return json(403, { error: "Tender invitations are not part of this program.", code: "NOT_INCLUDED" });
  }
  const group = path[0] === "responses" ? ["tc_read", LIMITS.responsesPerHour] : path[0] === "invitations" && path[2] === "messages" ? ["tc_msg", LIMITS.messagesPerHour] : ["tc_write", LIMITS.tenderWritesPerHour];
  if (!(await underHourlyLimit(caller, group[0] as string, group[1] as number))) {
    await log(429, "RATE_LIMITED");
    return json(429, { error: "Too many requests. Try again in an hour.", code: "RATE_LIMITED" });
  }
  await logCall({ endpoint: group[0] as string, status: 100, activationId: caller.activationId, licenceId: caller.licenceId, ipHash });
  try {
    const out = await route(req, caller, method, path);
    await log(out.status, out.detail ?? "ok");
    if (out.stream) return new NextResponse(new Uint8Array(out.stream), { status: 200, headers: { "Content-Type": "application/octet-stream", "Cache-Control": "no-store" } });
    return json(out.status, out.body);
  } catch (e) {
    if (e instanceof TcError) {
      await log(e.status, e.code);
      return json(e.status, { error: e.message, code: e.code });
    }
    await log(500, "ERROR");
    return json(503, { error: "bidcore.in could not do this right now. Try again later.", code: "UNAVAILABLE" });
  }
}

async function body(req: NextRequest): Promise<unknown> {
  const t = await req.text();
  if (t.length > 400_000) throw new TcError(413, "TOO_LARGE", "The request is too large.");
  try {
    return t ? JSON.parse(t) : {};
  } catch {
    throw new TcError(400, "BAD_REQUEST", "Invalid request.");
  }
}

async function route(req: NextRequest, caller: Caller, method: string, p: string[]): Promise<{ status: number; body?: unknown; stream?: Buffer; detail?: string }> {
  // ---- tenders
  if (p[0] === "tenders" && isLocalRef(p[1])) {
    const ref = p[1];
    if (p.length === 2 && method === "PUT") {
      const t = parseTender(await body(req));
      if (!t.ok) throw new TcError(400, "BAD_TENDER", t.error);
      return { status: 200, body: await upsertTender(caller, ref, t.tender) };
    }
    const tender = await tenderOf(caller, ref);
    if (p[2] === "files" && p.length === 3 && method === "GET") return { status: 200, body: { files: await tenderFiles(tender.id) } };
    if (p[2] === "files" && p.length === 3 && method === "POST")
      return { status: 200, body: await beginFile({ tenantId: caller.tenantId, tenderId: tender.id, owner: "inviter", invitationId: null }, await body(req)) };
    if (p[2] === "files" && p[3] === "keep" && method === "POST") {
      const keep = ((await body(req)) as { keep?: unknown }).keep;
      if (!Array.isArray(keep)) throw new TcError(400, "BAD_LIST", "keep must be a list of file ids.");
      return { status: 200, body: await keepTenderFiles(caller, tender, keep.map(String)) };
    }
    if (p[2] === "invitations" && method === "POST") {
      const r = await sendInvitations(caller, tender, ((await body(req)) as { companyIds?: unknown }).companyIds);
      return { status: 200, body: r, detail: `invited ${r.results.filter((x) => x.status === "sent").length}` };
    }
  }
  // ---- files
  if (p[0] === "files" && isUuid(p[1])) {
    const f = await fileById(p[1]);
    if (!f || f.tenant_id !== caller.tenantId) throw new TcError(404, "NOT_FOUND", "No such file.");
    if (p[2] === "chunks" && method === "PUT") {
      if (f.owner !== "inviter") throw new TcError(403, "FORBIDDEN", "Not your file.");
      const buf = new Uint8Array(await req.arrayBuffer());
      if (buf.length > LIMITS.chunkBytes) throw new TcError(413, "TOO_LARGE", "A piece can be at most 4 MB.");
      await putChunk(f, Number(p[3]), buf);
      return { status: 200, body: { ok: true } };
    }
    if (p[2] === "complete" && method === "POST") {
      if (f.owner !== "inviter") throw new TcError(403, "FORBIDDEN", "Not your file.");
      await completeFile(f);
      return { status: 200, body: { ok: true } };
    }
    if (p.length === 2 && method === "GET") {
      if (f.status !== "ready" || (f.owner === "contractor" && !f.bid_id)) throw new TcError(404, "NOT_FOUND", "No such file.");
      const idx = Number(req.nextUrl.searchParams.get("chunk") ?? "0");
      const b = Number.isInteger(idx) ? await chunkBytes(f.id, idx) : null;
      if (!b) throw new TcError(404, "NOT_FOUND", "No such piece.");
      return { status: 200, stream: b, detail: `file ${f.id} #${idx}` };
    }
  }
  // ---- responses (changes since the cursor)
  if (p[0] === "responses" && p.length === 1 && method === "GET") {
    const c = req.nextUrl.searchParams.get("cursor");
    let cursor: { at: string; id: string } | null = null;
    if (c) {
      try {
        const v = JSON.parse(Buffer.from(c, "base64url").toString("utf8"));
        if (Array.isArray(v) && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{6}Z$/.test(v[0]) && isUuid(v[1])) cursor = { at: v[0], id: v[1] };
      } catch {}
      if (!cursor) throw new TcError(400, "BAD_CURSOR", "Invalid cursor.");
    }
    const r = await responses(caller, cursor, Number(req.nextUrl.searchParams.get("limit") ?? "100"));
    const last = r.items[r.items.length - 1];
    const next = last ? Buffer.from(JSON.stringify([last.cursorAt, last.invitationId])).toString("base64url") : c;
    return { status: 200, body: { items: r.items.map(({ cursorAt, ...x }) => (void cursorAt, x)), cursor: next, more: r.more }, detail: `items=${r.items.length}` };
  }
  // ---- one invitation: messages, contact request
  if (p[0] === "invitations" && isUuid(p[1])) {
    const inv = await invitationForTenant(caller, p[1]);
    if (p[2] === "messages" && method === "GET") return { status: 200, body: { messages: await listMessages(inv.id) } };
    if (p[2] === "messages" && method === "POST") {
      const r = await postMessage(inv.id, "inviter", ((await body(req)) as { body?: unknown }).body, caller.tenantId, `program:${caller.activationId}`);
      const t = await db_tender(inv.tender_id);
      await mailContractor(inv.id, `New message about the tender ${t.title}`, [
        `${t.inviter_company} sent you a message about the tender "${t.title}".`,
        "Open the link in your invitation e-mail from Bidcore to read and reply. Your e-mail address is not shown to them.",
        `Bidcore: ${SITE()}`,
      ]);
      return { status: 200, body: r };
    }
    if (p[2] === "contact-request" && method === "POST") {
      const r = await requestContact(caller, inv.id);
      if (!r.existing) {
        const t = await db_tender(inv.tender_id);
        await mailContractor(inv.id, `${t.inviter_company} asks for your contact details`, [
          `${t.inviter_company} asks you to share your contact details for the tender "${t.title}".`,
          "Nothing is shared unless you approve it. Open the link of your invitation e-mail to approve or decline.",
        ]);
        await event({ tenantId: caller.tenantId, invitationId: inv.id, actor: `program:${caller.activationId}`, event: "contact_request_mailed" });
      }
      return { status: 200, body: r };
    }
  }
  throw new TcError(404, "NOT_FOUND", "Unknown request.");
}

async function db_tender(id: string) {
  const { db } = await import("@/lib/db");
  const r = await db.$queryRawUnsafe<{ title: string; inviter_company: string }[]>(`SELECT title, inviter_company FROM tc_tenders WHERE id = $1::uuid`, id);
  return r[0];
}

export const GET = (req: NextRequest, ctx: Ctx) => handle(req, ctx, "GET");
export const POST = (req: NextRequest, ctx: Ctx) => handle(req, ctx, "POST");
export const PUT = (req: NextRequest, ctx: Ctx) => handle(req, ctx, "PUT");
