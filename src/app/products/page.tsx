import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PRODUCTS, signUpHref } from "@/lib/app-links";

export const metadata: Metadata = {
  title: "BidcoreAI Construction Software Products | Bidcore",
  description: "BidcoreAI construction software for Indian contractors: Tender Connect, Tender Management, Project Management and more.",
  alternates: { canonical: "/products" },
};

// The software catalogue. Not to be confused with the construction products that businesses promote in the Marketplace.
export default function ProductsIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">Construction software</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">BidcoreAI software products</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        Software for estimating, tendering, planning and running construction projects. Looking for construction products and suppliers instead? Visit the{" "}
        <Link href="/marketplace" className="font-medium text-brand-accent hover:underline">
          Marketplace
        </Link>
        .
      </p>
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {PRODUCTS.map((p) => {
          return (
            <div key={p.key} className="flex flex-col rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="font-semibold text-brand-navy">BidcoreAI {p.name}</h2>
              <p className="mt-2 flex-1 text-sm text-slate-600">{p.tagline}</p>
              <div className="mt-5 flex items-center gap-5 text-sm font-semibold">
                <Link href={p.href} className="inline-flex items-center gap-1 text-brand-navy hover:text-brand-accent">
                  Learn more <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link href={signUpHref(p.key)} className="text-brand-accent hover:underline">
                  Start free trial
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
