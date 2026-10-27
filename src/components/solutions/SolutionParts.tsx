import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { signUpHref } from "@/lib/app-links";

// Building blocks shared by the solution pages (/solutions and /solutions/<slug>), so the index looks exactly like the EPC Contractors page:
// the dark hero, the cards with a dark icon tile, and the closing call to action.

export function SolutionHero({
  eyebrow,
  headline,
  intro,
  primary = { label: "Request a Demo", href: "/request-demo" },
  secondary = { label: "Explore Products", href: "/products" },
}: {
  eyebrow: string;
  headline: string;
  intro: string;
  primary?: { label: string; href: string };
  secondary?: { label: string; href: string };
}) {
  return (
    <section className="bg-brand-navy text-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-400 sm:text-sm">{eyebrow}</p>
        <h1 className="mt-4 max-w-3xl text-balance text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">{headline}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-300">{intro}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={primary.href} className="w-full justify-center sm:w-auto inline-flex items-center gap-3 rounded-sm bg-orange-500 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-orange-400">
            {primary.label} <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href={secondary.href} className="w-full justify-center sm:w-auto inline-flex items-center rounded-sm border border-white/60 px-5 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-white/10">
            {secondary.label}
          </Link>
        </div>
      </div>
    </section>
  );
}

/** A card with a dark icon tile, a title, a short text and a link, as on the EPC Contractors page. */
export function SolutionCard({ icon: Icon, title, body, link }: { icon: LucideIcon; title: string; body: string; link: { href: string; label: string } }) {
  return (
    <div className="flex flex-col rounded-lg border border-slate-200 bg-white p-6">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-navy text-orange-400">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-4 font-semibold text-brand-navy">{title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{body}</p>
      <Link href={link.href} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:underline">
        {link.label} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}

/** The dark closing band: Request a Demo, and the one free trial (Tender Connect). */
export function SolutionCta() {
  return (
    <section className="bg-brand-navy text-white">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-12 sm:px-6 md:flex-row md:items-center">
        <h2 className="max-w-xl text-2xl font-bold tracking-tight sm:text-3xl">See how BidcoreAI fits the way you work</h2>
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
  );
}
