import Link from "next/link";
import { MapPinned } from "lucide-react";
import { countByCity } from "@/lib/company-queries";
import { CITIES, getState } from "@/lib/data";

export const revalidate = 3600;

export default async function CitiesPage() {
  const counts = await countByCity();
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Cities</h1>
      <p className="mt-1 text-sm text-slate-500">
        Browse construction companies by city across India.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CITIES.map((city) => {
          const count = counts[city.slug] ?? 0;
          const stateName = getState(city.stateSlug)?.name ?? city.stateSlug;
          return (
            <Link
              key={city.slug}
              href={`/states/${city.stateSlug}/${city.slug}`}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3.5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand-navy/30 hover:shadow-md"
            >
              <span className="flex items-center gap-2.5">
                <MapPinned className="h-4 w-4 text-slate-400" />
                <span>
                  <span className="block font-medium text-slate-900">{city.name}</span>
                  <span className="block text-xs text-slate-400">{stateName}</span>
                </span>
              </span>
              {count > 0 && (
                <span className="text-xs font-medium text-slate-400">{count} companies</span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
