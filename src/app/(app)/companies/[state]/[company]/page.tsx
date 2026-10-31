import { notFound } from "next/navigation";
import Link from "next/link";
import { Building2, CheckCircle2, Users } from "lucide-react";
import CompanyProfileTabs from "@/components/CompanyProfileTabs";
import SaveButton from "@/components/SaveButton";
import StatusBadge from "@/components/StatusBadge";
import ClaimButton from "@/components/ClaimButton";
import TenderInviteButton from "@/components/TenderInviteButton";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { getCompanyBySlug } from "@/lib/company-queries";
import { getState } from "@/lib/data";
import { ageText } from "@/lib/registry";

export default async function CompanyProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ state: string; company: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { state: stateSlug, company: companySlug } = await params;
  const { tab } = await searchParams;

  const state = getState(stateSlug);
  const company = await getCompanyBySlug(stateSlug, companySlug);
  if (!state || !company) notFound();

  const city = company.cityName;

  const user = await getCurrentUser();
  const owner = user
    ? await db.company.findFirst({
        where: { slug: company.slug, state: { slug: stateSlug }, claimedById: user.id },
        select: { id: true },
      })
    : null;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <nav className="text-sm text-slate-500">
        <Link href="/contractors" className="hover:text-brand-navy">
          Find Contractors
        </Link>{" "}
        /{" "}
        <Link href={`/states/${state.slug}`} className="hover:text-brand-navy">
          {state.name}
        </Link>{" "}
        / <span className="text-slate-700">{company.name}</span>
      </nav>

      <div className="mt-4 flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-brand-navy/5 text-brand-navy">
            <Building2 className="h-7 w-7" />
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{company.name}</h1>
              {company.registry?.status && <StatusBadge status={company.registry.status} />}
              {company.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified Company
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-slate-500">{company.type}</p>
            <p className="text-sm text-slate-500">
              {city ? `${city}, ${state.name}` : state.name}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <TenderInviteButton companySlug={company.slug} />
          <button className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-navy hover:text-brand-navy">
            <Users className="h-4 w-4" />
            Connect
          </button>
          <SaveButton slug={company.slug} variant="button" />
          <ClaimButton
            stateSlug={stateSlug}
            slug={company.slug}
            claimed={company.claimed}
            isOwner={!!owner}
          />
        </div>
      </div>

      {!company.claimed && (
        <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3.5">
          <p className="text-sm font-medium text-slate-800">Is this your company?</p>
          <p className="mt-0.5 text-sm text-slate-500">
            Claim this profile to update your company information and help industry
            professionals find you.
          </p>
        </div>
      )}

      <div className="mt-6">
        <CompanyProfileTabs
          company={company}
          initialTab={tab}
          registryAge={ageText(company.registry?.incorporationDate)}
        />
      </div>
    </div>
  );
}
