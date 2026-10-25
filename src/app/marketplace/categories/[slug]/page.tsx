import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CompanyCard, EmptyState, ListingCard, MarketplaceSearch, Pagination, SectionHeading, one } from "@/components/marketplace/ui";
import { MP } from "@/lib/marketplace/constants";
import { getCategoryBySlug, searchCompanies, searchListings } from "@/lib/marketplace/queries";

type SP = Record<string, string | string[] | undefined>;

async function load(slug: string, sp: SP) {
  const found = await getCategoryBySlug(slug);
  if (!found) return null;
  const page = Number(one(sp.page)) || 1;
  const kind = found.node.kind === "service" ? "service" : "product";
  const [listings, companies] = await Promise.all([searchListings({ kind, category: slug, page }), searchCompanies({ category: slug })]);
  return { ...found, kind, listings, companies, page };
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }): Promise<Metadata> {
  const { slug } = await params;
  const d = await load(slug, await searchParams);
  if (!d) return { title: "Category not found", robots: { index: false, follow: false } };
  const thin = d.listings.total === 0 && d.companies.total === 0;
  const what = d.kind === "service" ? "service providers" : "suppliers and products";
  return {
    title: `${d.node.name} — ${what} | Bidcore Marketplace`,
    description: d.node.description ?? `Find ${what} for ${d.node.name.toLowerCase()} on the Bidcore construction marketplace.`,
    alternates: { canonical: `${MP}/categories/${slug}` },
    // An empty category is not a useful page for a search engine; it stays reachable for visitors.
    robots: thin ? { index: false, follow: true } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<SP> }) {
  const { slug } = await params;
  const d = await load(slug, await searchParams);
  if (!d) notFound();
  const { node, parent } = d;
  const base = `${MP}/categories/${slug}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
        <Link href={MP} className="hover:text-brand-accent">Marketplace</Link> /{" "}
        {parent && (
          <>
            <Link href={`${MP}/categories/${parent.slug}`} className="hover:text-brand-accent">{parent.name}</Link> /{" "}
          </>
        )}
        <span className="text-slate-700">{node.name}</span>
      </nav>
      <h1 className="mt-2 text-2xl font-bold text-slate-900">{node.name}</h1>
      {node.description && <p className="mt-1 max-w-3xl text-sm text-slate-600">{node.description}</p>}
      <div className="mt-5 max-w-4xl">
        <MarketplaceSearch type={d.kind === "service" ? "services" : "products"} />
      </div>

      {node.children.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {node.children.map((c) => (
            <Link key={c.slug} href={`${MP}/categories/${c.slug}`} className="rounded-full border border-slate-300 bg-white px-3.5 py-1.5 text-sm text-slate-700 hover:border-brand-navy hover:text-brand-navy">
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <section className="mt-8">
        <SectionHeading title={d.kind === "service" ? "Services" : "Products"} href={`${MP}/${d.kind === "service" ? "services" : "products"}?category=${slug}`} linkLabel="Filter these" />
        {d.listings.rows.length === 0 ? (
          <div className="mt-3">
            <EmptyState title="Nothing is listed in this category yet.">Suppliers and service providers can add a free listing.</EmptyState>
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {d.listings.rows.map((l) => (
                <ListingCard key={l.id} l={l} />
              ))}
            </div>
            <Pagination basePath={base} params={{}} page={d.page} pageCount={d.listings.pageCount} />
          </>
        )}
      </section>

      {d.companies.rows.length > 0 && (
        <section className="mt-10">
          <SectionHeading title={`Companies offering ${node.name.toLowerCase()}`} href={`${MP}/companies?category=${slug}`} />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {d.companies.rows.slice(0, 6).map((c) => (
              <CompanyCard key={c.id} c={c} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
