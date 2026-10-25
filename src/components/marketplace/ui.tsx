import Link from "next/link";
import { Building2, CheckCircle2, MapPin, Package, Search, Wrench } from "lucide-react";
import { MP, TRUST_DEFINITIONS } from "@/lib/marketplace/constants";
import type { CategoryNode, CompanyCardData, ListingCardData } from "@/lib/marketplace/queries";

export const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10";
export const primaryBtn = "inline-flex items-center justify-center rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light";
export const outlineBtn = "inline-flex items-center justify-center rounded-full border border-brand-navy px-5 py-2.5 text-sm font-semibold text-brand-navy transition hover:bg-brand-navy hover:text-white";

export const companyTitle = (c: { name: string; displayName?: string | null }) => c.displayName?.trim() || c.name;

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </label>
  );
}

/** Status badges. Each one renders only when its own condition is actually true - an unclaimed record is never shown as claimed or verified. */
export function TrustBadges({ company }: { company: { claimed: boolean; verificationStatus: string; featured: boolean; sourceType?: string } }) {
  const verified = company.verificationStatus === "verified";
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {verified && (
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700" title={TRUST_DEFINITIONS[2].text}>
          <CheckCircle2 className="h-3 w-3" /> Verified by Bidcore
        </span>
      )}
      {company.claimed && (
        <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700" title={TRUST_DEFINITIONS[1].text}>
          Claimed
        </span>
      )}
      {!company.claimed && company.sourceType === "member" && (
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600" title="The company submitted this profile itself; Bidcore has not confirmed it.">
          Submitted by the company
        </span>
      )}
      {!company.claimed && company.sourceType !== "member" && (
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500" title={TRUST_DEFINITIONS[0].text}>
          Listed from public sources
        </span>
      )}
      {company.featured && (
        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700" title={TRUST_DEFINITIONS[3].text}>
          Featured
        </span>
      )}
    </div>
  );
}

export function Initials({ src, size = 10 }: { src?: string | null; size?: 10 | 14 }) {
  const cls = size === 14 ? "h-14 w-14" : "h-10 w-10";
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element -- company-supplied logos come from arbitrary hosts, so next/image cannot be allow-listed
    return <img src={src} alt="" loading="lazy" className={`${cls} shrink-0 rounded-md border border-slate-200 bg-white object-contain`} />;
  }
  return (
    <span className={`flex ${cls} shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-400`} aria-hidden>
      <Building2 className={size === 14 ? "h-7 w-7" : "h-5 w-5"} />
    </span>
  );
}

export function CompanyCard({ c }: { c: CompanyCardData }) {
  const place = [c.cityName, c.state.name].filter(Boolean).join(", ");
  return (
    <Link href={`${MP}/companies/${c.marketplaceSlug}`} className="flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 transition hover:border-brand-accent/40 hover:shadow-sm">
      <div className="flex items-start gap-3">
        <Initials src={c.logoUrl} />
        <div className="min-w-0">
          <h3 className="font-semibold leading-snug text-brand-navy">{companyTitle(c)}</h3>
          <p className="text-sm text-slate-500">{c.type}</p>
        </div>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-sm text-slate-600">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" /> {place}
      </p>
      {(c.capabilities.length > 0 || c.specializations.length > 0) && (
        <p className="mt-2 line-clamp-2 text-xs text-slate-500">{[...c.specializations, ...c.capabilities].slice(0, 5).join(" · ")}</p>
      )}
      <div className="mt-auto pt-3">
        <TrustBadges company={c} />
      </div>
    </Link>
  );
}

export function ListingCard({ l }: { l: ListingCardData }) {
  const href = `${MP}/${l.kind === "product" ? "products" : "services"}/${l.slug}`;
  const image = l.images[0];
  const company = l.company;
  const place = l.kind === "product" ? l.supplyLocations.slice(0, 2).join(", ") || company.cityName || company.state.name : [company.cityName, company.state.name].filter(Boolean).join(", ");
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-lg border border-slate-200 bg-white transition hover:border-brand-accent/40 hover:shadow-sm">
      <Link href={href} className="block">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- seller-supplied image URLs come from arbitrary hosts
          <img src={image} alt={l.title} loading="lazy" className="aspect-[4/3] w-full bg-white object-contain p-2" />
        ) : (
          <div className="flex aspect-[4/3] w-full items-center justify-center bg-slate-50 text-slate-300">{l.kind === "product" ? <Package className="h-10 w-10" /> : <Wrench className="h-10 w-10" />}</div>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link href={href} className="font-semibold leading-snug text-brand-navy hover:text-brand-accent">
          {l.title}
        </Link>
        {l.category && <p className="mt-0.5 text-xs text-slate-500">{l.category.name}</p>}
        <p className="mt-2 text-sm text-slate-600">
          <Link href={`${MP}/companies/${company.marketplaceSlug}`} className="hover:text-brand-accent">
            {companyTitle(company)}
          </Link>
        </p>
        {place && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="h-3 w-3 shrink-0 text-slate-400" /> {place}
          </p>
        )}
        <p className="mt-2 text-sm font-medium text-slate-800">{l.priceMode === "indicative" && l.priceText ? l.priceText : "Price on request"}</p>
        <div className="mt-2">
          <TrustBadges company={{ ...company, featured: false }} />
        </div>
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          <Link href={href} className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-brand-navy hover:text-brand-navy">
            View details
          </Link>
          <Link href={`${href}#enquiry`} className="rounded-full bg-brand-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-accent-light">
            {l.kind === "product" ? "Request a quote" : "Send enquiry"}
          </Link>
        </div>
      </div>
    </div>
  );
}

export function CategoryCard({ cat, count }: { cat: CategoryNode; count?: number }) {
  return (
    <Link href={`${MP}/categories/${cat.slug}`} className="group flex h-full flex-col rounded-lg border border-slate-200 bg-white p-5 transition hover:border-brand-accent/40 hover:shadow-sm">
      <span className="flex h-10 w-10 items-center justify-center rounded-md bg-slate-100 text-slate-500 group-hover:bg-brand-navy group-hover:text-white">
        {cat.kind === "service" ? <Wrench className="h-5 w-5" /> : <Package className="h-5 w-5" />}
      </span>
      <h3 className="mt-3 font-semibold leading-snug text-brand-navy">{cat.name}</h3>
      {cat.description && <p className="mt-1 line-clamp-2 text-xs text-slate-500">{cat.description}</p>}
      {count ? <p className="mt-auto pt-3 text-xs font-medium text-slate-600">{count} listing{count === 1 ? "" : "s"}</p> : null}
    </Link>
  );
}

export function Pagination({ basePath, params, page, pageCount }: { basePath: string; params: Record<string, string | undefined>; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v) qs.set(k, v);
    if (p > 1) qs.set("page", String(p));
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  return (
    <nav className="mt-8 flex items-center justify-center gap-3 text-sm" aria-label="Pagination">
      {page > 1 && (
        <Link href={href(page - 1)} rel="prev" className="rounded-md border border-slate-300 px-4 py-2 hover:border-slate-400">
          Previous
        </Link>
      )}
      <span className="text-slate-500">
        Page {page} of {pageCount}
      </span>
      {page < pageCount && (
        <Link href={href(page + 1)} rel="next" className="rounded-md border border-slate-300 px-4 py-2 hover:border-slate-400">
          Next
        </Link>
      )}
    </nav>
  );
}

/** Universal search: a plain GET form (works without JavaScript); /marketplace/search sends the visitor to the right results page. */
export function MarketplaceSearch({ q, type, location, compact }: { q?: string; type?: string; location?: string; compact?: boolean }) {
  return (
    <form action={`${MP}/search`} method="get" role="search" className={`grid gap-2 ${compact ? "md:grid-cols-[1fr_10rem_12rem_auto]" : "md:grid-cols-[1fr_9rem_12rem_auto]"}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input name="q" defaultValue={q} aria-label="Search" placeholder="What are you looking for? e.g. TMT bars, crash barrier, soil testing" className={`${inputClass} py-3 pl-9`} />
      </div>
      <select name="type" defaultValue={type ?? "all"} aria-label="Search in" className={`${inputClass} py-3`}>
        <option value="all">All</option>
        <option value="companies">Companies</option>
        <option value="products">Products</option>
        <option value="services">Services</option>
      </select>
      <input name="location" defaultValue={location} aria-label="Location" placeholder="City or state" className={`${inputClass} py-3`} />
      <button className="rounded-md bg-brand-accent px-6 py-3 text-sm font-semibold text-white hover:bg-brand-accent-light">Search</button>
    </form>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <p className="font-medium text-slate-800">{title}</p>
      {children && <div className="mt-2 text-sm text-slate-500">{children}</div>}
      <Link href={`${MP}/list-your-business`} className={`${primaryBtn} mt-4`}>
        List your business
      </Link>
    </div>
  );
}

export function SectionHeading({ title, href, linkLabel = "View all" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      {href && (
        <Link href={href} className="text-sm font-medium text-brand-accent hover:underline">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

/** Safe JSON-LD: `<` is escaped so page content can never close the script tag. */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

export const one = (v: string | string[] | undefined) => ((Array.isArray(v) ? v[0] : v) ?? "").trim();
