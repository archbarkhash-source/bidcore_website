import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2, FileSearch, Plug, Ruler, Sparkles, type LucideIcon } from "lucide-react";
import { SITE_URL } from "@/lib/bidcore-api";
import { SOLUTIONS, getSolution } from "@/lib/solutions";
import { signUpHref } from "@/lib/app-links";

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
      <section className="bg-brand-navy text-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400 sm:text-sm">{s.custom ? s.custom.eyebrow : `Solutions for ${s.name}`}</p>
          <h1 className="mt-4 max-w-3xl text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">{s.headline}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">{s.intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={s.custom ? s.custom.cta.href : "/request-demo"}
              className="inline-flex items-center gap-3 rounded-sm bg-orange-500 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-orange-400"
            >
              {s.custom ? s.custom.cta.label : "Request a Demo"} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/products" className="inline-flex items-center rounded-sm border border-white/60 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-white/10">
              Explore Products
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-brand-navy">{s.custom ? s.custom.itemsHeading : `How Bidcore helps ${s.name}`}</h2>
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {s.items.map((item) => (
            <div key={item.title} className="flex flex-col rounded-lg border border-slate-200 bg-white p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-navy text-orange-400">
                <CheckCircle2 className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-brand-navy">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{item.body}</p>
              <Link href={item.link.href} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:underline">
                {item.link.label} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
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

      <section className="bg-brand-navy text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center">
          <h2 className="max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">See how Bidcore fits the way you work</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/request-demo" className="rounded-sm bg-orange-500 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-orange-400">
              Request a Demo
            </Link>
            <a href={signUpHref("tender-connect")} className="rounded-sm border border-white/60 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white hover:bg-white/10">
              Start Free Trial
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
