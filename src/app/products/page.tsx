import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CardArt, SuiteGraphic } from "@/components/graphics/ProductGraphics";
import { PRODUCTS, signUpHref, FREE_TRIAL_OPEN } from "@/lib/app-links";

export const metadata: Metadata = {
  title: "BidcoreAI Scale, BidcoreAI Sync and Tender Connect | Construction Software for India and Asia",
  description: "BidcoreAI Scale for takeoff and estimating, BidcoreAI Sync for the end-to-end construction lifecycle, and Tender Connect for tenders and quotations. Built for India and the Asian market.",
  alternates: { canonical: "/products" },
};

// The software catalogue. Not to be confused with the construction products that businesses promote in the Marketplace.
// The top of the page matches the product pages (dark band, logo, headline, buttons, an illustration); only Tender Connect has a free trial.
export default function ProductsIndex() {
  return (
    <div>
      <section className="relative overflow-hidden bg-brand-navy text-white">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_40%,rgba(251,191,36,0.10),transparent_55%)]" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:py-20">
          <div>
            {/* eslint-disable-next-line @next/next/no-img-element -- plain img, matching the header logo */}
            <img src="/images/bidcoreai-logo.png" alt="BidcoreAI" width={395} height={100} className="h-8 w-auto rounded-md" />
            <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
              <span className="mb-3 block text-lg font-semibold tracking-normal text-amber-300 sm:text-xl">Construction software</span>
              BidcoreAI products for India &amp; Asia
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-200">
              BidcoreAI Scale is takeoff and estimating. BidcoreAI Sync is the whole lifecycle, from the first tender to the last site report, and includes Scale and Tender Connect. Tender Connect publishes tenders and manages quotations on its own. Looking for construction products and
              suppliers instead? Visit the{" "}
              <Link href="/supply" className="font-semibold text-white underline underline-offset-2 hover:text-amber-300">
                supplier and vendor directory
              </Link>
              .
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/request-demo" className="w-full justify-center sm:w-auto inline-flex items-center gap-2 rounded-sm bg-white px-5 py-3 text-sm font-semibold uppercase tracking-wider text-brand-navy transition hover:bg-slate-200">
                Request a Demo
              </Link>
              {FREE_TRIAL_OPEN && <a href={signUpHref("tender-connect")} className="w-full justify-center sm:w-auto inline-flex items-center gap-2 rounded-sm border border-white/60 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-white/10">
                Start free with Tender Connect
              </a>}
            </div>
          </div>
          <SuiteGraphic />
        </div>
      </section>

      <div className="bg-[#F6F7F9]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {PRODUCTS.map((p) => (
              <div key={p.key} className="flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white">
                <CardArt product={p.key} />
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="font-semibold text-brand-navy">BidcoreAI {p.name}</h2>
                  <p className="mt-2 flex-1 text-sm text-slate-600">{p.tagline}</p>
                  <div className="mt-5 flex items-center gap-5 text-sm font-semibold">
                    <Link href={p.href} className="inline-flex items-center gap-1 text-brand-navy hover:text-brand-accent">
                      Learn more <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    {p.key === "tender-connect" && FREE_TRIAL_OPEN ? (
                      <Link href={signUpHref(p.key)} className="text-brand-accent hover:underline">
                        Start free trial
                      </Link>
                    ) : (
                      <Link href={`/request-demo?product=${encodeURIComponent(p.demoInterest)}`} className="text-brand-accent hover:underline">
                        Request a demo
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h2 className="mt-14 text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Which one do you need?</h2>
          <p className="mt-2 max-w-3xl text-slate-600">Sync includes everything in Scale and Tender Connect. Scale and Tender Connect can each be used on their own.</p>
          <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200 bg-white">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th scope="col" className="px-4 py-3 font-bold text-brand-navy"></th>
                  <th scope="col" className="px-4 py-3 font-bold text-brand-navy">Tender Connect</th>
                  <th scope="col" className="px-4 py-3 font-bold text-brand-navy">BidcoreAI Scale</th>
                  <th scope="col" className="px-4 py-3 font-bold text-brand-navy">BidcoreAI Sync</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE_ROWS.map(([label, tc, scale, sync]) => (
                  <tr key={label} className="border-t border-slate-200">
                    <th scope="row" className="px-4 py-3 font-semibold text-brand-navy">
                      {label}
                    </th>
                    {[tc, scale, sync].map((v, i) => (
                      <td key={i} className={`px-4 py-3 ${v ? "font-medium text-emerald-700" : "text-slate-400"}`}>
                        {v ? "Included" : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-500">Some features are still being released to every account. Request a demo to see what is available today.</p>
        </div>
      </div>
    </div>
  );
}

// [what, Tender Connect, Scale, Sync]
const COMPARE_ROWS: [string, boolean, boolean, boolean][] = [
  ["Publish public and private tenders, invite contractors, compare quotations", true, false, true],
  ["Go / No-Go eligibility check", true, false, true],
  ["AI-powered and auto takeoff, and AI agents", false, true, true],
  ["BOQ", false, true, true],
  ["Cost estimation on CPWD, CPWD E&M and MoRTH cost models, or your own", false, true, true],
  ["Tender cost and bid cost estimate", false, false, true],
  ["Tender document analysis with page references", false, false, true],
  ["Tender schedule, WBS and productivity", false, false, true],
  ["Project budget, schedule, daily progress and risk", false, false, true],
  ["Procurement: purchase orders, log and change orders", false, false, true],
  ["Site operations: crews, equipment and work packages", false, false, true],
];
