import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, Cpu, MapPin, PlayCircle, Search, ShoppingBag } from "lucide-react";
import TenderCard from "@/components/TenderCard";
import { BiddersBoardGraphic, OpportunityBoardGraphic, QuotationCompareGraphic } from "@/components/graphics/TenderConnectGraphics";
import { getContractors, getTenders, type Contractor, type Tender } from "@/lib/bidcore-api";
import { PRODUCTS, signUpHref } from "@/lib/app-links";
import { COMPANY_SHORTCUTS, PRODUCT_SHORTCUTS } from "@/lib/network-nav";
import { getProductPage } from "@/lib/product-pages";

// Bidcore.in presents four connected offerings: construction software (paid products), a construction business network (companies), a products & services
// marketplace, and public tenders. Live sections (companies, tenders) use real data from the BidcoreAI API; a section with no data is left out rather than filled
// with placeholders, and nothing here is an invented count, rating or testimonial.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Bidcore: Construction Software, Company Network and Marketplace for India",
  description:
    "Estimate and manage projects with construction software, discover companies and suppliers, promote your products and services, and find public tenders, all on one platform for construction businesses in India.",
  alternates: { canonical: "/" },
};

const LIST_URL = "/marketplace/list-your-business";

const LIST_BENEFITS = [
  "Create or claim a company profile",
  "Add products and services",
  "Showcase company capabilities and experience",
  "Display eligible public business contact information",
  "Improve company and category search visibility",
  "Receive relevant enquiries, where supported",
  "Connect with tender opportunities through Bidcore",
];

export default async function Home() {
  const [tendersRes, companiesRes] = await Promise.all([
    getTenders({ status: "open", sort: "newest", page_size: "3" }),
    getContractors({ page_size: "3" }),
  ]);
  const tenders = tendersRes.ok ? tendersRes.data.items : [];
  const companies = companiesRes.ok ? companiesRes.data.items : [];
  const publish = signUpHref("tender-connect", { intent: "publish" });

  return (
    <div className="bg-white">
      <Hero />
      <ValueProps />
      <Audiences publish={publish} />
      <Directory companies={companies} />
      <MarketplaceSection />
      <Software />
      <TenderDiscovery ok={tendersRes.ok} tenders={tenders} publish={publish} />
      <ListYourBusiness />
    </div>
  );
}

/* ── Hero ───────────────────────────────────────────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-navy text-white">
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-20">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400 sm:text-sm">One platform for construction businesses</p>
          {/* One colour for the whole headline: white on the dark hero. Orange is kept for buttons, icons and small accents only. */}
          <h1 className="mt-4 text-balance text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">Build Smarter. Connect Better. Grow Faster.</h1>
          <p className="mt-5 text-xl font-semibold leading-snug text-slate-100 sm:text-2xl">
            AI-Powered End-to-End Construction Solutions
            <br />
            On One Integrated Platform
          </p>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            BidcoreAI helps construction businesses estimate and manage projects, discover companies and suppliers, promote their products and services, and connect with
            business opportunities, all in one platform.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/request-demo" className="w-full justify-center sm:w-auto inline-flex items-center gap-3 rounded-sm bg-orange-500 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-orange-400">
              Request a Demo <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/products" className="w-full justify-center sm:w-auto inline-flex items-center rounded-sm border border-white/60 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-white/10">
              Explore Bidcore
            </Link>
            <Link href="/live-demo" className="w-full justify-center sm:w-auto inline-flex items-center gap-2 rounded-sm border border-white/60 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-white/10">
              <PlayCircle className="h-4 w-4" /> Watch Live Demo
            </Link>
          </div>
          <p className="mt-5 text-sm text-slate-300">
            Looking for projects?{" "}
            <Link href="/tenders" className="font-semibold text-orange-300 underline-offset-2 hover:underline">
              Browse Public Tenders →
            </Link>
            <span className="mx-3 text-slate-500">|</span>
            <Link href={LIST_URL} className="font-semibold text-orange-300 underline-offset-2 hover:underline">
              List Your Business →
            </Link>
          </p>
        </div>

        <BiddersBoardGraphic />
      </div>
    </section>
  );
}

/* ── Three core value propositions ───────────────────────────────────────────────────────────────────────────────── */

const VALUE_PROPS = [
  {
    icon: Cpu,
    title: "Estimate. Plan. Manage.",
    body: "Estimate costs, prepare bids, plan schedules, and manage construction projects with integrated software.",
    cta: { label: "Explore Products", href: "/products" },
  },
  {
    icon: Building2,
    title: "Find the Right Connections.",
    body: "Discover contractors, suppliers, manufacturers, and service providers, including eligible public business contact information.",
    cta: { label: "Find Companies", href: "/marketplace/companies" },
  },
  {
    icon: ShoppingBag,
    title: "Promote Your Business.",
    body: "Showcase construction products and services and help potential buyers discover your business.",
    cta: { label: "Explore Marketplace", href: "/marketplace" },
  },
];

function ValueProps() {
  return (
    <section className="border-b border-slate-200">
      <div className="mx-auto grid max-w-7xl gap-5 px-4 py-14 sm:px-6 md:grid-cols-3">
        {VALUE_PROPS.map((v) => (
          <div key={v.title} className="flex flex-col rounded-lg border border-slate-200 bg-white p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-md bg-brand-navy text-orange-400">
              <v.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-brand-navy">{v.title}</h2>
            <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{v.body}</p>
            <Link href={v.cta.href} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:underline">
              {v.cta.label} <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ── EPC contractors and subcontractors ──────────────────────────────────────────────────────────────────────────── */

function Audiences({ publish }: { publish: string }) {
  const panels = [
    {
      eyebrow: "For EPC and General Contractors",
      title: "Source, qualify and compare subcontractor bids in one place",
      points: [
        "Publish a public tender, or invite your own network privately",
        "Share the BOQ, drawings and tender documents, with visibility set per document",
        "Qualify bidders with questionnaires before they quote",
        "Compare item-wise quotations side by side against one BOQ",
        "Take the project into estimating, planning and project management with BidcoreAI software",
      ],
      ctas: [
        { label: "Publish a Public Tender", href: publish, solid: true },
        { label: "Request a Demo", href: "/request-demo", solid: false },
      ],
      graphic: <QuotationCompareGraphic />,
    },
    {
      eyebrow: "For Subcontractors",
      title: "Find work and bid with confidence",
      points: [
        "Discover public tenders by state, city, category and keywords",
        "Receive private tender invitations from contractors",
        "Check eligibility with Go / No-Go before you invest time in a quotation",
        "Prepare item-wise quotations and attach supporting documents",
        "Shortlist opportunities and keep track of closing dates",
        "Build a company profile so contractors can find you",
      ],
      ctas: [
        { label: "Browse Public Tenders", href: "/tenders", solid: true },
        { label: "Start Free Trial", href: signUpHref("tender-connect"), solid: false },
      ],
      graphic: <OpportunityBoardGraphic />,
    },
  ];
  return (
    <section className="bg-gradient-to-br from-[#1b4a94] to-[#0f2447] text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">One platform for EPC contractors and the subcontractors they work with</h2>
        <p className="mt-3 max-w-2xl text-blue-100">Tender Connect brings both sides of a package into the same workflow, from the tender notice to the quotation.</p>
        <div className="mt-12 space-y-16">
          {panels.map((p, i) => (
            <div key={p.eyebrow} className="grid items-center gap-10 lg:grid-cols-2">
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400">{p.eyebrow}</p>
                <h3 className="mt-3 text-2xl font-bold leading-tight sm:text-3xl">{p.title}</h3>
                <ul className="mt-5 space-y-3">
                  {p.points.map((pt) => (
                    <li key={pt} className="flex items-start gap-2.5 text-sm text-blue-50 sm:text-base">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                      {pt}
                    </li>
                  ))}
                </ul>
                <div className="mt-7 flex flex-wrap gap-3">
                  {p.ctas.map((c) => (
                    <Link
                      key={c.label}
                      href={c.href}
                      className={`w-full justify-center sm:w-auto inline-flex items-center rounded-sm px-5 py-3 text-sm font-semibold uppercase tracking-wider transition ${
                        c.solid ? "bg-white text-brand-navy hover:bg-slate-200" : "border border-white/70 text-white hover:bg-white/10"
                      }`}
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
              <div className={i % 2 === 1 ? "lg:order-1" : ""}>{p.graphic}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Company directory ───────────────────────────────────────────────────────────────────────────────────────────── */

function Directory({ companies }: { companies: Contractor[] }) {
  return (
    <section className="bg-[#F6F7F9]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-brand-navy">Discover the Construction Business Network</h2>
        <p className="mt-2 max-w-2xl text-slate-600">Find contractors, suppliers, manufacturers and service providers for your next project.</p>

        <form action="/marketplace/companies" method="get" role="search" className="mt-6 flex max-w-xl flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              aria-label="Search companies"
              placeholder="Search companies by name, trade or product"
              className="w-full rounded-sm border border-slate-300 bg-white py-3 pl-9 pr-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10"
            />
          </div>
          <button className="rounded-sm bg-brand-navy px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-brand-navy-light">Find Companies</button>
        </form>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {COMPANY_SHORTCUTS.map((c) => (
            <Link key={c.label} href={c.href} className="group flex items-start gap-4 rounded-lg border border-slate-200 bg-white p-5 transition hover:border-orange-400/60 hover:shadow-sm">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-brand-navy text-orange-400">
                <c.icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-semibold text-brand-navy group-hover:text-brand-accent">{c.label}</span>
                <span className="mt-0.5 block text-sm text-slate-600">{c.blurb}</span>
              </span>
            </Link>
          ))}
        </div>

        {companies.length > 0 && (
          <div className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h3 className="text-lg font-semibold text-brand-navy">Companies on Bidcore</h3>
              <Link href="/marketplace/companies" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-navy hover:text-brand-accent">
                Browse all companies <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {companies.map((c) => (
                <Link key={c.slug} href={`/company/${c.slug}`} className="rounded-lg border border-slate-200 bg-white p-5 transition hover:border-brand-accent/40 hover:shadow-sm">
                  <h4 className="font-semibold text-brand-navy">{c.name}</h4>
                  {c.type && <p className="mt-0.5 text-sm text-slate-500">{c.type}</p>}
                  {(c.city || c.state) && (
                    <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                      <MapPin className="h-3.5 w-3.5" />
                      {[c.city, c.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Products & services marketplace ─────────────────────────────────────────────────────────────────────────────── */

function MarketplaceSection() {
  return (
    <section className="border-b border-slate-200">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-brand-navy">Discover Construction Products and Services</h2>
            <p className="mt-2 max-w-2xl text-slate-600">
              Find construction products and materials, explore services, and connect with suppliers and business opportunities across India.
            </p>
          </div>
          <Link href="/marketplace" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-navy hover:text-brand-accent">
            Explore Marketplace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCT_SHORTCUTS.map((c) => (
            <Link key={c.label} href={c.href} className="group flex flex-col rounded-lg border border-slate-200 bg-white p-5 transition hover:border-orange-400/60 hover:shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-navy text-orange-400">
                <c.icon className="h-5 w-5" />
              </span>
              <span className="mt-4 block font-semibold text-brand-navy group-hover:text-brand-accent">{c.label}</span>
              <span className="mt-1 block flex-1 text-sm text-slate-600">{c.blurb}</span>
            </Link>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap gap-5 text-sm font-semibold">
          <Link href="/marketplace/products" className="text-brand-accent hover:underline">
            Find Products
          </Link>
          <Link href="/marketplace/services" className="text-brand-accent hover:underline">
            Find Services
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ── Bidcore software ────────────────────────────────────────────────────────────────────────────────────────────── */

function Software() {
  return (
    <section className="bg-[#F6F7F9]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">BidcoreAI software</p>
        <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-brand-navy">Construction Software for Every Stage of the Project</h2>
        <p className="mt-2 max-w-2xl text-slate-600">Bring estimating, bidding, planning, project execution, and cost management into a connected workflow.</p>
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p) => {
            const page = getProductPage(p.href.replace("/products/", ""));
            const highlights = page?.capabilities.slice(0, 3).map((c) => c.title) ?? [];
            return (
              <div key={p.key} className="flex flex-col rounded-lg border border-slate-200 bg-white p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-navy text-orange-400">
                  <Cpu className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-brand-navy">BidcoreAI {p.name}</h3>
                <p className="mt-1 text-sm text-slate-600">{p.tagline}</p>
                {highlights.length > 0 && (
                  <ul className="mt-3 flex-1 space-y-1.5 text-sm text-slate-700">
                    {highlights.map((h) => (
                      <li key={h} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        {h}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-5 flex items-center gap-5 text-sm font-semibold">
                  <Link href={p.href} className="inline-flex items-center gap-1 text-brand-navy hover:text-brand-accent">
                    Learn more <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  {p.key === "tender-connect" ? (
                    <Link href={signUpHref(p.key)} className="text-brand-accent hover:underline">
                      Start free trial
                    </Link>
                  ) : (
                    <Link href={`/request-demo?product=${encodeURIComponent(p.name)}`} className="text-brand-accent hover:underline">
                      Request a demo
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-6 text-sm text-slate-500">
          Software products are BidcoreAI&apos;s own tools, which are separate from the third-party products listed in the Marketplace.{" "}
          <Link href="/pricing" className="font-medium text-brand-accent hover:underline">
            See the plans
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

/* ── Public tender discovery ─────────────────────────────────────────────────────────────────────────────────────── */

function TenderDiscovery({ ok, tenders, publish }: { ok: boolean; tenders: Tender[]; publish: string }) {
  return (
    <section>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-brand-navy">Find Your Next Project Opportunity</h2>
            <p className="mt-2 max-w-2xl text-slate-600">Public tenders are tender packages that EPC companies and general contractors publish openly to receive more quotations. Explore them and find projects relevant to your business.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/tenders" className="rounded-sm bg-brand-navy px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-brand-navy-light">
              Browse Public Tenders
            </Link>
            <Link href={publish} className="rounded-sm border border-slate-300 bg-white px-5 py-3 text-sm font-semibold uppercase tracking-wider text-brand-navy hover:border-slate-400">
              Publish a Public Tender
            </Link>
          </div>
        </div>

        {!ok ? (
          <p className="mt-8 rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">Tenders are temporarily unavailable. Please try again in a few minutes.</p>
        ) : tenders.length === 0 ? (
          <div className="mt-8 rounded-lg border border-slate-200 bg-white p-10 text-center">
            <p className="font-medium text-slate-800">No tenders are open right now.</p>
            <p className="mt-1 text-sm text-slate-500">New public tenders appear here as soon as they are published.</p>
          </div>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tenders.map((t) => (
              <TenderCard key={t.id} tender={t} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── List your business ──────────────────────────────────────────────────────────────────────────────────────────── */

function ListYourBusiness() {
  return (
    <section className="bg-brand-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Put Your Business in Front of Construction Buyers</h2>
          <p className="mt-4 max-w-lg leading-relaxed text-slate-300">
            Create your company profile, showcase your products and services, and help contractors and procurement teams discover your business.
          </p>
          <div className="mt-7">
            <Link href={LIST_URL} className="w-full justify-center sm:w-auto inline-flex items-center gap-3 rounded-sm bg-orange-500 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-orange-400">
              List Your Business <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="mt-4 max-w-lg text-xs leading-relaxed text-slate-400">A profile is marked claimed or verified only after the business claims it and Bidcore verifies it, and never automatically.</p>
        </div>
        <ul className="space-y-3 rounded-lg border border-white/15 bg-white/5 p-6 text-sm">
          {LIST_BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2 text-slate-100">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
