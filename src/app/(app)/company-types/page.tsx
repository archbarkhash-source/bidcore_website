import Link from "next/link";
import { Layers } from "lucide-react";
import { countByType } from "@/lib/company-queries";
import { COMPANY_TYPES } from "@/lib/data";

export const revalidate = 3600;

export default async function CompanyTypesPage() {
  const counts = await countByType();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Company Types</h1>
      <p className="mt-1 text-sm text-slate-500">
        Browse the network by the kind of construction business you&apos;re looking for.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {COMPANY_TYPES.map((type) => {
          const count = counts[type] ?? 0;
          return (
            <Link
              key={type}
              href={`/contractors?type=${encodeURIComponent(type)}`}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-navy/30 hover:shadow-md"
            >
              <span className="flex items-center gap-2.5">
                <Layers className="h-4 w-4 text-slate-400" />
                <span className="font-medium text-slate-900">{type}</span>
              </span>
              {count > 0 && (
                <span className="text-xs font-medium text-slate-400">{count.toLocaleString("en-IN")} companies</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
