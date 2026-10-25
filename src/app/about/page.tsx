import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Building2, Cpu, FileText, ShoppingBag } from "lucide-react";
import { SITE_URL } from "@/lib/bidcore-api";

export const metadata: Metadata = {
  title: "About Bidcore | Construction Software, Network and Marketplace for India",
  description:
    "Bidcore is one platform for construction businesses in India: construction software, public tenders, a company directory and a marketplace for products and services.",
  alternates: { canonical: "/about" },
  openGraph: { title: "About Bidcore", url: `${SITE_URL}/about`, type: "website", siteName: "Bidcore", locale: "en_IN" },
};

const OFFERINGS = [
  {
    icon: Cpu,
    title: "Construction software",
    body: "BidcoreAI software for tendering, estimating, project planning, procurement and site operations.",
    link: { label: "Explore products", href: "/products" },
  },
  {
    icon: FileText,
    title: "Public tenders",
    body: "Discover public tenders, check your eligibility, prepare quotations, or publish a tender of your own.",
    link: { label: "Browse public tenders", href: "/tenders" },
  },
  {
    icon: Building2,
    title: "Business network",
    body: "Find contractors, suppliers, manufacturers, consultants and service providers.",
    link: { label: "Find companies", href: "/marketplace/companies" },
  },
  {
    icon: ShoppingBag,
    title: "Marketplace",
    body: "Promote construction products and services, and find them when you need them.",
    link: { label: "Open the marketplace", href: "/marketplace" },
  },
];

export default function AboutPage() {
  return (
    <div className="bg-white">
      <section className="bg-brand-navy text-white">
        <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400 sm:text-sm">About us</p>
          <h1 className="mt-4 text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">One platform for construction businesses in India</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">
            Bidcore brings construction software, public tenders, a company directory and a marketplace for products and services together, so the people who
            estimate, bid, source and build can work from the same place.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-brand-navy">What we provide</h2>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {OFFERINGS.map((o) => (
            <div key={o.title} className="flex flex-col rounded-lg border border-slate-200 bg-white p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-navy text-orange-400">
                <o.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-brand-navy">{o.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{o.body}</p>
              <Link href={o.link.href} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:underline">
                {o.link.label} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[#F6F7F9]">
        <div className="mx-auto grid max-w-5xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-brand-navy">Who it is for</h2>
            <p className="mt-3 leading-relaxed text-slate-600">
              EPC contractors, general contractors, design-build contractors and subcontractors, and the suppliers, manufacturers and consultants who work with them.
              Companies that already use other software can talk to us about integrating it with BidcoreAI.
            </p>
            <Link href="/solutions" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:underline">
              See our solutions <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-brand-navy">How we work</h2>
            <ul className="mt-3 space-y-3 leading-relaxed text-slate-600">
              <li>
                <strong className="font-semibold text-slate-800">Your records stay yours.</strong> Packages, documents and quotations are private to the companies involved.
              </li>
              <li>
                <strong className="font-semibold text-slate-800">Verification is earned.</strong> A company profile is marked claimed or verified only after the business claims
                it and Bidcore verifies it, never automatically.
              </li>
              <li>
                <strong className="font-semibold text-slate-800">India and the United States.</strong> Bidcore.in is the India version. The country selector in the top bar
                takes you to the BidcoreAI website for the United States.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-brand-navy text-white">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Talk to the Bidcore team</h2>
            <p className="mt-2 text-slate-300">Questions, a demo, or something you would like us to build with you.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/request-demo" className="rounded-sm bg-orange-500 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-orange-400">
              Request a Demo
            </Link>
            <Link href="/faq" className="rounded-sm border border-white/60 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-white/10">
              Read the FAQ
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
