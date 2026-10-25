"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { STATES } from "@/lib/data";
import { emailMatchesCompany } from "@/lib/company-domain";
import { audit } from "./audit";
import { manageableCompany, requireUser } from "./auth";
import { BUSINESS_TYPES, FREE_LISTING_LIMIT, MP, splitList, type AttributeDef } from "./constants";
import { findDuplicates } from "./dedupe";
import { sendReplyToBuyer } from "./notify";
import { domainOf, normalizeCin, normalizeGstin, normalizeName, normalizePhone, normalizeWebsite, normalizeEmail, PIN_RE, safeUrl } from "./identity";
import { uniqueLegacySlug, uniqueListingSlug, stateIdByName } from "./slugs";
import { getCategoryTree, flattenCategories } from "./queries";

// Server actions for the business side (onboarding, profile, listings, enquiries). Every action re-checks who the caller is and what they may manage;
// nothing relies on the page that rendered the form.

const str = (v: FormDataEntryValue | null | undefined, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const back = (path: string, params: Record<string, string>) => {
  const qs = new URLSearchParams(params).toString();
  return `${path}${path.includes("?") ? "&" : "?"}${qs}`;
};

// ── onboarding: claim / create ──────────────────────────────────────────────────────────────────────────────────────

export async function claimCompany(formData: FormData) {
  const user = await requireUser(`${MP}/list-your-business`);
  const companyId = str(formData.get("companyId"), 40);
  const here = `${MP}/list-your-business?claim=${companyId}`;
  const company = await db.company.findFirst({ where: { id: companyId, active: true } });
  if (!company) redirect(back(`${MP}/list-your-business`, { error: "That company was not found." }));

  if (company.claimedById === user.id) redirect(`${MP}/dashboard?company=${company.id}`);
  if (company.claimedById) redirect(back(here, { error: "This company is already managed by another member. If that is wrong, send a correction request from its profile page." }));

  if (emailMatchesCompany(user.email, company)) {
    await db.$transaction([
      db.company.update({ where: { id: company.id }, data: { claimed: true, claimedById: user.id, claimedAt: new Date() } }),
      db.companyClaim.create({ data: { companyId: company.id, userId: user.id, method: "domain", status: "approved", reviewNote: "Company-domain email matched the company's website / email domain.", reviewedAt: new Date() } }),
    ]);
    await audit("company", company.id, "claim.domain", user, { userId: user.id });
    redirect(`${MP}/dashboard?company=${company.id}&welcome=1`);
  }

  const evidence = str(formData.get("evidence"), 1500);
  const role = str(formData.get("role"), 120);
  if (!role || evidence.length < 20) redirect(back(here, { error: "Tell us your role and how we can confirm you act for this company (at least a couple of sentences)." }));
  const existing = await db.companyClaim.findFirst({ where: { companyId: company.id, userId: user.id, status: "pending" } });
  if (!existing) {
    const claim = await db.companyClaim.create({ data: { companyId: company.id, userId: user.id, method: "manual", roleAtCompany: role, evidence } });
    await audit("company", company.id, "claim.requested", user, { claimId: claim.id });
  }
  redirect(back(here, { sent: "1" }));
}

export async function createCompany(formData: FormData) {
  const user = await requireUser(`${MP}/list-your-business?new=1`);
  const here = `${MP}/list-your-business?new=1`;
  const fail = (error: string): never => redirect(back(here, { error }));

  const name = str(formData.get("name"), 300);
  const stateName = str(formData.get("state"), 100);
  const city = str(formData.get("city"), 120);
  const type = str(formData.get("type"), 100);
  const website = normalizeWebsite(str(formData.get("website"), 300));
  const email = normalizeEmail(str(formData.get("email"), 200));
  const phone = str(formData.get("phone"), 40);
  const cin = normalizeCin(str(formData.get("cin"), 30));
  const gstin = normalizeGstin(str(formData.get("gstin"), 30));
  const about = str(formData.get("about"), 4000) || null;

  if (name.length < 2) fail("Enter the company name.");
  if (!STATES.some((s) => s.name === stateName)) fail("Choose a state.");
  if (!BUSINESS_TYPES.includes(type)) fail("Choose a business type.");
  if (str(formData.get("website"), 300) && !website) fail("Enter a valid website address.");
  if (str(formData.get("email"), 200) && !email) fail("Enter a valid business email.");
  if (phone && !normalizePhone(phone)) fail("Enter a valid phone number.");
  if (!website && !email && !phone) fail("Add at least one way to contact the company: website, email or phone.");
  if (str(formData.get("cin"), 30) && !cin) fail("That CIN is not in a valid format.");
  if (str(formData.get("gstin"), 30) && !gstin) fail("That GSTIN is not in a valid format.");

  const stateId = await stateIdByName(stateName);
  if (!stateId) fail("That state is not available yet.");

  // Never create a second record for a business that is already in the directory.
  if (formData.get("confirmNew") !== "1") {
    const dups = await findDuplicates({ name, stateId, website, cin, gstin });
    if (dups.length) redirect(back(`${MP}/list-your-business`, { q: name, dup: "1" }));
  }

  const proven = emailMatchesCompany(user.email, { website, email });
  const company = await db.company.create({
    data: {
      name,
      slug: await uniqueLegacySlug(stateId!, name),
      stateId: stateId!,
      cityName: city || null,
      type,
      website,
      email,
      phone: phone || null,
      about,
      cin,
      gstin,
      domain: domainOf(website) ?? (email ? email.split("@")[1] : null),
      normalizedName: normalizeName(name),
      sourceType: "member",
      sourceNote: "Submitted by the company through Bidcore",
      claimedById: user.id,
      claimed: proven,
      claimedAt: proven ? new Date() : null,
      marketplaceStatus: "unlisted",
    },
  });
  await audit("company", company.id, "company.created", user, { proven });
  redirect(`${MP}/dashboard?company=${company.id}&welcome=1`);
}

// ── profile ─────────────────────────────────────────────────────────────────────────────────────────────────────────

export async function saveProfile(formData: FormData) {
  const user = await requireUser(`${MP}/dashboard`);
  const companyId = str(formData.get("companyId"), 40);
  const company = await manageableCompany(user.id, user.email, companyId);
  const here = `${MP}/dashboard/profile?company=${companyId}`;
  if (!company) redirect(back(here, { error: "You cannot manage this company." }));
  const fail = (error: string): never => redirect(back(here, { error }));

  const website = normalizeWebsite(str(formData.get("website"), 300));
  const email = normalizeEmail(str(formData.get("email"), 200));
  const phone = str(formData.get("phone"), 40);
  const gstin = normalizeGstin(str(formData.get("gstin"), 30));
  const pin = str(formData.get("pinCode"), 10);
  const logo = str(formData.get("logoUrl"), 500);
  const founded = str(formData.get("founded"), 4);
  const type = str(formData.get("type"), 100);
  if (str(formData.get("website"), 300) && !website) fail("Enter a valid website address.");
  if (str(formData.get("email"), 200) && !email) fail("Enter a valid business email.");
  if (phone && !normalizePhone(phone)) fail("Enter a valid phone number.");
  if (str(formData.get("gstin"), 30) && !gstin) fail("That GSTIN is not in a valid format.");
  if (pin && !PIN_RE.test(pin)) fail("Enter a valid 6-digit PIN code.");
  if (logo && !safeUrl(logo)) fail("The logo must be a web address starting with https://");
  if (founded && !(Number(founded) >= 1800 && Number(founded) <= new Date().getFullYear())) fail("Enter a valid founding year.");
  if (type && !BUSINESS_TYPES.includes(type)) fail("Choose a business type from the list.");

  await db.company.update({
    where: { id: company.id },
    data: {
      displayName: str(formData.get("displayName"), 200) || null,
      type: type || company.type,
      about: str(formData.get("about"), 4000) || null,
      website,
      email,
      phone: phone || null,
      address: str(formData.get("address"), 400) || null,
      cityName: str(formData.get("city"), 120) || null,
      pinCode: pin || null,
      gstin,
      logoUrl: logo ? safeUrl(logo) : null,
      founded: founded ? Number(founded) : null,
      sizeRange: str(formData.get("sizeRange"), 60) || null,
      specializations: splitList(str(formData.get("specializations"), 1500), 20, 60),
      capabilities: splitList(str(formData.get("capabilities"), 1500), 30, 80),
      certifications: splitList(str(formData.get("certifications"), 1500), 30, 80),
      industries: splitList(str(formData.get("industries"), 1500), 20, 60),
      operatingLocations: splitList(str(formData.get("operatingLocations"), 1500), 30, 60),
      projectExperience: str(formData.get("projectExperience"), 4000) || null,
      contactPublic: formData.get("contactPublic") === "on",
      domain: domainOf(website) ?? company.domain,
    },
  });
  await audit("company", company.id, "profile.updated", user);
  if (company.marketplaceSlug) revalidatePath(`${MP}/companies/${company.marketplaceSlug}`);
  redirect(back(here, { saved: "1" }));
}

export async function saveSettings(formData: FormData) {
  const user = await requireUser(`${MP}/dashboard`);
  const companyId = str(formData.get("companyId"), 40);
  const company = await manageableCompany(user.id, user.email, companyId);
  if (!company) redirect(`${MP}/dashboard`);
  await db.company.update({ where: { id: company.id }, data: { notifyEnquiries: formData.get("notifyEnquiries") === "on", contactPublic: formData.get("contactPublic") === "on" } });
  await audit("company", company.id, "settings.updated", user);
  if (company.marketplaceSlug) revalidatePath(`${MP}/companies/${company.marketplaceSlug}`);
  redirect(back(`${MP}/dashboard/settings?company=${company.id}`, { saved: "1" }));
}

export async function submitForPublication(formData: FormData) {
  const user = await requireUser(`${MP}/dashboard`);
  const companyId = str(formData.get("companyId"), 40);
  const company = await manageableCompany(user.id, user.email, companyId);
  const here = `${MP}/dashboard?company=${companyId}`;
  if (!company) redirect(MP);
  if (company.marketplaceStatus === "suspended") redirect(back(here, { error: "This profile is suspended. Contact Bidcore support." }));
  if (company.marketplaceStatus === "published" || company.marketplaceStatus === "pending") redirect(here);
  if (!company.name || !company.type || !(company.website || company.email || company.phone || company.about)) redirect(back(here, { error: "Add at least a contact method or a description before submitting." }));
  await db.company.update({ where: { id: company.id }, data: { marketplaceStatus: "pending", moderationNote: null } });
  await audit("company", company.id, "publication.submitted", user);
  redirect(back(here, { submitted: "1" }));
}

export async function withdrawFromMarketplace(formData: FormData) {
  const user = await requireUser(`${MP}/dashboard`);
  const companyId = str(formData.get("companyId"), 40);
  const company = await manageableCompany(user.id, user.email, companyId);
  if (!company) redirect(MP);
  if (company.marketplaceStatus === "suspended") redirect(`${MP}/dashboard?company=${company.id}`);
  await db.company.update({ where: { id: company.id }, data: { marketplaceStatus: "unlisted" } });
  await audit("company", company.id, "publication.withdrawn", user);
  if (company.marketplaceSlug) revalidatePath(`${MP}/companies/${company.marketplaceSlug}`);
  redirect(back(`${MP}/dashboard/settings?company=${company.id}`, { saved: "1" }));
}

// ── listings ────────────────────────────────────────────────────────────────────────────────────────────────────────

const lines = (v: string, max: number, len = 80) => splitList(v, max, len);

export async function saveListing(formData: FormData) {
  const user = await requireUser(`${MP}/dashboard/listings`);
  const companyId = str(formData.get("companyId"), 40);
  const listingId = str(formData.get("id"), 40);
  const kind = formData.get("kind") === "service" ? "service" : "product";
  const intent = formData.get("intent") === "submit" ? "submit" : "draft";
  const company = await manageableCompany(user.id, user.email, companyId);
  const base = `${MP}/dashboard/listings/${listingId || "new"}?company=${companyId}&kind=${kind}`;
  if (!company) redirect(`${MP}/dashboard`);
  const fail = (error: string): never => redirect(back(base, { error }));

  const existing = listingId ? await db.marketplaceListing.findFirst({ where: { id: listingId, companyId: company.id } }) : null;
  if (listingId && !existing) redirect(`${MP}/dashboard/listings?company=${company.id}`);
  if (!existing) {
    const count = await db.marketplaceListing.count({ where: { companyId: company.id, status: { not: "archived" } } });
    if (count >= FREE_LISTING_LIMIT) fail(`The free plan allows ${FREE_LISTING_LIMIT} active listings. Archive one to add another.`);
  }

  const title = str(formData.get("title"), 200);
  const categoryId = str(formData.get("categoryId"), 40);
  if (title.length < 3) fail("Enter a title.");

  // Category-specific specification fields: only keys the category defines are stored.
  const tree = flattenCategories(await getCategoryTree());
  const category = categoryId ? tree.find((c) => c.id === categoryId && !c.builtin) : undefined;
  if (categoryId && !category) fail("Choose a category from the list (categories are set up by Bidcore admins).");
  const specs: Record<string, string> = {};
  for (const a of (category?.attributes ?? []) as AttributeDef[]) {
    const v = str(formData.get(`spec_${a.key}`), 200);
    if (!v) continue;
    if (a.type === "number" && Number.isNaN(Number(v))) fail(`${a.label} must be a number.`);
    if (a.type === "select" && a.options && !a.options.includes(v)) fail(`Choose a valid ${a.label}.`);
    specs[a.key] = v;
  }

  const images = lines(str(formData.get("images"), 3000), 6, 500).map((u) => safeUrl(u));
  if (images.some((u) => !u)) fail("Image addresses must start with https://");
  const documents = lines(str(formData.get("documents"), 3000), 6, 600).map((row) => {
    const [name, url] = row.includes("|") ? row.split("|").map((x) => x.trim()) : [row.split("/").pop() || "Document", row];
    return { name: (name || "Document").slice(0, 120), url: safeUrl(url) };
  });
  if (documents.some((d) => !d.url)) fail('Documents must be written as "Name | https://link".');

  const priceMode = formData.get("priceMode") === "indicative" ? "indicative" : "on_request";
  const priceText = str(formData.get("priceText"), 200);
  if (priceMode === "indicative" && !priceText) fail("Enter the indicative price, or choose Price on request.");

  if (intent === "submit") {
    if (!category) fail("Choose a category before submitting.");
    if (!(str(formData.get("shortDescription"), 400) || str(formData.get("description"), 6000))) fail("Add a short description before submitting.");
    if (category!.kind !== "both" && category!.kind !== kind) fail(`That category is for ${category!.kind}s. Choose a ${kind} category.`);
  }

  const data: Prisma.MarketplaceListingUncheckedUpdateInput = {
    title,
    categoryId: category?.id ?? null,
    brand: str(formData.get("brand"), 120) || null,
    shortDescription: str(formData.get("shortDescription"), 400) || null,
    description: str(formData.get("description"), 6000) || null,
    specs,
    applications: lines(str(formData.get("applications"), 1500), 15),
    variants: lines(str(formData.get("variants"), 1500), 20),
    unit: str(formData.get("unit"), 30) || null,
    moq: str(formData.get("moq"), 80) || null,
    priceMode,
    priceText: priceMode === "indicative" ? priceText : null,
    supplyLocations: lines(str(formData.get("supplyLocations"), 1500), 30, 60),
    availability: str(formData.get("availability"), 60) || null,
    images: images as string[],
    documents: documents as Prisma.InputJsonValue,
    scope: kind === "service" ? str(formData.get("scope"), 4000) || null : null,
    projectTypes: kind === "service" ? lines(str(formData.get("projectTypes"), 1500), 20, 60) : [],
    industries: kind === "service" ? lines(str(formData.get("industries"), 1500), 20, 60) : [],
    capabilities: kind === "service" ? lines(str(formData.get("capabilities"), 1500), 30) : [],
    certifications: kind === "service" ? lines(str(formData.get("certifications"), 1500), 30) : [],
    pricingBasis: kind === "service" ? str(formData.get("pricingBasis"), 300) || null : null,
  };

  let saved;
  if (existing) {
    // A live listing stays live when its owner edits it (the change is in the audit log and an admin can unpublish); anything else follows the button pressed.
    const status = existing.status === "published" ? "published" : intent === "submit" ? "pending" : existing.status === "archived" ? "archived" : "draft";
    saved = await db.marketplaceListing.update({ where: { id: existing.id }, data: { ...data, status, rejectionReason: status === "pending" ? null : existing.rejectionReason } });
    await audit("listing", saved.id, existing.status === "published" ? "listing.edited_live" : "listing.updated", user);
  } else {
    saved = await db.marketplaceListing.create({
      data: { ...(data as Prisma.MarketplaceListingUncheckedCreateInput), kind, companyId: company.id, slug: await uniqueListingSlug(title), status: intent === "submit" ? "pending" : "draft" },
    });
    await audit("listing", saved.id, "listing.created", user);
  }
  revalidatePath(`${MP}/${kind === "product" ? "products" : "services"}/${saved.slug}`);
  redirect(back(`${MP}/dashboard/listings?company=${company.id}`, { saved: saved.status === "pending" ? "pending" : "1" }));
}

export async function listingAction(formData: FormData) {
  const user = await requireUser(`${MP}/dashboard/listings`);
  const id = str(formData.get("id"), 40);
  const action = str(formData.get("action"), 20);
  const listing = await db.marketplaceListing.findUnique({ where: { id }, include: { company: true } });
  if (!listing || !(await manageableCompany(user.id, user.email, listing.companyId))) redirect(`${MP}/dashboard`);
  const next = `${MP}/dashboard/listings?company=${listing.companyId}`;

  const data: Prisma.MarketplaceListingUpdateInput | null =
    action === "archive" ? { status: "archived" }
    : action === "restore" && listing.status === "archived" ? { status: "draft" }
    : action === "withdraw" && (listing.status === "published" || listing.status === "pending") ? { status: "draft" }
    : action === "submit" && (listing.status === "draft" || listing.status === "rejected") ? { status: "pending", rejectionReason: null }
    : action === "renew" && listing.status === "published" ? { expiresAt: new Date(Date.now() + 365 * 86400_000) }
    : null;
  if (!data) redirect(next);
  await db.marketplaceListing.update({ where: { id }, data });
  await audit("listing", id, `listing.${action}`, user);
  revalidatePath(`${MP}/${listing.kind === "product" ? "products" : "services"}/${listing.slug}`);
  redirect(back(next, { saved: "1" }));
}

// ── enquiries ───────────────────────────────────────────────────────────────────────────────────────────────────────

async function ownedEnquiry(user: { id: string; email: string }, id: string) {
  const e = await db.marketplaceEnquiry.findFirst({ where: { id, flagged: false }, include: { company: { select: { id: true, name: true, displayName: true } } } });
  if (!e || !(await manageableCompany(user.id, user.email, e.companyId))) return null;
  return e;
}

export async function updateEnquiryStatus(formData: FormData) {
  const user = await requireUser(`${MP}/dashboard/enquiries`);
  const id = str(formData.get("id"), 40);
  const status = str(formData.get("status"), 20);
  const e = await ownedEnquiry(user, id);
  if (!e) redirect(`${MP}/dashboard`);
  if (!["new", "responded", "in_discussion", "converted", "closed"].includes(status)) redirect(`${MP}/dashboard/enquiries/${id}`);
  await db.$transaction([
    db.marketplaceEnquiry.update({ where: { id }, data: { status } }),
    db.enquiryEvent.create({ data: { enquiryId: id, type: "status", actor: "supplier", actorId: user.id, body: status } }),
  ]);
  redirect(back(`${MP}/dashboard/enquiries/${id}`, { saved: "1" }));
}

export async function respondToEnquiry(formData: FormData) {
  const user = await requireUser(`${MP}/dashboard/enquiries`);
  const id = str(formData.get("id"), 40);
  const body = str(formData.get("body"), 3000);
  const e = await ownedEnquiry(user, id);
  const here = `${MP}/dashboard/enquiries/${id}`;
  if (!e) redirect(`${MP}/dashboard`);
  if (body.length < 5) redirect(back(here, { error: "Write a reply." }));
  await db.$transaction([
    db.enquiryEvent.create({ data: { enquiryId: id, type: "response", actor: "supplier", actorId: user.id, body } }),
    db.marketplaceEnquiry.update({ where: { id }, data: { status: e.status === "new" ? "responded" : e.status, respondedAt: e.respondedAt ?? new Date() } }),
  ]);
  await sendReplyToBuyer(e.buyerEmail, e.ref, e.company.displayName || e.company.name, body);
  redirect(back(here, { saved: "1" }));
}
