import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, MapPin } from "lucide-react";
import { JsonLd, TrustBadges, companyTitle } from "./ui";
import EnquiryForm from "./EnquiryForm";
import ReportForm from "./ReportForm";
import TrackView from "./TrackView";
import { MP, type ListingKind } from "@/lib/marketplace/constants";
import { getCategoryBySlug, getPublicListing } from "@/lib/marketplace/queries";
import { SITE_URL } from "@/lib/bidcore-api";
import { PRODUCTS } from "@/lib/app-links";

const path = (k: ListingKind) => (k === "product" ? "products" : "services");

export async function listingMetadata(kind: ListingKind, slug: string): Promise<Metadata> {
  const l = await getPublicListing(kind, slug);
  if (!l) return { title: "Listing not found", robots: { index: false, follow: false } };
  const place = [l.company.cityName, l.company.state.name].filter(Boolean).join(", ");
  return {
    title: `${l.title} — ${companyTitle(l.company)}, ${place} | Bidcore Marketplace`,
    description: (l.shortDescription ?? l.description ?? `${l.title} from ${companyTitle(l.company)}.`).slice(0, 160),
    alternates: { canonical: `${MP}/${path(kind)}/${slug}` },
    openGraph: l.images[0] ? { images: [l.images[0]] } : undefined,
  };
}

const List = ({ title, items }: { title: string; items: string[] }) =>
  items.length === 0 ? null : (
    <div>
      <h3 className="text-sm font-medium text-slate-500">{title}</h3>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {items.map((t) => (
          <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">{t}</span>
        ))}
      </div>
    </div>
  );

export default async function ListingDetail({ kind, slug }: { kind: ListingKind; slug: string }) {
  const l = await getPublicListing(kind, slug);
  if (!l) notFound();
  const cat = l.category ? await getCategoryBySlug(l.category.slug) : null;
  const labels = new Map((cat?.node.attributes ?? []).map((a) => [a.key, a]));
  const specs = Object.entries((l.specs ?? {}) as Record<string, unknown>)
    .filter(([, v]) => v !== "" && v != null)
    .map(([k, v]) => ({ label: labels.get(k)?.label ?? k.replace(/_/g, " "), value: String(v), unit: labels.get(k)?.unit }));
  const docs = (Array.isArray(l.documents) ? l.documents : []) as { name: string; url: string }[];
  const company = l.company;
  const place = [company.cityName, company.state.name].filter(Boolean).join(", ");
  const url = `${SITE_URL}${MP}/${path(kind)}/${slug}`;

  const ld: Record<string, unknown> =
    kind === "product"
      ? { "@context": "https://schema.org", "@type": "Product", name: l.title, url, ...(l.images.length ? { image: l.images } : {}), ...(l.shortDescription || l.description ? { description: (l.shortDescription ?? l.description)!.slice(0, 300) } : {}), ...(l.brand ? { brand: { "@type": "Brand", name: l.brand } } : {}), ...(l.category ? { category: l.category.name } : {}) }
      : { "@context": "https://schema.org", "@type": "Service", name: l.title, url, ...(l.shortDescription || l.description ? { description: (l.shortDescription ?? l.description)!.slice(0, 300) } : {}), provider: { "@type": "Organization", name: companyTitle(company), url: `${SITE_URL}${MP}/companies/${company.marketplaceSlug}` }, ...(l.category ? { serviceType: l.category.name } : {}), areaServed: l.supplyLocations.length ? l.supplyLocations : company.state.name };

  // Contextual (not intrusive) pointer to Bidcore's own software, relevant to what the visitor is looking at.
  const software = kind === "service" ? PRODUCTS.find((p) => p.key === "project-management") : PRODUCTS.find((p) => p.key === "procurement");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <JsonLd data={ld} />
      <TrackView type="listing_view" id={l.id} />
      <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
        <Link href={MP} className="hover:text-brand-accent">Marketplace</Link> / <Link href={`${MP}/${path(kind)}`} className="hover:text-brand-accent">{kind === "product" ? "Products" : "Services"}</Link>
        {l.category && (
          <>
            {" "}/ <Link href={`${MP}/categories/${l.category.slug}`} className="hover:text-brand-accent">{l.category.name}</Link>
          </>
        )}
      </nav>

      <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-8">
          <header>
            <h1 className="text-2xl font-bold text-slate-900">{l.title}</h1>
            {l.brand && <p className="mt-1 text-sm text-slate-600">Brand / manufacturer: {l.brand}</p>}
            <p className="mt-2 text-lg font-semibold text-slate-800">{l.priceMode === "indicative" && l.priceText ? l.priceText : "Price on request"}</p>
            {l.priceMode === "indicative" && <p className="text-xs text-slate-500">Indicative only — confirm the price with the supplier.</p>}
          </header>

          {l.images.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {l.images.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element -- seller-supplied image URLs come from arbitrary hosts
                <img key={src} src={src} alt={`${l.title} — image ${i + 1}`} loading={i === 0 ? "eager" : "lazy"} className={`w-full rounded-lg border border-slate-200 bg-white object-contain ${i === 0 ? "col-span-2 row-span-2 h-72 sm:h-80" : "h-36"}`} />
              ))}
            </div>
          )}

          {(l.shortDescription || l.description) && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900">{kind === "product" ? "Description" : "About this service"}</h2>
              {l.shortDescription && <p className="mt-2 text-slate-700">{l.shortDescription}</p>}
              {l.description && <p className="mt-2 whitespace-pre-line leading-relaxed text-slate-700">{l.description}</p>}
            </section>
          )}

          {kind === "service" && l.scope && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900">Scope of service</h2>
              <p className="mt-2 whitespace-pre-line text-slate-700">{l.scope}</p>
            </section>
          )}

          {specs.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900">Specifications</h2>
              <dl className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white text-sm">
                {specs.map((s) => (
                  <div key={s.label} className="grid grid-cols-[10rem_1fr] gap-3 px-4 py-2.5">
                    <dt className="text-slate-500">{s.label}</dt>
                    <dd className="text-slate-800">{s.value}{s.unit ? ` ${s.unit}` : ""}</dd>
                  </div>
                ))}
                {kind === "product" && l.unit && <div className="grid grid-cols-[10rem_1fr] gap-3 px-4 py-2.5"><dt className="text-slate-500">Unit</dt><dd className="text-slate-800">{l.unit}</dd></div>}
                {kind === "product" && l.moq && <div className="grid grid-cols-[10rem_1fr] gap-3 px-4 py-2.5"><dt className="text-slate-500">Minimum order</dt><dd className="text-slate-800">{l.moq}</dd></div>}
                {l.availability && <div className="grid grid-cols-[10rem_1fr] gap-3 px-4 py-2.5"><dt className="text-slate-500">Availability</dt><dd className="text-slate-800">{l.availability}</dd></div>}
              </dl>
            </section>
          )}

          <div className="space-y-4">
            <List title="Applications and uses" items={l.applications} />
            <List title="Variants" items={l.variants} />
            <List title={kind === "product" ? "Supply locations" : "Geographic coverage"} items={l.supplyLocations} />
            <List title="Project types served" items={l.projectTypes} />
            <List title="Industries served" items={l.industries} />
            <List title="Technical capabilities" items={l.capabilities} />
            <List title="Certifications and qualifications" items={l.certifications} />
            {kind === "service" && l.pricingBasis && (
              <div>
                <h3 className="text-sm font-medium text-slate-500">Pricing basis</h3>
                <p className="mt-1 text-sm text-slate-700">{l.pricingBasis}</p>
              </div>
            )}
          </div>

          {docs.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900">Datasheets and documents</h2>
              <ul className="mt-2 space-y-1.5 text-sm">
                {docs.map((d) => (
                  <li key={d.url}>
                    <a href={d.url} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-2 text-brand-accent hover:underline">
                      <FileText className="h-4 w-4" /> {d.name}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section id="enquiry" aria-label="Enquiry">
            <EnquiryForm listingId={l.id} companyId={company.id} kind={kind} subject={l.title} supplierName={companyTitle(company)} />
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-medium text-slate-500">{kind === "product" ? "Supplier" : "Service provider"}</h2>
            <Link href={`${MP}/companies/${company.marketplaceSlug}`} className="mt-1 block text-lg font-semibold text-brand-navy hover:text-brand-accent">
              {companyTitle(company)}
            </Link>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600"><MapPin className="h-3.5 w-3.5 text-slate-400" /> {place}</p>
            <div className="mt-2"><TrustBadges company={{ ...company, featured: false }} /></div>
            <a href="#enquiry" className="mt-4 block rounded-full bg-brand-accent px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-accent-light">
              {kind === "product" ? "Request a quote" : "Send enquiry"}
            </a>
            <Link href={`${MP}/companies/${company.marketplaceSlug}`} className="mt-2 block rounded-full border border-slate-300 px-5 py-2.5 text-center text-sm font-semibold text-slate-700 hover:border-brand-navy">
              Contact supplier
            </Link>
          </section>
          {software && (
            <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm">
              <h2 className="font-semibold text-slate-900">Buying for a project?</h2>
              <p className="mt-1 text-slate-600">{software.tagline}</p>
              <Link href={software.href} className="mt-2 inline-block font-medium text-brand-accent hover:underline">Bidcore {software.name}</Link>
            </section>
          )}
          <ReportForm targetType="listing" targetId={l.id} />
        </aside>
      </div>
    </div>
  );
}
