import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { SITE_URL } from "@/lib/bidcore-api";
import JsonLd, { breadcrumbLd } from "@/components/JsonLd";
import { SolutionCta, SolutionHero } from "@/components/solutions/SolutionParts";
import { GUIDE_PAGES, getGuidePage } from "@/lib/guide-pages";

// One statically generated guide per search topic: /software/construction-bidding-software, /tender-management-software, /construction-estimation-software ... and the comparison.
// (/software itself is the download page and is not indexed.)
export const dynamicParams = false;

export function generateStaticParams() {
  return GUIDE_PAGES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const g = getGuidePage(slug);
  if (!g) return {};
  const path = `/software/${g.slug}`;
  return {
    title: g.metaTitle,
    description: g.metaDescription,
    alternates: { canonical: path },
    openGraph: { title: g.metaTitle, description: g.metaDescription, url: `${SITE_URL}${path}`, type: "article", siteName: "Bidcore", locale: "en_IN" },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = getGuidePage(slug);
  if (!g) notFound();
  const path = `/software/${g.slug}`;

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: g.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  const others = GUIDE_PAGES.filter((o) => o.slug !== g.slug);

  return (
    <div className="bg-white">
      <JsonLd data={[breadcrumbLd(SITE_URL, [{ name: "Home", path: "/" }, { name: "Software guides", path: "/products" }, { name: g.h1, path }]), faqLd]} />
      <SolutionHero eyebrow={g.eyebrow} headline={g.h1} intro={g.lead} />

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {g.highlights.map((h) => (
            <li key={h} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-brand-navy">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-accent" />
              {h}
            </li>
          ))}
        </ul>
      </section>

      {g.table && (
        <section className="mx-auto max-w-7xl px-4 pb-6 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">{g.table.heading}</h2>
          <div className="mt-6 overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[720px] border-collapse text-left text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {g.table.cols.map((c, i) => (
                    <th key={c + i} scope="col" className={`px-4 py-3 font-bold text-brand-navy ${i === 1 ? "bg-orange-50" : ""}`}>
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {g.table.rows.map((r) => (
                  <tr key={r[0]} className="border-t border-slate-200 align-top">
                    {r.map((cell, i) => (
                      <td key={i} className={`px-4 py-3 ${i === 0 ? "font-semibold text-brand-navy" : "text-slate-700"} ${i === 1 ? "bg-orange-50/50" : ""}`}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 max-w-4xl text-xs leading-relaxed text-slate-500">{g.table.note}</p>
        </section>
      )}

      {g.sections.map((s, i) => (
        <section key={s.h2} className={i % 2 === 0 ? "" : "border-y border-slate-200 bg-[#F6F7F9]"}>
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">{s.h2}</h2>
            {s.paras?.map((p) => (
              <p key={p} className="mt-4 text-base leading-relaxed text-slate-700">
                {p}
              </p>
            ))}
            {s.bullets && (
              <ul className="mt-5 space-y-3">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-3 text-base leading-relaxed text-slate-700">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-brand-accent" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      ))}

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <h2 className="text-2xl font-bold tracking-tight text-brand-navy sm:text-3xl">Frequently asked questions</h2>
        <div className="mt-6 divide-y divide-slate-200 rounded-lg border border-slate-200">
          {g.faqs.map((f) => (
            <details key={f.q} className="group p-5">
              <summary className="cursor-pointer list-none font-semibold text-brand-navy">{f.q}</summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-[#F6F7F9]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <h2 className="text-xl font-bold tracking-tight text-brand-navy">Related</h2>
          <ul className="mt-4 flex flex-wrap gap-3">
            {g.related.map((r) => (
              <li key={r.href}>
                <Link href={r.href} className="inline-flex items-center gap-1.5 rounded-sm border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-brand-navy hover:border-brand-accent hover:text-brand-accent">
                  {r.label} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            ))}
          </ul>
          <h2 className="mt-10 text-xl font-bold tracking-tight text-brand-navy">More guides</h2>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {others.map((o) => (
              <li key={o.slug}>
                <Link href={`/software/${o.slug}`} className="text-sm text-slate-700 hover:text-brand-accent hover:underline">
                  {o.h1}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <SolutionCta />
    </div>
  );
}
