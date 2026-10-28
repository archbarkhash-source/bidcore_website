import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, CalendarClock, Calculator, Cpu, FileText, ShoppingBag, Truck } from "lucide-react";
import { SITE_URL } from "@/lib/bidcore-api";

export const metadata: Metadata = {
  title: "About Bidcore | AI-Powered End-to-End Construction Solutions",
  description:
    "BidcoreAI connects construction software, public tenders, company discovery and a marketplace for construction products and services in one integrated ecosystem, with BidcoreAI software serving both the United States and India.",
  alternates: { canonical: "/about" },
  openGraph: { title: "About Bidcore", url: `${SITE_URL}/about`, type: "website", siteName: "Bidcore", locale: "en_IN" },
};

// The four parts of the Bidcore ecosystem. Each links to a page that already exists.
const ECOSYSTEM = [
  {
    icon: Cpu,
    title: "Construction Software",
    body: "BidcoreAI, our AI-powered software: tools for construction estimating, quantity takeoff, tendering, bidding, scheduling, project management, and cost control.",
    cta: { label: "Explore Software", href: "/products" },
  },
  {
    icon: FileText,
    title: "Public Tenders",
    body: "Discover public tender opportunities, review key tender information, and publish tender opportunities for relevant construction businesses.",
    cta: { label: "Explore Tenders", href: "/tenders" },
  },
  {
    icon: ShoppingBag,
    title: "Construction Marketplace",
    body: "Discover construction materials, products, equipment, suppliers, manufacturers, and service providers.",
    cta: { label: "Explore Marketplace", href: "/marketplace" },
  },
  {
    icon: Building2,
    title: "Company Directory",
    body: "Find construction companies, EPC contractors, subcontractors, and professional service providers to build valuable business connections.",
    cta: { label: "Find Contractors", href: "/marketplace/companies" },
  },
];

const PLATFORMS = [
  {
    market: "United States",
    body: "BidcoreAI software for US construction workflows, from preconstruction and estimating through bidding and project delivery.",
    cta: { label: "Explore BidcoreAI in the United States", href: "https://www.bidcoreai.com", external: true },
  },
  {
    market: "India",
    body: "BidcoreAI software adapted to Indian workflows, including BOQ preparation, item-rate estimation, CPWD and MoRTH cost models, tender discovery, and construction project management.",
    cta: { label: "Explore BidcoreAI in India", href: "/products", external: false },
  },
];

const buttonSolid = "inline-flex items-center gap-3 rounded-sm bg-orange-500 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-orange-400";
const buttonOutline = "inline-flex items-center rounded-sm border border-white/60 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-white/10";

// A hub-and-spokes picture: a name in the middle, four connected parts around it. Purely decorative (the text next to it says the same in words).
// Used twice: the Bidcore ecosystem, and the BidcoreAI products.
type HubNode = { icon: typeof Cpu; label: string };
const POSITIONS = ["left-0 top-0", "right-0 top-0", "bottom-0 left-0", "bottom-0 right-0"];
const BIDCORE_NODES: HubNode[] = [
  { icon: Cpu, label: "BidcoreAI software" },
  { icon: FileText, label: "Public tenders" },
  { icon: ShoppingBag, label: "Marketplace" },
  { icon: Building2, label: "Company directory" },
];
const BIDCOREAI_NODES: HubNode[] = [
  { icon: FileText, label: "Tender Connect" },
  { icon: Calculator, label: "Tender Management" },
  { icon: CalendarClock, label: "Project Management" },
  { icon: Truck, label: "Procurement & Site Operations" },
];

function HubGraphic({ hub, sub, nodes }: { hub: string; sub: string; nodes: HubNode[] }) {
  return (
    <div aria-hidden className="relative mx-auto aspect-[6/5] w-full max-w-md">
      <div className="absolute inset-4 rounded-[2rem] bg-gradient-to-br from-[#F6F7F9] to-orange-50" />
      <svg viewBox="0 0 100 80" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {[
          [22, 14],
          [78, 14],
          [22, 66],
          [78, 66],
        ].map(([x, y]) => (
          <g key={`${x}-${y}`}>
            <line x1="50" y1="40" x2={x} y2={y} stroke="#cbd5e1" strokeWidth="1.2" strokeDasharray="3 2.5" vectorEffect="non-scaling-stroke" />
            <circle cx={x} cy={y} r="1.3" fill="#f97316" />
          </g>
        ))}
      </svg>
      <div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-brand-navy text-white shadow-xl ring-8 ring-white">
        <div className="text-center leading-tight">
          <div className="text-lg font-bold">{hub}</div>
          <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-orange-300">{sub}</div>
        </div>
      </div>
      {nodes.map((n, i) => (
        <div key={n.label} className={`absolute ${POSITIONS[i]} flex w-[42%] flex-col items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-4 text-center shadow-md`}>
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-navy text-orange-400">
            <n.icon className="h-5 w-5" />
          </span>
          <span className="text-xs font-semibold leading-tight text-slate-700 sm:text-sm">{n.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero: one colour for the whole headline; orange only on the eyebrow and the primary button */}
      <section className="bg-brand-navy text-white">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400 sm:text-sm">About Bidcore</p>
          <h1 className="mt-4 text-balance text-4xl font-bold leading-[1.12] tracking-tight text-white sm:text-5xl">
            AI-Powered End-to-End Construction Solutions
            <br />
            On One Integrated Platform
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-300">
            BidcoreAI connects construction software, public tenders, company discovery, and a marketplace for construction products and services, helping businesses
            discover opportunities, prepare bids, manage projects, and connect with the wider construction industry.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/products" className={buttonSolid}>
              Explore Bidcore <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/marketplace" className={buttonOutline}>
              Explore the Marketplace
            </Link>
          </div>
        </div>
      </section>

      {/* Our story */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-brand-navy">Building a Connected Construction Industry</h2>
            <div className="mt-5 space-y-4 leading-relaxed text-slate-600">
              <p>
                Construction businesses often rely on separate tools to estimate costs, prepare tenders, manage projects, discover suppliers, and find new business
                opportunities.
              </p>
              <p>Bidcore is being built to bring these workflows closer together through one integrated construction technology ecosystem.</p>
              <p>
                From BidcoreAI, our AI-powered construction software, and tender discovery to company connections and product sourcing, Bidcore aims to help construction
                businesses work more efficiently and find opportunities across the industry.
              </p>
            </div>
          </div>
          <HubGraphic hub="Bidcore" sub="Ecosystem" nodes={BIDCORE_NODES} />
        </div>
      </section>

      {/* The four parts */}
      <section className="border-t border-slate-200 bg-[#F6F7F9]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-brand-navy">The Bidcore ecosystem</h2>
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ECOSYSTEM.map((e) => (
              <div key={e.title} className="flex flex-col rounded-lg border border-slate-200 bg-white p-6 transition hover:border-orange-400/60 hover:shadow-sm">
                <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-navy text-orange-400">
                  <e.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-brand-navy">{e.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{e.body}</p>
                <Link href={e.cta.href} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:underline">
                  {e.cta.label} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BidcoreAI: the software, with a matching graphic */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="grid items-center gap-10 md:grid-cols-[1fr_1.4fr]">
          <HubGraphic hub="BidcoreAI" sub="Software" nodes={BIDCOREAI_NODES} />
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-brand-navy">BidcoreAI: our construction software</h2>
            <p className="mt-5 leading-relaxed text-slate-600">
              BidcoreAI is the AI-powered software at the centre of Bidcore, used in both the United States and India. Its products follow the construction workflow from the first tender to the site: Tender
              Connect, Tender Management, Project Management, Procurement Management and Site Operations.
            </p>
            <Link href="/products" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:underline">
              Explore the BidcoreAI software <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Two platforms, one ecosystem */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-brand-navy">One software, two markets</h2>
        <p className="mt-3 max-w-2xl text-slate-600">BidcoreAI is the software in both the United States and India. Bidcore is the parent brand, and each market has a website built for it.</p>
        <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
          {PLATFORMS.map((p) => (
            <div key={p.market} className="flex flex-col rounded-lg border border-slate-200 bg-white p-7">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">{p.market}</p>
                {/* eslint-disable-next-line @next/next/no-img-element -- plain img, matching the header logo */}
                <img src="/images/bidcoreai-logo.png" alt="BidcoreAI" width={395} height={100} className="h-6 w-auto rounded" />
              </div>
              <h3 className="mt-2 text-2xl font-bold text-brand-navy">BidcoreAI in {p.market === "United States" ? "the United States" : "India"}</h3>
              <p className="mt-3 flex-1 leading-relaxed text-slate-600">{p.body}</p>
              {p.cta.external ? (
                <a href={p.cta.href} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:underline">
                  {p.cta.label} <ArrowRight className="h-3.5 w-3.5" />
                </a>
              ) : (
                <Link href={p.cta.href} className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:underline">
                  {p.cta.label} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Mission */}
      <section className="border-y border-slate-200 bg-[#F6F7F9]">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-brand-navy">Our Mission</h2>
          <p className="mt-5 text-xl font-medium leading-relaxed text-slate-700">
            To make construction technology more connected, practical, and accessible, helping construction businesses estimate with confidence, discover opportunities,
            manage projects, and build stronger industry relationships.
          </p>
        </div>
      </section>

      {/* Final call to action */}
      <section className="bg-brand-navy text-white">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight">Be Part of a More Connected Construction Industry</h2>
          <p className="mx-auto mt-4 max-w-2xl leading-relaxed text-slate-300">
            Whether you are a contractor looking for better construction software, a business searching for tender opportunities, or a supplier looking to connect with
            construction companies, Bidcore brings these possibilities into one ecosystem.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/products" className={buttonSolid}>
              Explore Bidcore <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/marketplace/list-your-business" className={buttonOutline}>
              List Your Business
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
