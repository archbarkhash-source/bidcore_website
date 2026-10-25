import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SOLUTIONS } from "@/lib/solutions";

export const metadata: Metadata = {
  title: "Solutions for EPC, General, Design-Build Contractors and Subcontractors | Bidcore",
  description: "How BidcoreAI helps EPC contractors, general contractors, design-build contractors and subcontractors in India: tendering, estimating, planning and project delivery.",
  alternates: { canonical: "/solutions" },
};

export default function SolutionsIndex() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">Solutions</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">Solutions for every kind of contractor</h1>
      <p className="mt-3 max-w-2xl text-slate-600">
        BidcoreAI provides solutions to EPC contractors, general contractors, design-build contractors and subcontractors, and custom solutions that integrate your existing products
        with BidcoreAI. Choose yours to see how it helps.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        {SOLUTIONS.map((s) => (
          <Link key={s.slug} href={`/solutions/${s.slug}`} className="group flex flex-col rounded-lg border border-slate-200 bg-white p-6 transition hover:border-orange-400/60 hover:shadow-sm">
            <h2 className="font-semibold text-brand-navy group-hover:text-brand-accent">{s.name}</h2>
            <p className="mt-2 flex-1 text-sm text-slate-600">{s.summary}</p>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent">
              See the solution <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
