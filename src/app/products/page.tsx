import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { CardArt, SuiteGraphic } from "@/components/graphics/ProductGraphics";
import { PRODUCTS, signUpHref } from "@/lib/app-links";

export const metadata: Metadata = {
  title: "BidcoreAI Construction Software Products | Bidcore",
  description: "BidcoreAI construction software for Indian contractors: Tender Connect, Tender Management, Project Management and more.",
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
              BidcoreAI software products
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-200">
              Software for estimating, tendering, planning and running construction projects, from the first tender to the last site report. Looking for construction products and
              suppliers instead? Visit the{" "}
              <Link href="/marketplace" className="font-semibold text-white underline underline-offset-2 hover:text-amber-300">
                Marketplace
              </Link>
              .
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link href="/request-demo" className="w-full justify-center sm:w-auto inline-flex items-center gap-2 rounded-sm bg-white px-5 py-3 text-sm font-semibold uppercase tracking-wider text-brand-navy transition hover:bg-slate-200">
                Request a Demo
              </Link>
              <a href={signUpHref("tender-connect")} className="w-full justify-center sm:w-auto inline-flex items-center gap-2 rounded-sm border border-white/60 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-white/10">
                Start free with Tender Connect
              </a>
            </div>
          </div>
          <SuiteGraphic />
        </div>
      </section>

      <div className="bg-[#F6F7F9]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
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
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
