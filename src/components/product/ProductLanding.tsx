import Link from "next/link";
import { ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";
import { BiddersBoardGraphic } from "@/components/graphics/TenderConnectGraphics";
import { ProcurementGraphic, ProjectGraphic, SiteGraphic, TenderManagementGraphic } from "@/components/graphics/ProductGraphics";
import type { Capability, Cta, FeatureStatus, ProductPage, Workflow } from "@/lib/product-pages";

// Shared landing page for every BidcoreAI product. Content lives in lib/product-pages.ts; the site header and footer come from the root layout.

export default function ProductLanding({ page }: { page: ProductPage }) {
  const hasPlanned = page.capabilities.some((c) => c.status === "planned");

  return (
    <div className="bg-white">
      <Hero page={page} />
      <ValueProps items={page.valueProps} />
      <Audiences items={page.audiences} />
      <Capabilities page={page} showLegend={hasPlanned} />
      <Workflows items={page.workflows} />
      <Benefits heading={page.benefitsHeading} items={page.benefits} />
      <Access access={page.access} />
      <Faq items={page.faqs} />
      <FinalCta cta={page.finalCta} />
    </div>
  );
}

// ── Buttons ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function CtaLink({ cta, variant }: { cta: Cta; variant: "solid" | "outline" | "dark" | "ghost-dark" }) {
  const styles = {
    solid: "bg-white text-brand-navy hover:bg-slate-200",
    outline: "border border-white/60 text-white hover:bg-white/10",
    dark: "bg-brand-accent text-white hover:bg-brand-accent-light",
    "ghost-dark": "border border-slate-300 text-brand-navy hover:border-slate-400",
  }[variant];
  const cls = `w-full justify-center sm:w-auto inline-flex items-center gap-2 rounded-sm px-5 py-3 text-sm font-semibold uppercase tracking-wider transition ${styles}`;
  const external = /^https?:\/\//.test(cta.href) || cta.href.startsWith("#");
  // Sign-up, sign-in and in-page anchors are full navigations / hash jumps; everything else is a client-side link.
  return external ? (
    <a href={cta.href} className={cls}>
      {cta.label}
    </a>
  ) : (
    <Link href={cta.href} className={cls}>
      {cta.label}
    </Link>
  );
}

// ── Sections ─────────────────────────────────────────────────────────────────────────────────────────────────────────

function Hero({ page }: { page: ProductPage }) {
  const { primary, secondary, tertiary } = page.ctas;
  return (
    <section className="relative overflow-hidden bg-brand-navy text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_40%,rgba(251,191,36,0.10),transparent_55%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:items-center lg:py-20">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- plain img, matching the header logo */}
            <img src="/images/bidcoreai-logo.png" alt="BidcoreAI" width={395} height={100} className="h-8 w-auto rounded-md" />
          </div>
          <h1 className="mt-4 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl">
            <span className="mb-3 block text-lg font-semibold tracking-normal text-amber-300 sm:text-xl">{page.name}</span>
            {page.headline}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-200">{page.intro}</p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <CtaLink cta={primary} variant="solid" />
            {secondary && <CtaLink cta={secondary} variant="outline" />}
            {tertiary && <CtaLink cta={tertiary} variant="outline" />}
          </div>
        </div>

        {page.screenshot ? (
          // eslint-disable-next-line @next/next/no-img-element -- plain img, matching the header logo (a real product screenshot supplied in lib/product-pages.ts)
          <img src={page.screenshot.src} alt={page.screenshot.alt} className="w-full rounded-lg border border-white/15 shadow-xl" />
        ) : page.visual === "tender-connect" ? (
          <BiddersBoardGraphic />
        ) : page.visual === "tender-management" ? (
          <TenderManagementGraphic />
        ) : page.visual === "project-management" ? (
          <ProjectGraphic />
        ) : page.visual === "procurement-management" ? (
          <ProcurementGraphic />
        ) : page.visual === "site-management" ? (
          <SiteGraphic />
        ) : (
          <div className="rounded-lg border border-white/15 bg-white/5 p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">At a glance</p>
            <ul className="mt-4 space-y-3 text-sm text-slate-100">
              {page.atAGlance.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

function ValueProps({ items }: { items: ProductPage["valueProps"] }) {
  return (
    <section className="border-b border-slate-200">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-3">
        {items.map((v) => (
          <div key={v.title}>
            <h2 className="text-lg font-semibold text-brand-navy">{v.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{v.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Audiences({ items }: { items: ProductPage["audiences"] }) {
  return (
    <section className="bg-[#F6F7F9]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-brand-navy">Who it is for</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {items.map((a) => (
            <div key={a.title} className="rounded-lg border border-slate-200 bg-white p-6">
              <h3 className="font-semibold text-brand-navy">{a.title}</h3>
              <ul className="mt-4 space-y-2.5 text-sm text-slate-700">
                {a.points.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Only features that are not built yet are marked; everything else carries no label.
function StatusChip({ status }: { status: FeatureStatus }) {
  if (status !== "planned") return null;
  return <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-300">Planned</span>;
}

function FeatureCard({ c }: { c: Capability }) {
  return (
    <div className={`rounded-lg border bg-white p-6 ${c.status === "planned" ? "border-dashed border-slate-300" : "border-slate-200"}`}>
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-navy text-amber-400">
          <c.icon className="h-5 w-5" />
        </span>
        <StatusChip status={c.status} />
      </div>
      <h3 className="mt-4 font-semibold text-brand-navy">{c.title}</h3>
      <p className="mt-1.5 text-sm font-medium text-slate-800">{c.problem}</p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{c.body}</p>
    </div>
  );
}

function Capabilities({ page, showLegend }: { page: ProductPage; showLegend: boolean }) {
  return (
    <section id="capabilities" className="scroll-mt-20">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-brand-navy">{page.capabilitiesHeading}</h2>
        {showLegend && (
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-600">
            <strong className="font-semibold text-slate-800">Planned</strong> features are not built yet and are not available.
          </p>
        )}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {page.capabilities.map((c) => (
            <FeatureCard key={c.title} c={c} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Workflows({ items }: { items: Workflow[] }) {
  return (
    <section className="border-t border-slate-200 bg-[#F6F7F9]">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-brand-navy">How it works</h2>
        <div className="mt-8 space-y-8">
          {items.map((w) => (
            <div key={w.audience}>
              <h3 className="font-semibold text-brand-navy">{w.audience}</h3>
              <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
                {w.steps.map((step, i) => (
                  <li key={step} className="relative rounded-lg border border-slate-200 bg-white p-4">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-navy text-xs font-bold text-white">{i + 1}</span>
                    <p className="mt-3 text-sm font-medium text-slate-800">{step}</p>
                  </li>
                ))}
              </ol>
              {w.note && <p className="mt-3 max-w-3xl text-sm text-slate-600">{w.note}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Benefits({ heading, items }: { heading: string; items: string[] }) {
  return (
    <section>
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <h2 className="max-w-2xl text-3xl font-bold tracking-tight text-brand-navy">{heading}</h2>
        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {items.map((b) => (
            <li key={b} className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              {b}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Access({ access }: { access: ProductPage["access"] }) {
  return (
    <section className="bg-brand-navy text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-400">Pricing and access</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{access.heading}</h2>
          <p className="mt-4 max-w-lg leading-relaxed text-slate-300">{access.body}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            {access.ctas.map((c, i) => (
              <CtaLink key={c.label} cta={c} variant={i === 0 ? "solid" : "outline"} />
            ))}
          </div>
        </div>
        <ul className="space-y-3 rounded-lg border border-white/15 bg-white/5 p-6 text-sm">
          {access.rows.map(([a, b]) => (
            <li key={a} className="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-0 last:pb-0">
              <span className="flex items-start gap-2 text-slate-100">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                {a}
              </span>
              <span className="shrink-0 text-right text-slate-400">{b}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Faq({ items }: { items: ProductPage["faqs"] }) {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <h2 className="text-3xl font-bold tracking-tight text-brand-navy">Frequently asked questions</h2>
      <div className="mt-8 divide-y divide-slate-200 border-y border-slate-200">
        {items.map((f) => (
          <details key={f.q} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
              {f.q}
              <span className="text-xl leading-none text-slate-400 transition group-open:rotate-45">+</span>
            </summary>
            <p className="mt-3 leading-relaxed text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

function FinalCta({ cta }: { cta: ProductPage["finalCta"] }) {
  return (
    <section className="border-t border-slate-200 bg-[#F6F7F9]">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-brand-navy">{cta.heading}</h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">{cta.body}</p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          {cta.ctas.map((c, i) => (
            <CtaLink key={c.label} cta={c} variant={i === 0 ? "dark" : "ghost-dark"} />
          ))}
        </div>
        <p className="mt-6 text-sm text-slate-500">
          Looking for the full product list?{" "}
          <Link href="/pricing" className="inline-flex items-center gap-1 font-medium text-brand-accent hover:underline">
            Compare products and pricing <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </p>
      </div>
    </section>
  );
}
