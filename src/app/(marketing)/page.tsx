import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calculator, CheckCircle2, ClipboardList, Cpu, FileSearch, HardHat, MapPin, PlayCircle, Search, Sparkles } from "lucide-react";
import TenderCard from "@/components/TenderCard";
import { BiddersBoardGraphic, OpportunityBoardGraphic, QuotationCompareGraphic } from "@/components/graphics/TenderConnectGraphics";
import type { Contractor, Tender } from "@/lib/bidcore-api";
import { listDirectory } from "@/lib/directory";
import { getTenders } from "@/lib/site-tenders";
import { PRODUCTS, signUpHref, FREE_TRIAL_OPEN, TENDER_CONNECT_DEMO } from "@/lib/app-links";
import { getProductPage } from "@/lib/product-pages";

// The landing page is about ONE thing: BidcoreAI, the complete AI-integrated construction life-cycle solution for contractors (tender to handover).
// Public tenders and the contractor directory follow as connected parts; the products & services marketplace is reached from the menu and footer, not from here. Live sections (companies, tenders) use real data from the BidcoreAI API; a section with no data is left out rather than filled
// with placeholders, and nothing here is an invented count, rating or testimonial.
export const revalidate = 60;

export const metadata: Metadata = {
  title: "Construction Estimation and Tender Management Software | BidcoreAI",
  description:
    "One platform for EPC contractors: tender analysis, quantity takeoff, CPWD / MoRTH cost estimation, tender cost and schedules, subcontractor tendering, budgets, procurement, daily progress and site operations.",
  alternates: { canonical: "/" },
};

export default async function Home() {
  const [tendersRes, companiesRes] = await Promise.all([
    getTenders({ status: "open", sort: "newest", page_size: "3" }),
    listDirectory({ page_size: 3 }),
  ]);
  const tenders = tendersRes.ok ? tendersRes.data.items : [];
  const companies = companiesRes.ok ? companiesRes.data.items : [];

  return (
    <div className="bg-white">
      <Hero />
      <LifeCycle />
      <ValueProps />
      <Audiences />
      <Software />
      <TenderDiscovery ok={tendersRes.ok} tenders={tenders} />
      <Directory companies={companies} />
    </div>
  );
}

/* ── Hero ───────────────────────────────────────────────────────────────────────────────────────────────────────── */

function Hero() {
  return (
    <section className="relative overflow-hidden bg-brand-navy text-white">
      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-20">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400 sm:text-sm">India &amp; Asia · For EPC contractors, general contractors and subcontractors</p>
          {/* One colour for the whole headline: white on the dark hero. Orange is kept for buttons, icons and small accents only. */}
          <h1 className="mt-4 text-balance text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">Complete AI-Integrated Construction Life Cycle Solution</h1>
          <p className="mt-5 text-xl font-semibold leading-snug text-slate-100 sm:text-2xl">
            From tender to handover, for EPC contractors
            <br />
            On one integrated platform
          </p>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Analyse tender documents, take off quantities, estimate with CPWD, CPWD E&amp;M and MoRTH cost models, build the tender cost and schedule, invite and compare
            subcontractors, then run the project: budget, procurement, daily progress and site crews, all in BidcoreAI.
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
            <Link href="/contractors" className="font-semibold text-orange-300 underline-offset-2 hover:underline">
              Find Contractors →
            </Link>
          </p>
        </div>

        <BiddersBoardGraphic />
      </div>
    </section>
  );
}

/* ── The construction life cycle ─────────────────────────────────────────────────────────────────────────────────── */

// Every stage names the product(s) that do it and what the software does today; "AI" marks only the steps where it assists (and the person still reviews the result).
const STAGES = [
  {
    n: "01",
    products: [{ name: "Tender Connect", href: "/products/tender-connect" }],
    title: "Find and qualify tenders",
    body: "Public tenders and private invitations on one Tender Board, with closing dates tracked.",
    ai: "AI Go / No-Go: your Company Intelligence checked against the tender's eligibility, missing data flagged for review.",
  },
  {
    n: "02",
    products: [{ name: "BidcoreAI Sync", href: "/products/sync" }],
    title: "Analyse tender documents",
    body: "RFP, datasheet, schedules and corrigenda in one place, with the bid security, performance security and key dates read out.",
    ai: "AI tender analysis: every finding keeps its document and page, so you can check it in one click.",
  },
  {
    n: "03",
    products: [{ name: "BidcoreAI Scale", href: "/products/scale" }],
    title: "Take off and estimate",
    body: "Digital quantity takeoff from PDF drawings and cost estimation with CPWD Civil, CPWD E&M, MoRTH and your own cost models.",
    ai: "AI assistance: symbol counts on drawings and automatic assignment of rate analyses to BOQ lines.",
  },
  {
    n: "04",
    products: [{ name: "BidcoreAI Scale", href: "/products/scale" }, { name: "BidcoreAI Sync", href: "/products/sync" }],
    title: "Tender cost and schedule",
    body: "Overheads, GST and profit on one bid cost estimate; EMD and securities calculated; a schedule, WBS and productivity built from the BOQ.",
    ai: "Agent X, the AI assistant, answers questions on the tender and the project in plain language.",
  },
  {
    n: "05",
    products: [{ name: "Tender Connect", href: "/products/tender-connect" }, { name: "BidcoreAI Sync", href: "/products/sync" }],
    title: "Subcontract and procure",
    body: "Invite subcontractors, compare item-wise quotations, then purchase orders, change orders and material delivery.",
    ai: "Matching subcontractors are found in the Bidcore contractor directory by trade and location.",
  },
  {
    n: "06",
    products: [{ name: "BidcoreAI Sync", href: "/products/sync" }],
    title: "Build, control and hand over",
    body: "Budget against actual cost, the project schedule with actual dates, daily progress reports, RA bills, monthly MIS and site crews.",
    ai: "Forecasts follow the site: quantities logged in daily progress reports move the schedule forecast.",
  },
];

function LifeCycle() {
  return (
    <section className="border-b border-slate-200 bg-[#F6F7F9]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">The construction life cycle</p>
        <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-brand-navy">One connected workflow, from the tender notice to handover</h2>
        <p className="mt-2 max-w-2xl text-slate-600">
          Each stage uses the work of the one before: the quantities you take off become the estimate, the estimate becomes the tender cost and the budget, the BOQ becomes
          the schedule.
        </p>
        <ol className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {STAGES.map((st) => (
            <li key={st.n} className="flex flex-col rounded-lg border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-orange-500">{st.n}</span>
                <span className="flex flex-wrap gap-1.5">
                  {st.products.map((pr) => (
                    <Link key={pr.name} href={pr.href} className="rounded-full bg-brand-navy/5 px-2.5 py-0.5 text-xs font-semibold text-brand-navy hover:bg-brand-navy/10">
                      {pr.name}
                    </Link>
                  ))}
                </span>
              </div>
              <h3 className="mt-1 text-lg font-semibold text-brand-navy">{st.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{st.body}</p>
              <p className="mt-4 flex items-start gap-2 rounded-md bg-brand-navy/5 p-3 text-sm text-brand-navy">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                {st.ai}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ── Three core value propositions ───────────────────────────────────────────────────────────────────────────────── */

// The solutions in BidcoreAI, in the order a tender becomes a project. Each card links to its product page.
const VALUE_PROPS = [
  {
    icon: FileSearch,
    title: "BidcoreAI Tender Connect",
    body: "Invite subcontractors from the Bidcore contractor directory, receive and compare their quotations, and check Go / No-Go eligibility on public tenders.",
    cta: { label: "Tender Connect", href: "/products/tender-connect" },
  },
  {
    icon: Calculator,
    title: "BidcoreAI Scale",
    body: "Takeoff and estimating: digital quantity takeoff, BOQ, and cost estimation with CPWD, CPWD E&M and MoRTH cost models or your own rates, with the tender cost.",
    cta: { label: "BidcoreAI Scale", href: "/products/scale" },
  },
  {
    icon: ClipboardList,
    title: "BidcoreAI Sync",
    body: "The end-to-end lifecycle: tender analysis, estimating, schedule, budget, procurement and site operations on one platform, with Scale and Tender Connect included.",
    cta: { label: "BidcoreAI Sync", href: "/products/sync" },
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

function Audiences() {
  const panels = [
    {
      eyebrow: "For EPC and General Contractors",
      title: "Source, qualify and compare subcontractor bids in one place",
      points: [
        "Invite subcontractors from your own network or the Bidcore contractor directory",
        "Share the BOQ, drawings and tender documents, with visibility set per document",
        "Qualify bidders with questionnaires before they quote",
        "Compare item-wise quotations side by side against one BOQ",
        "Take the project into estimating, planning and project management with BidcoreAI software",
      ],
      ctas: [
        { label: "Request a Demo", href: "/request-demo", solid: true },
        { label: "See the Products", href: "/products", solid: false },
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
        "Plan your crews and equipment with Site Operations",
      ],
      ctas: [
        { label: "Browse Public Tenders", href: "/tenders", solid: true },
        FREE_TRIAL_OPEN ? { label: "Start Free Trial", href: signUpHref("tender-connect"), solid: false } : { label: "Request a Demo", href: TENDER_CONNECT_DEMO, solid: false },
      ],
      graphic: <OpportunityBoardGraphic />,
    },
  ];
  return (
    <section className="bg-gradient-to-br from-[#1b4a94] to-[#0f2447] text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">One platform for EPC contractors and the subcontractors they work with</h2>
        <p className="mt-3 max-w-2xl text-blue-100">Both sides of a package work in the same life cycle, from the tender notice to the quotation and the work on site.</p>
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
        <h2 className="text-3xl font-bold tracking-tight text-brand-navy">Bidcore Contractor Directory</h2>
        <p className="mt-2 max-w-2xl text-slate-600">EPC contractors, subcontractors and design-build contractors you can invite to your tenders.</p>

        <form action="/contractors" method="get" role="search" className="mt-6 flex max-w-xl flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              name="q"
              aria-label="Search contractors"
              placeholder="Search contractors by name, trade or city"
              className="w-full rounded-sm border border-slate-300 bg-white py-3 pl-9 pr-3 text-sm outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10"
            />
          </div>
          <button className="rounded-sm bg-brand-navy px-6 py-3 text-sm font-bold uppercase tracking-wider text-white transition hover:bg-brand-navy-light">Find Contractors</button>
        </form>

        {companies.length > 0 && (
          <div className="mt-10">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h3 className="text-lg font-semibold text-brand-navy">Contractors on Bidcore</h3>
              <Link href="/contractors" className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-brand-navy hover:text-brand-accent">
                Browse all contractors <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {companies.map((c) => (
                <Link key={c.slug} href={`/contractor/${c.slug}`} className="rounded-lg border border-slate-200 bg-white p-5 transition hover:border-brand-accent/40 hover:shadow-sm">
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

/* ── Bidcore software ────────────────────────────────────────────────────────────────────────────────────────────── */

function Software() {
  return (
    <section className="bg-[#F6F7F9]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">BidcoreAI software</p>
        <h2 className="mt-2 max-w-3xl text-3xl font-bold tracking-tight text-brand-navy">The BidcoreAI products behind each stage</h2>
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
                  {p.key === "tender-connect" && FREE_TRIAL_OPEN ? (
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
          Use one product or the whole life cycle.{" "}
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

function TenderDiscovery({ ok, tenders }: { ok: boolean; tenders: Tender[] }) {
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
