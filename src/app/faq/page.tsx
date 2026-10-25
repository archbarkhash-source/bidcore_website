import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { FAQ } from "@/lib/faq";
import { SITE_URL } from "@/lib/bidcore-api";

export const metadata: Metadata = {
  title: "FAQ | Bidcore",
  description: "Answers about Bidcore: public and private tenders, bidding on government tenders, running projects, the Marketplace, finding suppliers and subcontractors, the free trial, and demos.",
  alternates: { canonical: "/faq" },
  openGraph: { title: "FAQ | Bidcore", url: `${SITE_URL}/faq`, type: "website", siteName: "Bidcore", locale: "en_IN" },
};

export default function FaqPage() {
  // Built from the same FAQ data that is shown below, so the markup always matches the visible text.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-600">FAQ</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-brand-navy sm:text-4xl">Frequently asked questions</h1>
      <p className="mt-3 text-slate-600">
        How Bidcore helps with public and private tenders, with preparing your own bids, with running projects, and with finding the right companies. Something missing?{" "}
        <Link href="/request-demo" className="font-medium text-brand-accent hover:underline">
          Ask us in a demo request
        </Link>
        .
      </p>

      <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
        {FAQ.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="text-xl leading-none text-slate-400 transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 leading-relaxed text-slate-600">{f.a}</p>
            {f.link && (
              <Link href={f.link.href} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:underline">
                {f.link.label} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </details>
        ))}
      </div>
    </div>
  );
}
