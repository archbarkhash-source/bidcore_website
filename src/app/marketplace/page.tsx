import type { Metadata } from "next";
import Link from "next/link";
import { Package, Wrench } from "lucide-react";
import { CompanyCard, EmptyState, ListingCard, MarketplaceSearch, SectionHeading, outlineBtn, primaryBtn } from "@/components/marketplace/ui";
import { MP } from "@/lib/marketplace/constants";
import { getCategoryTree, marketplaceHome, shopGroups, type ShopGroup } from "@/lib/marketplace/queries";
import { PRODUCTS } from "@/lib/app-links";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Construction Marketplace — Materials, Equipment, Tools and Services | Bidcore",
  description: "Discover construction materials, equipment, tools, safety products and professional services from suppliers across India. Compare options and request quotes.",
  alternates: { canonical: MP },
};

function CategoryTile({ c }: { c: ShopGroup["categories"][number] }) {
  return (
    <Link href={`${MP}/categories/${c.slug}`} className="group block">
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-md bg-slate-100">
        {c.cover ? (
          // eslint-disable-next-line @next/next/no-img-element -- seller-supplied image URLs come from arbitrary hosts
          <img src={c.cover} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
        ) : c.kind === "service" ? (
          <Wrench className="h-8 w-8 text-slate-300" aria-hidden />
        ) : (
          <Package className="h-8 w-8 text-slate-300" aria-hidden />
        )}
      </div>
      <p className="mt-1.5 text-sm font-medium leading-snug text-slate-800 group-hover:text-brand-accent">{c.name}</p>
    </Link>
  );
}

export default async function MarketplaceHome() {
  const [tree, home] = await Promise.all([getCategoryTree(), marketplaceHome()]);
  const groups = await shopGroups(tree);
  const anyListings = groups.some((g) => g.listings.length > 0);

  return (
    <div className="bg-[#F6F7F9]">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
          <h1 className="max-w-3xl text-3xl font-bold leading-tight text-brand-navy sm:text-4xl">Discover Construction Products, Services and Business Partners</h1>
          <p className="mt-3 max-w-2xl text-slate-600">
            Find construction companies, explore products and services, connect with suppliers, and discover business opportunities across India.
          </p>
          <div className="mt-6 max-w-4xl">
            <MarketplaceSearch />
          </div>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link href={`${MP}/products`} className={primaryBtn}>
              Browse products
            </Link>
            <Link href={`${MP}/list-your-business`} className={outlineBtn}>
              List Your Business
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl space-y-10 px-4 py-8 sm:px-6">
        {/* Shop by category: four cards, each with its categories as picture tiles */}
        <section aria-labelledby="shop" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <h2 id="shop" className="sr-only">Shop by category</h2>
          {groups.map((g) => (
            <div key={g.key} className="flex flex-col rounded-lg border border-slate-200 bg-white p-5">
              <h3 className="text-lg font-bold text-slate-900">{g.title}</h3>
              <p className="mt-0.5 text-xs text-slate-500">{g.blurb}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {g.categories.slice(0, 4).map((c) => (
                  <CategoryTile key={c.slug} c={c} />
                ))}
              </div>
              <Link href={g.href} className="mt-auto pt-4 text-sm font-medium text-brand-accent hover:underline">
                See all
              </Link>
            </div>
          ))}
        </section>

        {!anyListings && (
          <EmptyState title="No products or services are listed yet.">Be among the first suppliers to list products, equipment or services and receive quote requests from contractors.</EmptyState>
        )}

        {groups
          .filter((g) => g.listings.length > 0)
          .map((g) => (
            <section key={g.key} aria-labelledby={`g-${g.key}`}>
              <SectionHeading title={`Latest in ${g.title}`} href={g.href} />
              <h3 id={`g-${g.key}`} className="sr-only">{g.title}</h3>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
                {g.listings.slice(0, 8).map((l) => (
                  <ListingCard key={l.id} l={l} />
                ))}
              </div>
            </section>
          ))}

        {home.featured.length > 0 && (
          <section>
            <SectionHeading title="Featured suppliers" href={`${MP}/companies?type=Supplier`} linkLabel="Find suppliers" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {home.featured.slice(0, 3).map((c) => (
                <CompanyCard key={c.id} c={c} />
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">Sell on the Bidcore marketplace</h2>
            <p className="mt-1 text-sm text-slate-600">List your products and services for free, show your capabilities, and receive quote requests from contractors and procurement teams.</p>
            <Link href={`${MP}/list-your-business`} className={`${outlineBtn} mt-4`}>List Your Business</Link>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-bold text-slate-900">Buying for a project?</h2>
            <p className="mt-1 text-sm text-slate-600">Bidcore&apos;s own software helps you estimate, tender and manage the work.</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
              {PRODUCTS.slice(0, 3).map((p) => (
                <Link key={p.key} href={p.href} className="font-medium text-brand-accent hover:underline">
                  Bidcore {p.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
