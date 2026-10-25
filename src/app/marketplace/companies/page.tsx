import type { Metadata } from "next";
import Link from "next/link";
import { CompanyCard, EmptyState, MarketplaceSearch, Pagination, inputClass, one } from "@/components/marketplace/ui";
import ResultTabs from "@/components/marketplace/ResultTabs";
import { MP } from "@/lib/marketplace/constants";
import { companyFilterOptions, flattenCategories, getCategoryTree, searchCompanies, type CompanyFilters } from "@/lib/marketplace/queries";

type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const sp = await searchParams;
  const filtered = ["q", "type", "category", "state", "city", "location", "served", "industry", "capability", "status", "sort"].some((k) => one(sp[k]));
  const page = Number(one(sp.page)) || 1;
  return {
    title: "Find Construction Companies in India | Bidcore Marketplace",
    description: "Search construction contractors, suppliers, manufacturers, consultants and service providers by type, category, location and capability.",
    alternates: { canonical: page > 1 && !filtered ? `${MP}/companies?page=${page}` : `${MP}/companies` },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function CompaniesDirectory({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const sortRaw = one(sp.sort);
  const statusRaw = one(sp.status);
  const f: CompanyFilters = {
    q: one(sp.q) || undefined,
    type: one(sp.type) || undefined,
    category: one(sp.category) || undefined,
    state: one(sp.state) || undefined,
    city: one(sp.city) || one(sp.location) || undefined,
    served: one(sp.served) || undefined,
    industry: one(sp.industry) || undefined,
    capability: one(sp.capability) || undefined,
    status: statusRaw === "claimed" || statusRaw === "verified" ? statusRaw : "",
    sort: sortRaw === "name" || sortRaw === "recent" ? sortRaw : "relevance",
    page: Number(one(sp.page)) || 1,
  };
  const [res, opts, tree] = await Promise.all([searchCompanies(f), companyFilterOptions(), getCategoryTree()]);
  const cats = flattenCategories(tree);
  const params = { q: f.q, type: f.type, category: f.category, state: f.state, city: f.city, served: f.served, industry: f.industry, capability: f.capability, status: f.status || undefined, sort: f.sort === "relevance" ? undefined : f.sort };
  const hasFilters = Object.values(params).some(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
        <Link href={MP} className="hover:text-brand-accent">Marketplace</Link> / <span className="text-slate-700">Companies</span>
      </nav>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">Find construction companies</h1>
      <p className="mt-1 text-sm text-slate-600">Contractors, suppliers, manufacturers, consultants and service providers that have a published Bidcore marketplace profile.</p>

      <div className="mt-5">
        <MarketplaceSearch q={f.q} type="companies" location={f.city} compact />
      </div>
      {(f.q || f.city) && (
        <div className="mt-5">
          <ResultTabs active="companies" q={f.q} location={f.city} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr]">
        <form method="get" action={`${MP}/companies`} className="space-y-3 self-start rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <input type="hidden" name="q" value={f.q ?? ""} />
          <Select name="type" label="Business type" value={f.type} options={opts.types.map((t) => [t, t])} />
          <Select name="category" label="Product / service category" value={f.category} options={cats.map((c) => [c.slug, c.parentId ? `— ${c.name}` : c.name])} />
          <Select name="state" label="State" value={f.state} options={opts.states.map((s) => [s.slug, s.name])} />
          <label className="block">
            <span className="font-medium text-slate-700">City</span>
            <input name="city" defaultValue={f.city} className={`${inputClass} mt-1`} placeholder="Any city" />
          </label>
          <Select name="served" label="Areas served" value={f.served} options={opts.served.map((s) => [s, s])} />
          <Select name="industry" label="Industry" value={f.industry} options={opts.industries.map((s) => [s, s])} />
          <Select name="capability" label="Capability" value={f.capability} options={opts.capabilities.map((s) => [s, s])} />
          <Select name="status" label="Profile status" value={f.status || undefined} options={[["claimed", "Claimed by the company"], ["verified", "Verified by Bidcore"]]} />
          <Select name="sort" label="Sort by" value={f.sort} options={[["relevance", "Relevance"], ["name", "Alphabetical"], ["recent", "Recently updated"]]} noAny />
          <div className="flex gap-2 pt-1">
            <button className="rounded-md bg-brand-navy px-4 py-2 font-semibold text-white hover:opacity-90">Apply</button>
            {hasFilters && <Link href={`${MP}/companies`} className="rounded-md border border-slate-300 px-4 py-2 text-slate-600 hover:border-slate-400">Clear</Link>}
          </div>
        </form>

        <div>
          <p className="text-sm text-slate-500" aria-live="polite">
            {res.total} compan{res.total === 1 ? "y" : "ies"}
          </p>
          {res.rows.length === 0 ? (
            <div className="mt-3">
              <EmptyState title={hasFilters ? "No companies match these filters." : "No companies are listed yet."}>
                {hasFilters ? "Try removing a filter, or " : "Be the first: "}add your business to the marketplace so buyers can find you.
              </EmptyState>
            </div>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {res.rows.map((c) => (
                <CompanyCard key={c.id} c={c} />
              ))}
            </div>
          )}
          <Pagination basePath={`${MP}/companies`} params={params} page={res.page} pageCount={res.pageCount} />
        </div>
      </div>
    </div>
  );
}

function Select({ name, label, value, options, noAny }: { name: string; label: string; value?: string; options: [string, string][]; noAny?: boolean }) {
  return (
    <label className="block">
      <span className="font-medium text-slate-700">{label}</span>
      <select name={name} defaultValue={value ?? ""} className={`${inputClass} mt-1`}>
        {!noAny && <option value="">Any</option>}
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
