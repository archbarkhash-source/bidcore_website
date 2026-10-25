import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import DashboardShell, { Notice } from "@/components/marketplace/DashboardNav";
import { TrustBadges, primaryBtn, outlineBtn } from "@/components/marketplace/ui";
import { db } from "@/lib/db";
import { analytics, completion, first, loadDashboard } from "@/lib/marketplace/dashboard";
import { submitForPublication } from "@/lib/marketplace/actions";
import { COMPANY_STATUS_LABEL, MP } from "@/lib/marketplace/constants";

export const metadata: Metadata = { title: "Marketplace dashboard | Bidcore", robots: { index: false, follow: false } };

type SP = Record<string, string | string[] | undefined>;

export default async function DashboardHome({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { user, companies, company } = await loadDashboard(sp);

  if (!company) {
    const claims = await db.companyClaim.findMany({ where: { userId: user.id, status: "pending" }, include: { company: { select: { name: true } } } });
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-bold text-slate-900">Marketplace dashboard</h1>
        {claims.length > 0 && (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-medium">Claim requests awaiting review</p>
            <ul className="mt-1 list-disc pl-5">{claims.map((c) => <li key={c.id}>{c.company.name}</li>)}</ul>
          </div>
        )}
        <p className="mt-4 text-slate-600">You do not manage a company on the marketplace yet. Find your company to claim it, or add it if it is not listed.</p>
        <Link href={`${MP}/list-your-business`} className={`${primaryBtn} mt-5`}>List your business</Link>
      </div>
    );
  }

  const [listings, newEnquiries, pendingClaims, stats] = await Promise.all([
    db.marketplaceListing.groupBy({ by: ["status"], where: { companyId: company.id }, _count: { _all: true } }),
    db.marketplaceEnquiry.count({ where: { companyId: company.id, status: "new", flagged: false } }),
    db.companyClaim.count({ where: { companyId: company.id, status: "pending" } }),
    analytics(company.id),
  ]);
  const count = (s: string) => listings.find((l) => l.status === s)?._count._all ?? 0;
  const activeListings = listings.filter((l) => l.status !== "archived").reduce((n, l) => n + l._count._all, 0);
  const { checks, percent } = completion(company, activeListings);
  const q = `?company=${company.id}`;
  const canSubmit = company.marketplaceStatus === "unlisted" || company.marketplaceStatus === "rejected";

  return (
    <DashboardShell active="" company={company} companies={companies}>
      <Notice sp={sp} />
      {first(sp.error) === "" && null}
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">Listing status</h2>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">{COMPANY_STATUS_LABEL[company.marketplaceStatus] ?? company.marketplaceStatus}</span>
              <TrustBadges company={company} />
            </div>
            {company.marketplaceStatus === "published" && company.marketplaceSlug && (
              <p className="mt-2 text-sm"><Link className="text-brand-accent hover:underline" href={`${MP}/companies/${company.marketplaceSlug}`}>View your public profile</Link></p>
            )}
            {company.marketplaceStatus === "pending" && <p className="mt-2 text-sm text-slate-600">Your profile is awaiting review by the Bidcore team.</p>}
            {company.marketplaceStatus === "rejected" && <p className="mt-2 text-sm text-red-700">Not approved{company.moderationNote ? `: ${company.moderationNote}` : "."} Update your profile and submit again.</p>}
            {company.marketplaceStatus === "suspended" && <p className="mt-2 text-sm text-red-700">This profile is suspended{company.moderationNote ? `: ${company.moderationNote}` : "."} Contact Bidcore support.</p>}
            {canSubmit && (
              <form action={submitForPublication} className="mt-3">
                <input type="hidden" name="companyId" value={company.id} />
                <button className={primaryBtn}>Submit profile for publication</button>
                <p className="mt-2 text-xs text-slate-500">Only the basics are required. Public contact details stay hidden from visitors who are not signed in unless you choose otherwise in Settings.</p>
              </form>
            )}
            <dl className="mt-4 grid gap-2 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
              <div><dt className="text-slate-400">Claim status</dt><dd className="text-slate-800">{company.claimed ? "Claimed" : pendingClaims ? "Claim under review" : company.sourceType === "member" ? "Submitted by you — not yet confirmed by company domain" : "Not claimed"}</dd></div>
              <div><dt className="text-slate-400">Verification</dt><dd className="text-slate-800">{company.verificationStatus === "verified" ? "Verified by Bidcore" : company.verificationStatus === "pending" ? "Under review" : "Not verified"}</dd></div>
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">Last {stats.days} days</h2>
            <dl className="mt-3 grid grid-cols-3 gap-4 text-center">
              <div><dd className="text-2xl font-bold text-slate-900">{stats.companyViews}</dd><dt className="text-xs text-slate-500">Profile views</dt></div>
              <div><dd className="text-2xl font-bold text-slate-900">{stats.listingViews}</dd><dt className="text-xs text-slate-500">Listing views</dt></div>
              <div><dd className="text-2xl font-bold text-slate-900">{stats.enquiries}</dd><dt className="text-xs text-slate-500">Enquiries</dt></div>
            </dl>
            <p className="mt-3 text-xs text-slate-400">Counts come from page views recorded on bidcore.in since the marketplace launched. Bots and repeat views in one session are not counted.</p>
          </section>

          <section className="grid gap-4 sm:grid-cols-2">
            <Link href={`${MP}/dashboard/listings${q}`} className="rounded-lg border border-slate-200 bg-white p-5 hover:border-brand-accent/40">
              <h2 className="font-semibold text-slate-900">Products and services</h2>
              <p className="mt-1 text-sm text-slate-600">{count("published")} published · {count("pending")} awaiting review · {count("draft")} drafts</p>
            </Link>
            <Link href={`${MP}/dashboard/enquiries${q}`} className="rounded-lg border border-slate-200 bg-white p-5 hover:border-brand-accent/40">
              <h2 className="font-semibold text-slate-900">Enquiries</h2>
              <p className="mt-1 text-sm text-slate-600">{newEnquiries} new</p>
            </Link>
          </section>
        </div>

        <aside className="self-start rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="font-semibold text-slate-900">Profile completion</h2>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full bg-brand-navy" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-1 text-xs text-slate-500">{percent}% — all optional</p>
          <ul className="mt-3 space-y-2 text-sm">
            {checks.map((c) => (
              <li key={c.label} className="flex items-start gap-2">
                {c.done ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" />}
                {c.done ? <span className="text-slate-500">{c.label}</span> : <Link href={`${MP}/dashboard/${c.href}${q}`} className="text-slate-800 hover:text-brand-accent">{c.label}</Link>}
              </li>
            ))}
          </ul>
          <Link href={`${MP}/dashboard/listings/new${q}&kind=product`} className={`${outlineBtn} mt-4 w-full`}>Add a product</Link>
        </aside>
      </div>
    </DashboardShell>
  );
}
