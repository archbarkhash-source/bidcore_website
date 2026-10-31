// The contractor's side of an invitation (Phase 2). The link token (256 bits, only its hash stored, expiring) identifies ONE invitation; anything beyond the tender
// summary also needs the portal session: a 6-digit code e-mailed to the invited address, then a signed cookie for that invitation only.
//   GET    /api/invite/{token}                      summary (+ files, bid, messages, contact request once verified)
//   POST   /api/invite/{token}/code                 e-mail a 6-digit code to the invited address
//   POST   /api/invite/{token}/verify               {code} -> portal cookie
//   POST   /api/invite/{token}/answer               {answer: bidding | not_bidding | not_sure}
//   POST   /api/invite/{token}/files                start a bid file upload; PUT files/{id}/chunks/{n}; POST files/{id}/complete
//   GET    /api/invite/{token}/files/{id}           download a tender file (or one's own bid file)
//   POST   /api/invite/{token}/bid                  {bid, requestKey, fileIds}
//   GET|POST /api/invite/{token}/messages           relayed conversation
//   POST   /api/invite/{token}/contact              {decision: approve | decline, name, email, phone}
//   POST   /api/invite/{token}/unsubscribe          no more Bidcore invitations to this address (works on expired links too)
//   POST   /api/invite/{token}/report               report the invitation as unwanted
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { LIMITS } from "@/lib/software-licence-core";
import { clientIpHash } from "@/lib/software-gateway";
import { ANSWERS, PORTAL_COOKIE, codeHash, isInviteToken, isUuid, newCode, parseBid, parseShare, readPortal, sameHex, signPortal, type Answer } from "@/lib/tc-core";
import {
  TcError,
  beginFile,
  biddingOpen,
  completeFile,
  event,
  fileById,
  fileStream,
  invitationByToken,
  invitedEmail,
  portalState,
  postMessage,
  putChunk,
  secret,
  setAnswer,
  submitBid,
  type PortalInvitation,
} from "@/lib/tc-gateway";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Ctx = { params: Promise<{ token: string; path?: string[] }> };
const json = (status: number, body: unknown) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
const mask = (e: string) => e.replace(/^(.).*?@(.).*?(\.[^.]+)$/, "$1***@$2***$3");

async function handle(req: NextRequest, ctx: Ctx, method: string) {
  const { token, path = [] } = await ctx.params;
  if (!isInviteToken(token)) return json(404, { error: "This invitation link is not valid.", code: "NOT_FOUND" });
  const inv = await invitationByToken(token);
  if (!inv) return json(404, { error: "This invitation link is not valid.", code: "NOT_FOUND" });
  const jar = await cookies();
  const verified = readPortal(jar.get(PORTAL_COOKIE)?.value, secret()) === inv.id;
  try {
    return await route(req, method, path, inv, verified);
  } catch (e) {
    if (e instanceof TcError) return json(e.status, { error: e.message, code: e.code });
    return json(503, { error: "This could not be done right now. Please try again shortly.", code: "UNAVAILABLE" });
  }
}

async function body(req: NextRequest): Promise<Record<string, unknown>> {
  const t = await req.text();
  if (t.length > 200_000) throw new TcError(413, "TOO_LARGE", "The request is too large.");
  try {
    return t ? JSON.parse(t) : {};
  } catch {
    throw new TcError(400, "BAD_REQUEST", "Invalid request.");
  }
}

const needVerified = (v: boolean) => {
  if (!v) throw new TcError(401, "VERIFY", "Confirm your e-mail address first: we send a 6-digit code to the address this invitation was sent to.");
};
const needOpen = (inv: PortalInvitation) => {
  const why = biddingOpen(inv);
  if (why) throw new TcError(410, "CLOSED", why);
};

async function route(req: NextRequest, method: string, p: string[], inv: PortalInvitation, verified: boolean): Promise<NextResponse> {
  const t = inv.tender;
  // ---- the summary (anyone with the link) + the rest once verified
  if (p.length === 0 && method === "GET") {
    await db.$executeRawUnsafe(`UPDATE tc_invitations SET viewed_at = now(), updated_at = clock_timestamp() WHERE id = $1::uuid AND viewed_at IS NULL`, inv.id);
    const email = await invitedEmail(inv.id);
    const base = {
      company: inv.company_name,
      answer: inv.answer,
      closedReason: biddingOpen(inv),
      verified,
      maskedEmail: email ? mask(email) : null,
      tender: {
        title: t.title,
        packageNumber: t.package_number,
        projectName: t.project_name,
        trade: t.trade,
        location: t.location,
        description: t.description,
        inviterCompany: t.inviter_company,
        inviterName: t.inviter_name,
        currency: t.currency,
        dueAt: t.due_at,
      },
    };
    if (!verified) return json(200, base);
    return json(200, { ...base, bidForm: t.bid_form, ...(await portalState(inv)) });
  }
  // ---- unsubscribe / report: no code needed (the link went to that mailbox), also after expiry
  if (p[0] === "unsubscribe" && method === "POST") {
    const r = await db.$queryRawUnsafe<{ email_hash: string | null }[]>(`SELECT email_hash FROM tc_invitations WHERE id = $1::uuid`, inv.id);
    if (r[0]?.email_hash) await db.$executeRawUnsafe(`INSERT INTO tc_suppressions (email_hash, reason) VALUES ($1, 'unsubscribed') ON CONFLICT (email_hash) DO UPDATE SET reason = 'unsubscribed'`, r[0].email_hash);
    await event({ tenantId: inv.tenant_id, invitationId: inv.id, actor: "contractor", event: "unsubscribed" });
    return json(200, { ok: true });
  }
  if (p[0] === "report" && method === "POST") {
    const b = await body(req);
    const already = await db.$queryRawUnsafe<{ id: string }[]>(`SELECT id::text FROM tc_abuse_reports WHERE invitation_id = $1::uuid`, inv.id);
    if (!already[0])
      await db.$executeRawUnsafe(`INSERT INTO tc_abuse_reports (invitation_id, tenant_id, reason) VALUES ($1::uuid, $2, $3)`, inv.id, inv.tenant_id, String(b.reason ?? "").slice(0, 500) || null);
    await event({ tenantId: inv.tenant_id, invitationId: inv.id, actor: "contractor", event: "reported" });
    return json(200, { ok: true });
  }
  if (inv.expired) throw new TcError(410, "EXPIRED", "This invitation link has expired.");
  // ---- e-mail code -> portal session
  if (p[0] === "code" && method === "POST") {
    const sent = await db.$queryRawUnsafe<{ n: bigint }[]>(
      `SELECT COUNT(*) AS n FROM tc_events WHERE invitation_id = $1::uuid AND event = 'code_sent' AND at > now() - interval '1 hour'`,
      inv.id,
    );
    if (Number(sent[0]?.n ?? 0) >= LIMITS.codeSendsPerInvitationPerHour) throw new TcError(429, "RATE_LIMITED", "Too many codes requested. Try again in an hour.");
    const email = await invitedEmail(inv.id);
    if (!email) throw new TcError(409, "NO_ADDRESS", "The address this invitation was sent to is no longer on file. Contact Bidcore.");
    const code = newCode();
    await db.$executeRawUnsafe(
      `INSERT INTO tc_portal_codes (invitation_id, code_hash, expires_at, attempts) VALUES ($1::uuid, $2, now() + interval '15 minutes', 0)
       ON CONFLICT (invitation_id) DO UPDATE SET code_hash = EXCLUDED.code_hash, expires_at = EXCLUDED.expires_at, attempts = 0`,
      inv.id,
      codeHash(inv.id, code, secret()),
    );
    await sendMail({
      to: email,
      subject: `Your Bidcore code: ${code}`,
      text: `Your code to open the tender "${t.title}" from ${t.inviter_company} is ${code}. It is valid for 15 minutes.`,
      html: `<p>Your code to open the tender "${t.title.replace(/[<>&]/g, "")}" from ${t.inviter_company.replace(/[<>&]/g, "")} is <b>${code}</b>. It is valid for 15 minutes.</p>`,
    });
    await event({ tenantId: inv.tenant_id, invitationId: inv.id, actor: "contractor", event: "code_sent" });
    return json(200, { ok: true, sentTo: mask(email) });
  }
  if (p[0] === "verify" && method === "POST") {
    const code = String((await body(req)).code ?? "").trim();
    const r = await db.$queryRawUnsafe<{ code_hash: string; ok: boolean; attempts: number }[]>(
      `SELECT code_hash, expires_at > now() AS ok, attempts FROM tc_portal_codes WHERE invitation_id = $1::uuid`,
      inv.id,
    );
    if (!r[0] || !r[0].ok) throw new TcError(400, "EXPIRED_CODE", "The code has expired. Ask for a new one.");
    if (r[0].attempts >= LIMITS.codeAttempts) throw new TcError(429, "TOO_MANY", "Too many wrong codes. Ask for a new one.");
    if (!/^\d{6}$/.test(code) || !sameHex(r[0].code_hash, codeHash(inv.id, code, secret()))) {
      await db.$executeRawUnsafe(`UPDATE tc_portal_codes SET attempts = attempts + 1 WHERE invitation_id = $1::uuid`, inv.id);
      throw new TcError(400, "WRONG_CODE", "That code is not right.");
    }
    await db.$executeRawUnsafe(`DELETE FROM tc_portal_codes WHERE invitation_id = $1::uuid`, inv.id);
    await event({ tenantId: inv.tenant_id, invitationId: inv.id, actor: "contractor", event: "verified", detail: clientIpHash(req.headers) });
    const res = json(200, { ok: true });
    res.cookies.set(PORTAL_COOKIE, signPortal(inv.id, LIMITS.portalHours, secret()), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: LIMITS.portalHours * 3600,
    });
    return res;
  }
  needVerified(verified);
  // ---- everything below: verified contractor of THIS invitation
  if (p[0] === "answer" && method === "POST") {
    needOpen(inv);
    const a = (await body(req)).answer;
    if (!ANSWERS.includes(a as Answer)) throw new TcError(400, "BAD_ANSWER", "Choose Bidding, Not bidding or Not sure.");
    await setAnswer(inv, a as Answer);
    return json(200, { ok: true });
  }
  if (p[0] === "files" && p.length === 1 && method === "POST") {
    needOpen(inv);
    return json(200, await beginFile({ tenantId: inv.tenant_id, tenderId: inv.tender_id, owner: "contractor", invitationId: inv.id }, await body(req)));
  }
  if (p[0] === "files" && isUuid(p[1])) {
    const f = await fileById(p[1]);
    const mine = f && f.owner === "contractor" && f.invitation_id === inv.id;
    const tenders = f && f.owner === "inviter" && f.tender_id === inv.tender_id && f.status === "ready";
    if (!f || (!mine && !tenders)) throw new TcError(404, "NOT_FOUND", "No such file.");
    if (p[2] === "chunks" && method === "PUT" && mine) {
      needOpen(inv);
      const buf = new Uint8Array(await req.arrayBuffer());
      if (buf.length > LIMITS.chunkBytes) throw new TcError(413, "TOO_LARGE", "A piece can be at most 4 MB.");
      await putChunk(f, Number(p[2 + 1]), buf);
      return json(200, { ok: true });
    }
    if (p[2] === "complete" && method === "POST" && mine) {
      await completeFile(f);
      return json(200, { ok: true });
    }
    if (p.length === 2 && method === "GET" && f.status === "ready") {
      await event({ tenantId: inv.tenant_id, invitationId: inv.id, actor: "contractor", event: "file_downloaded", detail: f.id });
      return new NextResponse(fileStream(f), {
        status: 200,
        headers: {
          "Content-Type": f.mime,
          "Content-Length": String(f.size),
          "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(f.name)}`,
          "Cache-Control": "private, no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    throw new TcError(404, "NOT_FOUND", "No such file.");
  }
  if (p[0] === "bid" && method === "POST") {
    needOpen(inv);
    const b = await body(req);
    const parsed = parseBid(b.bid);
    if (!parsed.ok) throw new TcError(400, "BAD_BID", parsed.error);
    const key = typeof b.requestKey === "string" && /^[A-Za-z0-9-]{8,64}$/.test(b.requestKey) ? b.requestKey : null;
    if (!key) throw new TcError(400, "BAD_REQUEST", "Missing request key.");
    return json(200, await submitBid(inv, parsed.bid, key, Array.isArray(b.fileIds) ? b.fileIds.map(String) : []));
  }
  if (p[0] === "messages" && method === "GET") return json(200, { messages: (await portalState(inv)).messages });
  if (p[0] === "messages" && method === "POST") {
    const sent = await db.$queryRawUnsafe<{ n: bigint }[]>(
      `SELECT COUNT(*) AS n FROM tc_messages WHERE invitation_id = $1::uuid AND sender = 'contractor' AND created_at > now() - interval '1 hour'`,
      inv.id,
    );
    if (Number(sent[0]?.n ?? 0) >= 30) throw new TcError(429, "RATE_LIMITED", "Too many messages. Try again in an hour.");
    return json(200, await postMessage(inv.id, "contractor", (await body(req)).body, inv.tenant_id, "contractor"));
  }
  if (p[0] === "contact" && method === "POST") {
    const b = await body(req);
    const cr = await db.$queryRawUnsafe<{ status: string }[]>(`SELECT status FROM tc_contact_requests WHERE invitation_id = $1::uuid`, inv.id);
    if (!cr[0]) throw new TcError(404, "NO_REQUEST", "There is no contact request.");
    if (cr[0].status !== "pending") throw new TcError(409, "DECIDED", "You already answered this request.");
    if (b.decision === "decline") {
      await db.$executeRawUnsafe(
        `UPDATE tc_contact_requests SET status = 'declined', decided_at = now(), decided_ip = $2 WHERE invitation_id = $1::uuid AND status = 'pending'`,
        inv.id,
        clientIpHash(req.headers),
      );
      await db.$executeRawUnsafe(`UPDATE tc_invitations SET updated_at = clock_timestamp() WHERE id = $1::uuid`, inv.id);
      await event({ tenantId: inv.tenant_id, invitationId: inv.id, actor: "contractor", event: "contact_declined" });
      return json(200, { ok: true, status: "declined" });
    }
    if (b.decision !== "approve") throw new TcError(400, "BAD_DECISION", "Approve or decline.");
    const s = parseShare(b, (await invitedEmail(inv.id)) ?? "");
    if (!s.ok) throw new TcError(400, "BAD_SHARE", s.error);
    await db.$executeRawUnsafe(
      `UPDATE tc_contact_requests SET status = 'approved', decided_at = now(), decided_ip = $2, shared = $3::jsonb WHERE invitation_id = $1::uuid AND status = 'pending'`,
      inv.id,
      clientIpHash(req.headers),
      JSON.stringify(s.shared),
    );
    await db.$executeRawUnsafe(`UPDATE tc_invitations SET updated_at = clock_timestamp() WHERE id = $1::uuid`, inv.id);
    await event({
      tenantId: inv.tenant_id,
      invitationId: inv.id,
      actor: "contractor",
      event: "contact_approved",
      detail: `shared ${Object.entries(s.shared).filter(([, v]) => v).map(([k]) => k).join(", ")} with ${inv.tenant_id}`,
    });
    return json(200, { ok: true, status: "approved" });
  }
  throw new TcError(404, "NOT_FOUND", "Unknown request.");
}

export const GET = (req: NextRequest, ctx: Ctx) => handle(req, ctx, "GET");
export const POST = (req: NextRequest, ctx: Ctx) => handle(req, ctx, "POST");
export const PUT = (req: NextRequest, ctx: Ctx) => handle(req, ctx, "PUT");
