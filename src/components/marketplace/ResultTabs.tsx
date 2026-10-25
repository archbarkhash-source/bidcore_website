import Link from "next/link";
import { MP } from "@/lib/marketplace/constants";
import { searchCompanies, searchListings } from "@/lib/marketplace/queries";

/** Companies / Products / Services tabs with real result counts for the current query + location. */
export default async function ResultTabs({ active, q, location }: { active: "companies" | "products" | "services"; q?: string; location?: string }) {
  const [companies, products, services] = await Promise.all([
    searchCompanies({ q, city: location }),
    searchListings({ kind: "product", q, location }),
    searchListings({ kind: "service", q, location }),
  ]);
  const qs = new URLSearchParams();
  if (q) qs.set("q", q);
  if (location) qs.set("location", location);
  const suffix = qs.toString() ? `?${qs}` : "";
  const tabs = [
    { key: "companies", label: "Companies", n: companies.total },
    { key: "products", label: "Products", n: products.total },
    { key: "services", label: "Services", n: services.total },
  ] as const;
  return (
    <div className="flex gap-1 border-b border-slate-200" role="tablist" aria-label="Result type">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={`${MP}/${t.key}${suffix}`}
          role="tab"
          aria-selected={t.key === active}
          className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${t.key === active ? "border-brand-navy text-brand-navy" : "border-transparent text-slate-500 hover:text-slate-800"}`}
        >
          {t.label} <span className="text-slate-400">({t.n})</span>
        </Link>
      ))}
    </div>
  );
}
