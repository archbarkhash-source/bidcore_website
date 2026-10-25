import "server-only";
import { createHmac, randomBytes } from "node:crypto";
import { db } from "@/lib/db";
import { EMAIL_RE, normalizePhone } from "./identity";
import { visibleCompany } from "./queries";
import { confirmToBuyer, notifySupplier, type EnquiryMail } from "./notify";

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const SPAM_WORDS = /\b(crypto|bitcoin|casino|forex|viagra|loan offer|seo services|backlinks?|telegram|whatsapp group|earn \$|work from home)\b/i;
const URL_RE = /(https?:\/\/|www\.)\S+/gi;

export interface EnquiryInput {
  listingId?: unknown;
  companyId?: unknown;
  name?: unknown;
  company?: unknown;
  email?: unknown;
  phone?: unknown;
  quantity?: unknown;
  unit?: unknown;
  location?: unknown;
  projectType?: unknown;
  timeline?: unknown;
  message?: unknown;
  consent?: unknown;
  trap?: unknown; // honeypot - real people never fill it
}

export type EnquiryResult = { ok: true; ref: string } | { ok: false; status: number; error: string; field?: string };

function hashIp(ip: string): string {
  return createHmac("sha256", process.env.SESSION_SECRET ?? "marketplace").update(ip).digest("hex").slice(0, 32);
}

export async function createEnquiry(input: EnquiryInput, ip: string, userId: string | null): Promise<EnquiryResult> {
  // A bot that fills the hidden field gets a normal-looking answer and nothing is stored.
  if (clean(input.trap, 50)) return { ok: true, ref: "ENQ-RECEIVED" };

  const name = clean(input.name, 120);
  const email = clean(input.email, 200).toLowerCase();
  const phoneRaw = clean(input.phone, 40);
  const message = clean(input.message, 3000);
  if (name.length < 2) return { ok: false, status: 400, error: "Enter your name.", field: "name" };
  if (!EMAIL_RE.test(email)) return { ok: false, status: 400, error: "Enter a valid email address.", field: "email" };
  if (phoneRaw && !normalizePhone(phoneRaw)) return { ok: false, status: 400, error: "Enter a valid phone number or leave it blank.", field: "phone" };
  if (message.length < 20) return { ok: false, status: 400, error: "Describe your requirement in at least a couple of sentences (20+ characters).", field: "message" };
  if (input.consent !== true) return { ok: false, status: 400, error: "Please confirm you are happy for these details to be shared with the supplier.", field: "consent" };

  // Resolve the target: a published listing of a published company, or a published company profile.
  let listing: { id: string; kind: string; title: string; companyId: string } | null = null;
  if (typeof input.listingId === "string" && input.listingId) {
    listing = await db.marketplaceListing.findFirst({
      where: { id: input.listingId, status: "published", company: visibleCompany },
      select: { id: true, kind: true, title: true, companyId: true },
    });
    if (!listing) return { ok: false, status: 404, error: "This listing is no longer available." };
  }
  const companyId = listing?.companyId ?? (typeof input.companyId === "string" ? input.companyId : "");
  const company = await db.company.findFirst({
    where: { id: companyId, ...visibleCompany },
    select: { id: true, name: true, displayName: true, email: true, claimed: true, claimedById: true },
  });
  if (!company) return { ok: false, status: 404, error: "This company is no longer available." };

  // Spam prevention: per-IP and per-address limits, and an identical repeat is not stored twice.
  const ipHash = hashIp(ip);
  const since = (h: number) => new Date(Date.now() - h * 3600_000);
  const [byIp, byEmail, duplicate] = await Promise.all([
    db.marketplaceEnquiry.count({ where: { ipHash, createdAt: { gt: since(1) } } }),
    db.marketplaceEnquiry.count({ where: { buyerEmail: email, createdAt: { gt: since(24) } } }),
    db.marketplaceEnquiry.findFirst({ where: { buyerEmail: email, companyId: company.id, listingId: listing?.id ?? null, message, createdAt: { gt: since(24) } }, select: { ref: true } }),
  ]);
  if (duplicate) return { ok: true, ref: duplicate.ref };
  if (byIp >= 5 || byEmail >= 10) return { ok: false, status: 429, error: "You have sent several enquiries recently. Please wait a while before sending another." };

  const urls = (message.match(URL_RE) ?? []).length;
  const flagReason = urls >= 2 ? "Contains several links" : SPAM_WORDS.test(message) ? "Matches spam wording" : null;

  const ref = `ENQ-${randomBytes(4).toString("hex").toUpperCase()}`;
  const unit = clean(input.unit, 30);
  const quantity = clean(input.quantity, 60);
  const row = await db.marketplaceEnquiry.create({
    data: {
      ref,
      kind: listing ? listing.kind : "company",
      companyId: company.id,
      listingId: listing?.id ?? null,
      userId,
      buyerName: name,
      buyerCompany: clean(input.company, 160) || null,
      buyerEmail: email,
      buyerPhone: phoneRaw || null,
      quantity: quantity ? `${quantity}${unit ? ` ${unit}` : ""}` : null,
      unit: unit || null,
      location: clean(input.location, 160) || null,
      projectType: clean(input.projectType, 120) || null,
      timeline: clean(input.timeline, 120) || null,
      message,
      flagged: !!flagReason,
      flagReason,
      ipHash,
      events: { create: { type: "created", actor: "buyer", actorId: userId, body: flagReason ? `Held for review: ${flagReason}` : null } },
    },
  });
  await db.marketplaceEvent.create({ data: { type: "enquiry", companyId: company.id, listingId: listing?.id ?? null } }).catch(() => {});

  // Held enquiries are not delivered until an admin releases them.
  if (!flagReason) await deliver(row.id);
  return { ok: true, ref };
}

/** Notify the supplier and confirm to the buyer. Used on creation and when an admin releases a held enquiry. */
export async function deliver(enquiryId: string) {
  const e = await db.marketplaceEnquiry.findUnique({
    where: { id: enquiryId },
    include: { listing: { select: { title: true } }, company: { select: { name: true, displayName: true, email: true, claimed: true, claimedById: true, notifyEnquiries: true } } },
  });
  if (!e) return;
  const owner = e.company.claimedById ? await db.user.findUnique({ where: { id: e.company.claimedById }, select: { email: true } }) : null;
  const to = owner?.email ?? e.company.email;
  const supplierName = e.company.displayName || e.company.name;
  const mail: EnquiryMail = {
    ref: e.ref,
    subject: e.listing?.title ?? `${supplierName} (company enquiry)`,
    buyerName: e.buyerName,
    buyerCompany: e.buyerCompany,
    buyerEmail: e.buyerEmail,
    buyerPhone: e.buyerPhone,
    quantity: e.quantity,
    location: e.location,
    timeline: e.timeline,
    message: e.message,
  };
  const shared = ["name", ...(e.buyerCompany ? ["company"] : []), "email", ...(e.buyerPhone ? ["phone"] : []), "requirement details"];
  await Promise.all([to && e.company.notifyEnquiries ? notifySupplier(to, !!owner, mail) : Promise.resolve(), confirmToBuyer(mail, supplierName, shared)]);
}
