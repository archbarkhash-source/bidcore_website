import type { Metadata } from "next";
import Link from "next/link";
import TenderCard from "@/components/TenderCard";
import TenderFilters from "@/components/TenderFilters";
import { getTenders } from "@/lib/bidcore-api";
import { STATES } from "@/lib/data";
import { signUpHref } from "@/lib/app-links";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Find Construction Tenders on Bidcore",
  description:
    "Discover construction tenders, review project requirements, prepare quotations, and connect with opportunities through Bidcore Tender Connect.",
  alternates: { canonical: "/tenders" },
};

const CATEGORIES = [
  "Civil",
  "Roads & Highways",
  "Bridges",
  "Buildings",
  "Electrical",
  "Mechanical",
  "Plumbing & Sanitary",
  "HVAC",
  "Fire Fighting",
  "Interiors",
  "Landscaping",
  "Water Supply",
  "Other",
];

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function TendersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const f = {
    q: one(sp.q),
    keywords: one(sp.keywords),
    role: one(sp.role),
    state: one(sp.state),
    city: one(sp.city),
    organization: one(sp.organization),
    category: one(sp.category),
    value_min: one(sp.value_min),
    value_max: one(sp.value_max),
    closing_within_days: one(sp.closing_within_days),
    status: one(sp.status) ?? "open",
    sort: one(sp.sort) ?? (one(sp.keywords) ? "relevance" : "newest"),
    page: one(sp.page) ?? "1",
  };
  // `role` only shapes the filter panel; it is not a search filter
  const { role: _role, ...search } = f;
  void _role;
  const res = await getTenders({ ...search, page_size: "12" });
  const page = Number(f.page) || 1;
  const link = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...f, page: String(p) })) if (v) qs.set(k, v);
    return `/tenders?${qs}`;
  };

  return (
    <div>
      <section className="bg-[#F6F7F9]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-amber-600">Public Tenders</p>
          <h1 className="mt-1 text-3xl font-bold text-brand-navy sm:text-4xl">Find Construction Tenders on Bidcore</h1>
          <p className="mt-2 max-w-2xl text-slate-600">
            Discover construction tenders, review project requirements, prepare quotations, and connect with opportunities through Bidcore.
          </p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <TenderFilters
          values={{
            q: f.q,
            keywords: f.keywords,
            role: f.role,
            state: f.state,
            city: f.city,
            organization: f.organization,
            category: f.category,
            value_min: f.value_min,
            value_max: f.value_max,
            closing_within_days: f.closing_within_days,
            status: f.status,
            sort: f.sort,
          }}
          states={STATES.map((s) => s.name)}
          categories={CATEGORIES}
        />

        <div>
          {!res.ok ? (
            <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">
              Tenders are temporarily unavailable. Please try again in a few minutes.
            </p>
          ) : res.data.items.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
              <p className="font-medium text-slate-800">No tenders match these filters.</p>
              <p className="mt-1 text-sm text-slate-500">Try a different search, or reset the filters.</p>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-slate-500">
                {res.data.total} tender{res.data.total === 1 ? "" : "s"} · page {res.data.page} of {res.data.pages}
                {f.keywords ? ` · matching ${f.keywords.split(",").join(", ")}` : ""}
              </p>
              <div className="grid grid-cols-1 gap-4">
                {res.data.items.map((t) => (
                  <TenderCard key={t.id} tender={t} />
                ))}
              </div>
              {res.data.pages > 1 && (
                <nav className="mt-8 flex items-center justify-center gap-3 text-sm" aria-label="Pagination">
                  {page > 1 && (
                    <Link href={link(page - 1)} className="rounded-md border border-slate-300 px-4 py-2 hover:border-slate-400">
                      Previous
                    </Link>
                  )}
                  {page < res.data.pages && (
                    <Link href={link(page + 1)} className="rounded-md border border-slate-300 px-4 py-2 hover:border-slate-400">
                      Next
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}

          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-brand-navy">Prepare and submit quotations</h2>
              <p className="mt-1 text-sm text-slate-500">
                Browsing is free. Every plan starts with a 7-day free trial — no credit card required — then a monthly or yearly plan.
              </p>
              <Link
                href={signUpHref("tender-connect")}
                className="mt-4 inline-block rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-accent-light"
              >
                Submit Your First Quote Free
              </Link>
              <p className="mt-2 text-xs text-slate-500">No credit card required.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-brand-navy">Have a tender to publish?</h2>
              <p className="mt-1 text-sm text-slate-500">
                Publish it on Tender Connect and it appears here and in the Opportunities of every Tender Connect user.
              </p>
              <Link
                href={signUpHref("tender-connect", { intent: "publish" })}
                className="mt-4 inline-block rounded-full border border-brand-navy px-5 py-2.5 text-sm font-semibold text-brand-navy hover:bg-brand-navy hover:text-white"
              >
                Publish a tender
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
