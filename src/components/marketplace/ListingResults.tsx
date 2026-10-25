import Link from "next/link";
import type { Metadata } from "next";
import { EmptyState, ListingCard, MarketplaceSearch, Pagination, inputClass, one } from "@/components/marketplace/ui";
import ResultTabs from "@/components/marketplace/ResultTabs";
import { AVAILABILITY_OPTIONS, MP, type ListingKind } from "@/lib/marketplace/constants";
import { flattenCategories, getCategoryTree, searchListings, serviceFilterOptions, type CategoryNode, type ListingFilters } from "@/lib/marketplace/queries";
import { STATES } from "@/lib/data";

type SP = Record<string, string | string[] | undefined>;

const COPY = {
  product: {
    path: "products",
    h1: "Browse construction products and equipment",
    lead: "Building materials, machinery, electrical and mechanical products, and infrastructure products from suppliers and manufacturers.",
    title: "Construction Products, Materials and Equipment in India | Bidcore Marketplace",
    description: "Browse construction products, building materials and equipment from suppliers and manufacturers. Request a quote directly.",
  },
  service: {
    path: "services",
    h1: "Browse construction services",
    lead: "Consultants, contractors, testing laboratories, surveyors and equipment rental providers.",
    title: "Construction, Engineering and Testing Services in India | Bidcore Marketplace",
    description: "Find engineering consultants, contractors, testing and survey services and equipment rental. Send an enquiry directly.",
  },
} as const;

export function listingsMetadata(kind: ListingKind, sp: SP, categoryName?: string): Metadata {
  const c = COPY[kind];
  const filtered = ["q", "category", "state", "location", "type", "price", "availability", "projectType", "industry", "capability", "sort", "scope"].some((k) => one(sp[k]));
  const page = Number(one(sp.page)) || 1;
  const base = `${MP}/${c.path}`;
  return {
    title: categoryName ? `${categoryName} — ${kind === "product" ? "Suppliers and Products" : "Service Providers"} | Bidcore Marketplace` : c.title,
    description: c.description,
    alternates: { canonical: page > 1 && !filtered ? `${base}?page=${page}` : base },
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function ListingResults({ kind, sp }: { kind: ListingKind; sp: SP }) {
  const c = COPY[kind];
  const base = `${MP}/${c.path}`;
  const sortRaw = one(sp.sort);
  const priceRaw = one(sp.price);
  const f: ListingFilters = {
    kind,
    q: one(sp.q) || undefined,
    category: one(sp.category) || undefined,
    state: one(sp.state) || undefined,
    location: one(sp.location) || undefined,
    companyType: one(sp.type) || undefined,
    price: priceRaw === "on_request" || priceRaw === "indicative" ? priceRaw : "",
    availability: one(sp.availability) || undefined,
    projectType: one(sp.projectType) || undefined,
    industry: one(sp.industry) || undefined,
    capability: one(sp.capability) || undefined,
    sort: sortRaw === "recent" || sortRaw === "name" ? sortRaw : "relevance",
    page: Number(one(sp.page)) || 1,
  };
  const [res, tree, svc] = await Promise.all([searchListings(f), getCategoryTree(), kind === "service" ? serviceFilterOptions() : Promise.resolve(null)]);
  const cats: CategoryNode[] = flattenCategories(tree.filter((t) => t.kind === kind || t.kind === "both"));
  const params = { q: f.q, category: f.category, state: f.state, location: f.location, type: f.companyType, price: f.price || undefined, availability: f.availability, projectType: f.projectType, industry: f.industry, capability: f.capability, sort: f.sort === "relevance" ? undefined : f.sort };
  const hasFilters = Object.values(params).some(Boolean);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
        <Link href={MP} className="hover:text-brand-accent">Marketplace</Link> / <span className="text-slate-700">{kind === "product" ? "Products" : "Services"}</span>
      </nav>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{c.h1}</h1>
      <p className="mt-1 text-sm text-slate-600">{c.lead}</p>
      <div className="mt-5">
        <MarketplaceSearch q={f.q} type={c.path} location={f.location} compact />
      </div>
      {(f.q || f.location) && (
        <div className="mt-5">
          <ResultTabs active={c.path} q={f.q} location={f.location} />
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[16rem_1fr]">
        <form method="get" action={base} className="space-y-3 self-start rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <input type="hidden" name="q" value={f.q ?? ""} />
          <Sel name="category" label="Category" value={f.category} options={cats.map((x) => [x.slug, x.parentId ? `— ${x.name}` : x.name])} />
          <Sel name="state" label={kind === "product" ? "Supplies to / located in" : "Serves / located in"} value={f.state} options={STATES.map((s) => [s.name, s.name])} />
          <label className="block">
            <span className="font-medium text-slate-700">City</span>
            <input name="location" defaultValue={f.location} className={`${inputClass} mt-1`} placeholder="Any city" />
          </label>
          {kind === "product" ? (
            <>
              <Sel name="price" label="Price" value={f.price || undefined} options={[["indicative", "Indicative price shown"], ["on_request", "Price on request"]]} />
              <Sel name="availability" label="Availability" value={f.availability} options={AVAILABILITY_OPTIONS.map((a) => [a, a])} />
            </>
          ) : (
            <>
              <Sel name="projectType" label="Project type" value={f.projectType} options={(svc?.projectTypes ?? []).map((a) => [a, a])} />
              <Sel name="industry" label="Industry served" value={f.industry} options={(svc?.industries ?? []).map((a) => [a, a])} />
              <Sel name="capability" label="Technical capability" value={f.capability} options={(svc?.capabilities ?? []).map((a) => [a, a])} />
            </>
          )}
          <Sel name="sort" label="Sort by" value={f.sort} options={[["relevance", "Relevance"], ["recent", "Newest"], ["name", "Alphabetical"]]} noAny />
          <div className="flex gap-2 pt-1">
            <button className="rounded-md bg-brand-navy px-4 py-2 font-semibold text-white hover:opacity-90">Apply</button>
            {hasFilters && <Link href={base} className="rounded-md border border-slate-300 px-4 py-2 text-slate-600 hover:border-slate-400">Clear</Link>}
          </div>
        </form>

        <div>
          <p className="text-sm text-slate-500" aria-live="polite">
            {res.total} listing{res.total === 1 ? "" : "s"}
          </p>
          {res.rows.length === 0 ? (
            <div className="mt-3">
              <EmptyState title={hasFilters ? "No listings match these filters." : kind === "product" ? "No products are listed yet." : "No services are listed yet."}>
                Suppliers and service providers can publish a free listing.
              </EmptyState>
            </div>
          ) : (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {res.rows.map((l) => (
                <ListingCard key={l.id} l={l} />
              ))}
            </div>
          )}
          <Pagination basePath={base} params={params} page={res.page} pageCount={res.pageCount} />
        </div>
      </div>
    </div>
  );
}

function Sel({ name, label, value, options, noAny }: { name: string; label: string; value?: string; options: [string, string][]; noAny?: boolean }) {
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
