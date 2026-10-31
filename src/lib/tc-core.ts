// Tender invitation gateway (Phase 2): the pure rules, no database or network, so they can be unit-tested (scripts/tc-gateway.test.ts).
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";

export const ANSWERS = ["bidding", "not_bidding", "not_sure"] as const;
export type Answer = (typeof ANSWERS)[number];

export const newInviteToken = () => randomBytes(32).toString("base64url"); // 256 bits: not guessable
export const hashInviteToken = (t: string) => createHash("sha256").update(`bidcore-invite|${t}`).digest("hex");
export const isInviteToken = (t: unknown): t is string => typeof t === "string" && /^[A-Za-z0-9_-]{40,60}$/.test(t);
export const newCode = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

/** Keyed hash of an e-mail address: lets the suppression list (unsubscribed / bounced) match an address without storing it. */
export function emailHash(email: string, secret: string): string {
  return createHmac("sha256", `bidcore-email|${secret}`).update(email.trim().toLowerCase()).digest("hex");
}
export const codeHash = (invitationId: string, code: string, secret: string) => createHmac("sha256", `bidcore-portal-code|${secret}`).update(`${invitationId}|${code}`).digest("hex");

export function sameHex(a: string, b: string): boolean {
  const x = Buffer.from(a, "hex");
  const y = Buffer.from(b, "hex");
  return x.length === y.length && x.length > 0 && timingSafeEqual(x, y);
}

/** An invitation link stays valid until 30 days after the tender's due date (60 days from sending when there is none), never more than 180 days. */
export function inviteExpiry(dueAt: Date | null, now = new Date()): Date {
  const day = 86400000;
  const base = dueAt ? dueAt.getTime() + 30 * day : now.getTime() + 60 * day;
  return new Date(Math.min(Math.max(base, now.getTime() + 7 * day), now.getTime() + 180 * day));
}

// ---- the contractor's portal session: a signed cookie for ONE invitation, after the 6-digit code sent to the invited address was entered
export const PORTAL_COOKIE = "bc_invite";
export function signPortal(invitationId: string, hours: number, secret: string, now = Date.now()): string {
  const exp = Math.floor(now / 1000) + hours * 3600;
  const body = `${invitationId}.${exp}`;
  return `${body}.${createHmac("sha256", `bidcore-portal|${secret}`).update(body).digest("base64url")}`;
}
export function readPortal(value: string | undefined, secret: string, now = Date.now()): string | null {
  const m = /^([0-9a-f-]{36})\.(\d{9,11})\.([A-Za-z0-9_-]{43})$/.exec(value ?? "");
  if (!m) return null;
  const want = createHmac("sha256", `bidcore-portal|${secret}`).update(`${m[1]}.${m[2]}`).digest("base64url");
  if (want.length !== m[3].length || !timingSafeEqual(Buffer.from(want), Buffer.from(m[3]))) return null;
  return Number(m[2]) * 1000 > now ? m[1] : null;
}

// ---- tender data from the program
export interface TenderIn {
  title: string;
  packageNumber: string | null;
  projectName: string | null;
  trade: string | null;
  location: string | null;
  description: string | null;
  inviterCompany: string;
  inviterName: string | null;
  currency: string;
  dueAt: Date | null;
  bidForm: unknown;
  status: "open" | "closed" | "cancelled";
}

const str = (v: unknown, max: number): string | null => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : null);

export function parseTender(b: unknown): { ok: true; tender: TenderIn } | { ok: false; error: string } {
  const o = (b ?? {}) as Record<string, unknown>;
  const title = str(o.title, 300);
  const inviterCompany = str(o.inviterCompany, 300);
  if (!title) return { ok: false, error: "title is required" };
  if (!inviterCompany) return { ok: false, error: "inviterCompany is required" };
  let dueAt: Date | null = null;
  if (o.dueAt != null) {
    const d = new Date(String(o.dueAt));
    if (Number.isNaN(d.getTime())) return { ok: false, error: "dueAt is not a date" };
    dueAt = d;
  }
  const bidForm = o.bidForm ?? null;
  if (bidForm !== null && (typeof bidForm !== "object" || JSON.stringify(bidForm).length > 200_000)) return { ok: false, error: "bidForm must be an object under 200 KB" };
  const status = o.status === "closed" || o.status === "cancelled" ? o.status : "open";
  const currency = typeof o.currency === "string" && /^[A-Z]{3}$/.test(o.currency) ? o.currency : "INR";
  return {
    ok: true,
    tender: {
      title,
      packageNumber: str(o.packageNumber, 50),
      projectName: str(o.projectName, 300),
      trade: str(o.trade, 150),
      location: str(o.location, 300),
      description: str(o.description, 8000),
      inviterCompany,
      inviterName: str(o.inviterName, 200),
      currency,
      dueAt,
      bidForm,
      status,
    },
  };
}

export const isLocalRef = (r: unknown): r is string => typeof r === "string" && /^[A-Za-z0-9_.:-]{1,80}$/.test(r);
export const isUuid = (u: unknown): u is string => typeof u === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(u);

// ---- a bid from the contractor: the same shape the BidcoreAI program records (bid_packages_routes.BidFormSubmission)
export interface BidPayload {
  is_bidding: boolean;
  base_bid: number | null;
  alternates: string | null;
  exclusions: string | null;
  clarifications: string | null;
  bond_included: boolean;
  lead_time_weeks: number | null;
  notes: string | null;
  answers: Record<string, boolean | string>;
  line_item_prices: Record<string, number>;
  alternate_prices: Record<string, { amount: number; type: "add" | "deduct" } | null>;
}

const idKey = (k: string) => /^[A-Za-z0-9_.:-]{1,80}$/.test(k);
const money = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v < 1e13;

export function parseBid(b: unknown): { ok: true; bid: BidPayload } | { ok: false; error: string } {
  const o = (b ?? {}) as Record<string, unknown>;
  if (JSON.stringify(o).length > 100_000) return { ok: false, error: "The bid is too large." };
  if (typeof o.is_bidding !== "boolean") return { ok: false, error: "Say whether you are bidding." };
  const base = o.base_bid == null || o.base_bid === "" ? null : Number(o.base_bid);
  if (o.is_bidding && (base === null || !money(base))) return { ok: false, error: "Enter your total price (a number, 0 or more)." };
  const answers: Record<string, boolean | string> = {};
  for (const [k, v] of Object.entries((o.answers as Record<string, unknown>) ?? {})) {
    if (!idKey(k)) continue;
    if (typeof v === "boolean") answers[k] = v;
    else if (typeof v === "string") answers[k] = v.slice(0, 2000);
  }
  const line_item_prices: Record<string, number> = {};
  for (const [k, v] of Object.entries((o.line_item_prices as Record<string, unknown>) ?? {})) {
    if (!idKey(k) || v === null || v === "") continue;
    if (!money(Number(v))) return { ok: false, error: "Every line price must be a number, 0 or more." };
    line_item_prices[k] = Number(v);
  }
  const alternate_prices: BidPayload["alternate_prices"] = {};
  for (const [k, v] of Object.entries((o.alternate_prices as Record<string, unknown>) ?? {})) {
    if (!idKey(k)) continue;
    if (v === null) {
      alternate_prices[k] = null;
      continue;
    }
    const a = v as { amount?: unknown; type?: unknown };
    if (!money(Number(a.amount)) || (a.type !== "add" && a.type !== "deduct")) return { ok: false, error: "Every alternate needs an amount and add / deduct." };
    alternate_prices[k] = { amount: Number(a.amount), type: a.type };
  }
  const lead = o.lead_time_weeks == null || o.lead_time_weeks === "" ? null : Number(o.lead_time_weeks);
  if (lead !== null && (!Number.isInteger(lead) || lead < 0 || lead > 520)) return { ok: false, error: "Lead time must be a whole number of weeks." };
  return {
    ok: true,
    bid: {
      is_bidding: o.is_bidding,
      base_bid: o.is_bidding ? base : null,
      alternates: str(o.alternates, 5000),
      exclusions: str(o.exclusions, 5000),
      clarifications: str(o.clarifications, 5000),
      bond_included: o.bond_included === true,
      lead_time_weeks: lead,
      notes: str(o.notes, 5000),
      answers,
      line_item_prices,
      alternate_prices,
    },
  };
}

/** Required questions of the bid form that a bid leaves unanswered (the program checks the same rule). */
export function missingRequired(form: unknown, answers: Record<string, unknown>): string[] {
  const qs = ((form as { questions?: { id?: string; text?: string; required?: boolean; type?: string }[] })?.questions ?? []).filter((q) => q && q.required && q.id);
  return qs.filter((q) => !(q.id! in answers) || (q.type === "text" && !String(answers[q.id!] ?? "").trim())).map((q) => q.text ?? q.id!);
}

export function parseShare(b: unknown, fallbackEmail: string): { ok: true; shared: { name: string | null; email: string | null; phone: string | null } } | { ok: false; error: string } {
  const o = (b ?? {}) as Record<string, unknown>;
  const name = str(o.name, 200);
  const phone = str(o.phone, 40);
  const email: string | null = o.email === "" ? null : (str(o.email, 200) ?? (fallbackEmail || null));
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return { ok: false, error: "Enter a valid e-mail address." };
  if (phone && !/^[+0-9 ()-]{6,40}$/.test(phone)) return { ok: false, error: "Enter a valid phone number." };
  if (!email && !phone) return { ok: false, error: "Share at least an e-mail address or a phone number." };
  return { ok: true, shared: { name, email, phone } };
}

export const safeFileName = (n: unknown): string | null => {
  if (typeof n !== "string") return null;
  const s = n.replace(/[\\/:*?"<>|\u0000-\u001f]/g, "_").trim().slice(0, 200);
  return s && s !== "." && s !== ".." ? s : null;
};
const MIMES = /^(application\/(pdf|zip|x-zip-compressed|msword|vnd\.openxmlformats-officedocument\.[a-z.]+|vnd\.ms-excel|octet-stream)|image\/(png|jpeg|webp)|text\/(plain|csv))$/;
export const okMime = (m: unknown): m is string => typeof m === "string" && MIMES.test(m);
