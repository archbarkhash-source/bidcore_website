import type { Metadata } from "next";
import Link from "next/link";
import { cache } from "react";
import JsonLd, { breadcrumbLd } from "@/components/JsonLd";
import { CompanyCard, EmptyState, MarketplaceSearch, Pagination, companyTitle, inputClass, one, primaryBtn } from "@/components/marketplace/ui";
import { SITE_URL } from "@/lib/bidcore-api";
import { SUPPLY_SHORTCUTS, canonicalQuery, supplierMeta, type SupplierFilters } from "@/lib/supplier-seo";
import ResultTabs from "@/components/marketplace/ResultTabs";
import { MP } from "@/lib/marketplace/constants";
import { companyFilterOptions, flattenCategories, getCategoryTree, searchCompanies, type CompanyFilters } from "@/lib/marketplace/queries";

type SP = Record<string, string | string[] | undefined>;

const run = cache((key: string) => searchCompanies(JSON.parse(key) as CompanyFilters));
const options = cache(() => companyFilterOptions());

function filtersOf(sp: SP): CompanyFilters {
  const sortRaw = one(sp.sort);
  const statusRaw = one(sp.status);
  return {
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
}

const seoFilters = (f: CompanyFilters): SupplierFilters => ({ ...f, sort: f.sort === "relevance" ? undefined : f.sort, status: f.status || undefined });

// Search wording: the title, heading and description follow the filter (e.g. "Cement Suppliers in Mumbai"). A filtered page is indexed only when it has companies and
// is one product group or type plus at most one place (lib/supplier-seo.ts); every other combination is noindex and points to the main page.
export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }): Promise<Metadata> {
  const f = filtersOf(await searchParams);
  const [res, opts] = await Promise.all([run(JSON.stringify(f)), options()]);
  const sf = seoFilters(f);
  const m = supplierMeta(sf, res.total, opts.states.find((x) => x.slug === f.state)?.name);
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: m.index ? `${MP}/companies${canonicalQuery(sf)}` : `${MP}/companies` },
    robots: m.index ? undefined : { index: false, follow: true },
    openGraph: { title: m.title, description: m.description, url: `${SITE_URL}${MP}/companies${canonicalQuery(sf)}`, type: "website", siteName: "Bidcore", locale: "en_IN" },
  };
}

export default async function CompaniesDirectory({ searchParams }: { searchParams: Promise<SP> }) {
  const f = filtersOf(await searchParams);
  const [res, opts, tree] = await Promise.all([run(JSON.stringify(f)), options(), getCategoryTree()]);
  const cats = flattenCategories(tree);
  const params = { q: f.q, type: f.type, category: f.category, state: f.state, city: f.city, served: f.served, industry: f.industry, capability: f.capability, status: f.status || undefined, sort: f.sort === "relevance" ? undefined : f.sort };
  const hasFilters = Object.values(params).some(Boolean);
  const meta = supplierMeta(seoFilters(f), res.total, opts.states.find((x) => x.slug === f.state)?.name);
  const crumbs = [{ name: "Home", path: "/" }, { name: "Suppliers and Vendors", path: `${MP}/companies` }];
  const jsonLd: Record<string, unknown>[] = [
    breadcrumbLd(SITE_URL, crumbs),
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: meta.heading ?? "Construction Suppliers and Vendors",
      url: `${SITE_URL}${MP}/companies`,
      description: meta.description,
      isPartOf: { "@type": "WebSite", name: "Bidcore", url: SITE_URL },
      ...(res.rows.length
        ? { mainEntity: { "@type": "ItemList", itemListElement: res.rows.map((c, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE_URL}${MP}/companies/${c.marketplaceSlug}`, name: companyTitle(c) })) } }
        : {}),
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <JsonLd data={jsonLd} />
      <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-brand-accent">Home</Link> / <span className="text-slate-700">Suppliers and Vendors</span>
      </nav>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{meta.heading ?? "Find Construction Suppliers and Vendors"}</h1>
      <p className="mt-1 text-sm text-slate-600">Material suppliers, manufacturers, dealers and equipment vendors with a Bidcore profile.</p>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <MarketplaceSearch q={f.q} type="companies" location={f.city} compact />
        </div>
        <Link href={`${MP}/list-your-company`} className={primaryBtn}>List your construction services</Link>
      </div>
      <div className="mt-4 flex flex-wrap gap-2" aria-label="Popular materials and equipment">
        {SUPPLY_SHORTCUTS.map((c) => (
          <Link
            key={c.slug}
            href={`${MP}/companies?category=${c.slug}`}
            className={`rounded-full border px-3 py-1 text-sm ${f.category === c.slug ? "border-brand-navy bg-brand-navy text-white" : "border-slate-300 text-slate-700 hover:border-brand-navy"}`}
          >
            {c.label}
          </Link>
        ))}
      </div>
      {(f.q || f.city) && (
        <div className="mt-5">
          <ResultTabs active="companies" q={f.q} location={f.city} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr]">
        <form method="get" action={`${MP}/companies`} className="space-y-3 self-start rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <input type="hidden" name="q" value={f.q ?? ""} />
          <Select name="type" label="Company type" value={f.type} options={opts.types.map((t) => [t, t])} />
          <Select name="category" label="Product / service category" value={f.category} options={cats.map((c) => [c.slug, c.parentId ? `- ${c.name}` : c.name])} />
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
            {res.total} supplier{res.total === 1 ? "" : "s"} and vendor{res.total === 1 ? "" : "s"}
          </p>
          {res.rows.length === 0 ? (
            <div className="mt-3">
              <EmptyState title={hasFilters ? "No suppliers match these filters." : "No suppliers are listed yet."}>
                {hasFilters ? "Try removing a filter. " : ""}Vendors and suppliers: list your company so contractors can find you.
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
