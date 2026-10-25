import "server-only";
import { db } from "@/lib/db";
import { companiesOf, manageableCompany, requireUser } from "./auth";
import { MP } from "./constants";

type SP = Record<string, string | string[] | undefined>;
export const first = (v: string | string[] | undefined) => ((Array.isArray(v) ? v[0] : v) ?? "").trim();

/** The signed-in member plus the company they are managing (?company=, else their first). `company` is null when they manage none. */
export async function loadDashboard(sp: SP, path = `${MP}/dashboard`) {
  const user = await requireUser(path);
  const companies = await companiesOf(user.id);
  const wanted = first(sp.company);
  const company = wanted ? (await manageableCompany(user.id, user.email, wanted)) ?? companies[0] ?? null : companies[0] ?? null;
  return { user, companies, company };
}

export type DashboardCompany = NonNullable<Awaited<ReturnType<typeof loadDashboard>>["company"]>;

/** Profile completion guidance. Optional fields are suggestions, never blockers for a basic profile. */
export function completion(c: DashboardCompany, listingCount: number) {
  const checks: { label: string; done: boolean; href: string }[] = [
    { label: "Add a company description", done: !!c.about, href: "profile" },
    { label: "Add a logo", done: !!c.logoUrl, href: "profile" },
    { label: "Add a phone number or business email", done: !!(c.phone || c.email), href: "profile" },
    { label: "Add your address and PIN code", done: !!(c.address && c.pinCode), href: "profile" },
    { label: "List what you offer (specialisations or capabilities)", done: c.specializations.length + c.capabilities.length > 0, href: "profile" },
    { label: "Add certifications and credentials", done: c.certifications.length > 0, href: "profile" },
    { label: "Describe your areas served", done: c.operatingLocations.length > 0, href: "profile" },
    { label: "Publish at least one product or service", done: listingCount > 0, href: "listings" },
  ];
  const done = checks.filter((x) => x.done).length;
  return { checks, percent: Math.round((done / checks.length) * 100) };
}

/** Counts of tracked events only (page-view beacon + enquiries). Nothing is estimated. */
export async function analytics(companyId: string, days = 30) {
  const since = new Date(Date.now() - days * 86400_000);
  const g = await db.marketplaceEvent.groupBy({ by: ["type"], where: { companyId, createdAt: { gt: since } }, _count: { _all: true } });
  const n = (t: string) => g.find((x) => x.type === t)?._count._all ?? 0;
  return { days, companyViews: n("company_view"), listingViews: n("listing_view"), enquiries: n("enquiry") };
}

/** Page views per listing over the last `days` days (tracked events only). */
export async function listingViews(companyId: string, days = 30) {
  const since = new Date(Date.now() - days * 86400_000);
  const g = await db.marketplaceEvent.groupBy({ by: ["listingId"], where: { companyId, type: "listing_view", listingId: { not: null }, createdAt: { gt: since } }, _count: { _all: true } });
  return new Map(g.map((x) => [x.listingId as string, x._count._all]));
}
