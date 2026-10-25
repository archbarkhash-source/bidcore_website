import Link from "next/link";
import { Tags } from "lucide-react";
import { countBySpecialization } from "@/lib/company-queries";

export const revalidate = 3600;

export default async function SpecializationsPage() {
  const specializations = await countBySpecialization();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Specializations</h1>
      <p className="mt-1 text-sm text-slate-500">
        Find companies by the type of work they specialize in.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        {specializations.map(([spec, count]) => (
          <Link
            key={spec}
            href={`/companies?q=${encodeURIComponent(spec)}`}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-700 shadow-sm transition hover:border-brand-navy/30 hover:text-brand-navy"
          >
            <Tags className="h-3.5 w-3.5 text-slate-400" />
            {spec}
            <span className="text-xs text-slate-400">{count}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
