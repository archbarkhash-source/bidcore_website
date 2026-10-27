import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, FileSearch, Plug, Ruler, Sparkles, type LucideIcon } from "lucide-react";
import { SITE_URL } from "@/lib/bidcore-api";
import { SolutionCard, SolutionCta, SolutionHero } from "@/components/solutions/SolutionParts";
import { SOLUTIONS, getSolution } from "@/lib/solutions";

// One statically generated page per audience: /solutions/epc-contractors, /general-contractors, /design-build-contractors, /subcontractors.
export const dynamicParams = false;

export function generateStaticParams() {
  return SOLUTIONS.map((s) => ({ slug: s.slug }));
}

// An icon per example of a custom solution, in the order they are listed in lib/solutions.ts.
const EXAMPLE_ICONS: LucideIcon[] = [Ruler, FileSearch, Plug, Sparkles];

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const s = getSolution(slug);
  if (!s) return {};
  const path = `/solutions/${s.slug}`;
  return {
    title: s.metaTitle,
    description: s.metaDescription,
    alternates: { canonical: path },
    openGraph: { title: s.metaTitle, description: s.metaDescription, url: `${SITE_URL}${path}`, type: "website", siteName: "Bidcore", locale: "en_IN" },
  };
}

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = getSolution(slug);
  if (!s) notFound();
  const others = SOLUTIONS.filter((o) => o.slug !== s.slug);

  return (
    <div className="bg-white">
      <SolutionHero
        eyebrow={s.custom ? s.custom.eyebrow : `Solutions for ${s.name}`}
        headline={s.headline}
        intro={s.intro}
        primary={s.custom ? { label: s.custom.cta.label, href: s.custom.cta.href } : undefined}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-brand-navy">{s.custom ? s.custom.itemsHeading : `How BidcoreAI helps ${s.name}`}</h2>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {s.items.map((item) => (
            <SolutionCard key={item.title} icon={CheckCircle2} title={item.title} body={item.body} link={item.link} />
          ))}
        </div>
        {s.note && <p className="mt-6 max-w-3xl text-sm text-slate-500">{s.note}</p>}
      </section>

      {s.custom && (
        <section className="border-t border-slate-200 bg-[#F6F7F9]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
            <h2 className="text-3xl font-bold tracking-tight text-brand-navy">Examples of custom solutions</h2>
            <p className="mt-2 max-w-2xl text-slate-600">A few of the things we can discuss. Yours does not have to match one of them.</p>
            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
              {s.custom.examples.map((ex, i) => {
                const Icon = EXAMPLE_ICONS[i % EXAMPLE_ICONS.length];
                return (
                  <div key={ex.title} className="flex flex-col rounded-lg border border-slate-200 bg-white p-6">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-navy text-orange-400">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-lg font-semibold text-brand-navy">{ex.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{ex.body}</p>
                    <Link href={s.custom!.cta.href} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:underline">
                      Discuss this <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-slate-200 bg-[#F6F7F9]">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-brand-navy">Also for</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {others.map((o) => (
              <Link key={o.slug} href={`/solutions/${o.slug}`} className="rounded-lg border border-slate-200 bg-white p-5 transition hover:border-brand-accent/40 hover:shadow-sm">
                <span className="block font-semibold text-brand-navy">{o.name}</span>
                <span className="mt-1 block text-sm text-slate-600">{o.summary}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <SolutionCta />
    </div>
  );
}
