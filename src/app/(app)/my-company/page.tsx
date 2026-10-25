import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";
import { COMPANIES, getState, CITIES } from "@/lib/data";

const DEMO_COMPANY_SLUG = "chennai-civil-builders";

export default function MyCompanyPage() {
  const company = COMPANIES.find((c) => c.slug === DEMO_COMPANY_SLUG)!;
  const state = getState(company.stateSlug);
  const city = CITIES.find((c) => c.slug === company.citySlug)?.name ?? company.citySlug;

  const sections = [
    { label: "Company Information", done: true },
    { label: "Services", done: company.specializations.length > 0 },
    { label: "Locations", done: !!company.operatingLocations?.length },
    { label: "Projects", done: !!company.projectCount },
    { label: "Contacts", done: !!(company.email || company.phone) },
    { label: "Website", done: !!company.website },
    { label: "Certifications", done: false },
  ];
  const completion = Math.round(
    (sections.filter((s) => s.done).length / sections.length) * 100
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Company Profile</h1>
          <p className="mt-1 text-sm text-slate-500">
            {company.name} — {city}, {state?.name}
          </p>
        </div>
        <Link
          href={`/companies/${company.stateSlug}/${company.slug}`}
          className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-navy hover:text-brand-navy"
        >
          View Public Profile
        </Link>
      </div>

      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-700">Profile completion</p>
          <p className="text-sm font-bold text-brand-navy">{completion}%</p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-brand-accent transition-all"
            style={{ width: `${completion}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-slate-500">
          Complete your profile to improve visibility to developers and partners.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {sections.map((section) => (
          <div
            key={section.label}
            className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3.5"
          >
            <span className="flex items-center gap-2.5 text-sm font-medium text-slate-800">
              {section.done ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <Circle className="h-4 w-4 text-slate-300" />
              )}
              {section.label}
            </span>
            <button className="text-xs font-medium text-brand-navy hover:underline">
              {section.done ? "Edit" : "Add"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
