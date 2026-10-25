import Link from "next/link";
import { Building2 } from "lucide-react";
import { Company } from "@/lib/types";
import { getState } from "@/lib/data";

export default function CompanyCard({ company }: { company: Company }) {
  const city = company.cityName;
  const state = getState(company.stateSlug)?.name ?? company.stateSlug;

  return (
    <Link
      href={`/companies/${company.stateSlug}/${company.slug}`}
      className="block rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-navy/30 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400">
            <Building2 className="h-4 w-4" />
          </span>
          <h3 className="font-semibold text-slate-900">{company.name}</h3>
        </div>
        {company.verified && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            Verified
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-500">
        {city ? `${city}, ${state}` : state}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
          {company.type}
        </span>
        {company.specializations.slice(0, 2).map((s) => (
          <span key={s} className="rounded-full bg-slate-50 px-2.5 py-1 text-xs text-slate-500">
            {s}
          </span>
        ))}
      </div>
      {!company.claimed && (
        <p className="mt-3 text-xs font-medium text-brand-accent">Unclaimed listing</p>
      )}
    </Link>
  );
}
