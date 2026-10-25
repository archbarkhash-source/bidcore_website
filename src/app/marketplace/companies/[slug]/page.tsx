import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, MapPin } from "lucide-react";
import { Initials, JsonLd, ListingCard, TrustBadges, companyTitle, outlineBtn, primaryBtn } from "@/components/marketplace/ui";
import EnquiryForm from "@/components/marketplace/EnquiryForm";
import ContactReveal from "@/components/marketplace/ContactReveal";
import ReportForm from "@/components/marketplace/ReportForm";
import TrackView from "@/components/marketplace/TrackView";
import { MP, TRUST_DEFINITIONS } from "@/lib/marketplace/constants";
import { companyListings, getPublicCompany } from "@/lib/marketplace/queries";
import { SITE_URL } from "@/lib/bidcore-api";
import { signInUrl } from "@/lib/marketplace/auth";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = await getPublicCompany(slug);
  if (!c) return { title: "Company not found", robots: { index: false, follow: false } };
  const place = [c.cityName, c.state.name].filter(Boolean).join(", ");
  return {
    title: `${companyTitle(c)} — ${c.type} in ${place} | Bidcore Marketplace`,
    description: c.about?.slice(0, 160) ?? `${companyTitle(c)} is a ${c.type.toLowerCase()} in ${place}. View products, services and capabilities on the Bidcore marketplace.`,
    alternates: { canonical: `${MP}/companies/${slug}` },
  };
}

const Chips = ({ items }: { items: string[] }) => (
  <div className="flex flex-wrap gap-2">
    {items.map((t) => (
      <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
        {t}
      </span>
    ))}
  </div>
);

export default async function CompanyProfile({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getPublicCompany(slug);
  if (!c) notFound();
  const [products, services] = await Promise.all([companyListings(c.id, "product"), companyListings(c.id, "service")]);
  const place = [c.cityName, c.state.name].filter(Boolean).join(", ");
  const url = `${SITE_URL}${MP}/companies/${slug}`;
  const publicContact = c.contactPublic ? { phone: c.phone, email: c.email, address: c.address, pinCode: c.pinCode } : undefined;
  const sourceLabel = c.sourceType === "member" ? "Submitted by the company" : c.sourceType === "admin" ? "Added by the Bidcore team" : "Compiled from public sources";

  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: companyTitle(c),
    url,
    ...(c.logoUrl ? { logo: c.logoUrl } : {}),
    ...(c.about ? { description: c.about.slice(0, 300) } : {}),
    address: { "@type": "PostalAddress", ...(c.cityName ? { addressLocality: c.cityName } : {}), addressRegion: c.state.name, addressCountry: "IN" },
    ...(c.website ? { sameAs: [c.website] } : {}),
    ...(c.contactPublic && c.phone ? { telephone: c.phone } : {}),
    ...(c.contactPublic && c.email ? { email: c.email } : {}),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <JsonLd data={ld} />
      <TrackView type="company_view" id={c.id} />
      <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
        <Link href={MP} className="hover:text-brand-accent">Marketplace</Link> / <Link href={`${MP}/companies`} className="hover:text-brand-accent">Companies</Link> /{" "}
        <span className="text-slate-700">{companyTitle(c)}</span>
      </nav>

      <header className="mt-4 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <Initials src={c.logoUrl} size={14} />
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{companyTitle(c)}</h1>
            {c.displayName && c.displayName !== c.name && <p className="text-sm text-slate-500">Registered name: {c.name}</p>}
            <p className="text-sm text-slate-600">{c.type}</p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
              <MapPin className="h-3.5 w-3.5 text-slate-400" /> {place}
            </p>
            <div className="mt-2">
              <TrustBadges company={c} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="#enquiry" className={primaryBtn}>Contact supplier</a>
          {!c.claimed && (
            <Link href={`${MP}/list-your-business?claim=${c.id}`} className={outlineBtn}>
              Claim this profile
            </Link>
          )}
        </div>
      </header>

      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-8">
          <section aria-labelledby="overview">
            <h2 id="overview" className="text-lg font-semibold text-slate-900">Company overview</h2>
            {c.about ? <p className="mt-2 whitespace-pre-line leading-relaxed text-slate-700">{c.about}</p> : <p className="mt-2 text-sm text-slate-500">This company has not added a description yet.</p>}
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
              {c.founded && <Fact label="Founded" value={String(c.founded)} />}
              {c.sizeRange && <Fact label="Company size" value={c.sizeRange} />}
              {c.cin && <Fact label="CIN" value={c.cin} />}
              {c.gstin && <Fact label="GSTIN" value={c.gstin} />}
            </dl>
          </section>

          {(c.specializations.length > 0 || c.capabilities.length > 0 || c.certifications.length > 0 || c.industries.length > 0 || c.operatingLocations.length > 0) && (
            <section aria-labelledby="caps" className="space-y-4">
              <h2 id="caps" className="text-lg font-semibold text-slate-900">Capabilities and coverage</h2>
              {c.specializations.length > 0 && <Group title="Specialisations"><Chips items={c.specializations} /></Group>}
              {c.capabilities.length > 0 && <Group title="Capabilities and equipment"><Chips items={c.capabilities} /></Group>}
              {c.certifications.length > 0 && <Group title="Certifications and credentials"><Chips items={c.certifications} /></Group>}
              {c.industries.length > 0 && <Group title="Industries"><Chips items={c.industries} /></Group>}
              {c.operatingLocations.length > 0 && <Group title="Areas served"><Chips items={c.operatingLocations} /></Group>}
            </section>
          )}

          {c.projectExperience && (
            <section aria-labelledby="proj">
              <h2 id="proj" className="text-lg font-semibold text-slate-900">Project experience</h2>
              <p className="mt-2 whitespace-pre-line text-slate-700">{c.projectExperience}</p>
            </section>
          )}

          {products.length > 0 && (
            <section aria-labelledby="prods">
              <h2 id="prods" className="text-lg font-semibold text-slate-900">Products</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {products.map((l) => <ListingCard key={l.id} l={l} />)}
              </div>
            </section>
          )}
          {services.length > 0 && (
            <section aria-labelledby="svcs">
              <h2 id="svcs" className="text-lg font-semibold text-slate-900">Services</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {services.map((l) => <ListingCard key={l.id} l={l} />)}
              </div>
            </section>
          )}

          <section id="enquiry" aria-label="Enquiry">
            <EnquiryForm companyId={c.id} kind="company" subject={`General enquiry to ${companyTitle(c)}`} supplierName={companyTitle(c)} />
            {!c.claimed && (
              <p className="mt-2 text-xs text-slate-500">This profile has not been claimed. The enquiry is recorded, and sent to the company&apos;s business email if one is on file.</p>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">Contact</h2>
            <div className="mt-3">
              <ContactReveal slug={slug} signInHref={signInUrl(`${MP}/companies/${slug}`)} initial={publicContact} />
            </div>
            {c.website && (
              <p className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-sm">
                <Globe className="h-4 w-4 text-slate-400" />
                <a href={c.website} target="_blank" rel="noopener noreferrer nofollow" className="break-all text-brand-accent hover:underline">
                  {c.website.replace(/^https?:\/\//, "")}
                </a>
              </p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm">
            <h2 className="font-semibold text-slate-900">About this information</h2>
            <p className="mt-2 text-slate-600">
              <span className="font-medium">Source:</span> {sourceLabel}
              {c.sourceType !== "member" && c.sourceNote ? ` (${c.sourceNote})` : ""}.
            </p>
            <p className="mt-1 text-slate-600">
              {c.claimed
                ? "A representative of this company has claimed the profile and can keep it up to date."
                : "The company has not confirmed these details."}{" "}
              {c.verificationStatus === "verified" ? TRUST_DEFINITIONS[2].text : "This company has not been verified by Bidcore."}
            </p>
            <p className="mt-1 text-xs text-slate-400">Last updated {c.updatedAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</p>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm">
            <h2 className="font-semibold text-slate-900">Inviting this company to a tender?</h2>
            <p className="mt-1 text-slate-600">Publish a tender package and invite suppliers with Bidcore Tender Connect.</p>
            <Link href="/products/tender-connect" className="mt-2 inline-block font-medium text-brand-accent hover:underline">
              About Tender Connect
            </Link>
          </section>

          <ReportForm targetType="company" targetId={c.id} />
        </aside>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="mt-0.5 text-slate-800">{value}</dd>
    </div>
  );
}
function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-1.5 text-sm font-medium text-slate-500">{title}</h3>
      {children}
    </div>
  );
}
