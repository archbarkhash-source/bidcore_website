import type { Metadata } from "next";
import { Building2, HardHat, PencilRuler, Plug, Wrench, type LucideIcon } from "lucide-react";
import { SolutionCard, SolutionCta, SolutionHero } from "@/components/solutions/SolutionParts";
import { SOLUTIONS } from "@/lib/solutions";

export const metadata: Metadata = {
  title: "Solutions for EPC, General, Design-Build Contractors and Subcontractors | Bidcore",
  description: "How BidcoreAI helps EPC contractors, general contractors, design-build contractors and subcontractors in India: tendering, estimating, planning and project delivery.",
  alternates: { canonical: "/solutions" },
};

// One icon per solution, by slug.
const ICONS: Record<string, LucideIcon> = {
  "epc-contractors": Building2,
  "general-contractors": HardHat,
  "design-build-contractors": PencilRuler,
  subcontractors: Wrench,
  "custom-solutions": Plug,
};

// The index uses the same design as each solution page (shared parts in components/solutions): dark hero, a white section of cards, the closing band.
export default function SolutionsIndex() {
  return (
    <div className="bg-white">
      <SolutionHero
        eyebrow="Solutions"
        headline="Solutions for every kind of contractor"
        intro="BidcoreAI provides solutions to EPC contractors, general contractors, design-build contractors and subcontractors, and custom solutions that integrate your existing products with BidcoreAI."
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-brand-navy">Choose the solution for your business</h2>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {SOLUTIONS.map((s) => (
            <SolutionCard key={s.slug} icon={ICONS[s.slug] ?? Building2} title={s.name} body={s.summary} link={{ href: `/solutions/${s.slug}`, label: "See the solution" }} />
          ))}
        </div>
      </section>

      <SolutionCta />
    </div>
  );
}
