import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ExternalLink, FileText } from "lucide-react";
import { StatusBadge } from "@/components/TenderCard";
import ShareTender from "@/components/ShareTender";
import { SITE_URL, formatDate, formatValue, type TenderBidForm } from "@/lib/bidcore-api";
import { getTender } from "@/lib/site-tenders";
import { appLoginUrl, signUpHref } from "@/lib/app-links";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const res = await getTender(slug);
  if (!res.ok) return { title: "Tender not found", robots: { index: false, follow: false } };
  const t = res.data;
  const where = t.location ? ` in ${t.location}` : "";
  const description = (t.summary ?? `${t.title}${where}`).replace(/\s+/g, " ").slice(0, 200);
  const url = `/tenders/${t.canonical_slug}`;
  return {
    title: `${t.title}${where} | Tender ${t.reference_no ?? ""}`.trim(),
    description,
    alternates: { canonical: url },
    openGraph: { title: t.title, description, url: `${SITE_URL}${url}`, type: "article" },
    robots: { index: true, follow: true },
  };
}

export default async function TenderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await getTender(slug);
  if (!res.ok) notFound(); // withdrawn, draft, private and unknown tenders all look the same
  const t = res.data;
  if (t.canonical_slug !== slug) permanentRedirect(`/tenders/${t.canonical_slug}`);
  const value = formatValue(t.value_inr);
  const next = `/tenders/${t.canonical_slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t.title,
    description: t.summary ?? undefined,
    datePublished: t.published_at ?? undefined,
    dateModified: t.amended_at ?? t.published_at ?? undefined,
    url: `${SITE_URL}${next}`,
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
        <Link href="/tenders" className="hover:text-brand-accent">
          Public Tenders
        </Link>{" "}
        / <span>{t.reference_no ?? t.title}</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <h1 className="max-w-3xl text-2xl font-bold leading-snug text-brand-navy sm:text-3xl">{t.title}</h1>
        <div className="flex items-center gap-3">
          <StatusBadge tender={t} />
          <ShareTender url={`${SITE_URL}${next}`} title={t.title} />
        </div>
      </div>
      {t.amendment_count > 0 && (
        <p className="mt-2 inline-block rounded-md bg-amber-50 px-3 py-1 text-sm text-amber-800">
          Amended {t.amendment_count} time{t.amendment_count === 1 ? "" : "s"}
          {t.amended_at ? `, last on ${formatDate(t.amended_at)}` : ""}. Check the latest details before you quote.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <ScopeSection summary={t.summary} next={next} />

          {t.eligibility && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900">Eligibility requirements</h2>
              <p className="mt-2 whitespace-pre-line text-slate-600">{t.eligibility}</p>
            </section>
          )}

          {t.bid_form && <BidFormSection form={t.bid_form} next={next} />}

          <section id="documents" className="scroll-mt-24">
            <h2 className="text-lg font-semibold text-slate-900">Tender documents</h2>
            {t.documents && t.documents.length > 0 ? (
              <>
                <ul className="mt-3 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
                  {t.documents.map((d) => (
                    <li key={d.id} className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700">
                      <FileText className="h-4 w-4 text-slate-400" />
                      <span className="flex-1">{d.name}</span>
                      {d.type && <span className="text-xs text-slate-400">{d.type}</span>}
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-sm text-slate-500">
                  <Link href={signUpHref("tender-connect", { next, intent: "documents" })} className="font-medium text-brand-accent hover:underline">
                    Sign up to Tender Connect
                  </Link>{" "}
                  to download tender documents.
                </p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-500">
                The publisher has not made documents public. Sign in to Tender Connect to review what is available to bidders.
              </p>
            )}
            {t.required_documents && t.required_documents.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-slate-800">Documents your quotation must include</h3>
                <ul className="mt-1 list-disc pl-5 text-sm text-slate-600">
                  {t.required_documents.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <dl className="space-y-3 text-sm">
              <Fact label="Issued by" value={t.organization} />
              <Fact label="Reference" value={t.reference_no} />
              <Fact label="Location" value={t.location} />
              <Fact label="Work category" value={t.category} />
              <Fact label="Estimated value" value={value} />
              <Fact label="Published" value={formatDate(t.published_at)} />
              <Fact label="Clarifications by" value={t.clarification_deadline ? formatDate(t.clarification_deadline) : null} />
              <Fact label="Site visit" value={t.site_visit_date ? formatDate(t.site_visit_date) : null} />
              <Fact label="Quotation deadline" value={formatDate(t.closing_date)} strong />
            </dl>
          </div>

          {t.status === "open" ? (
            <div className="space-y-2.5 rounded-lg border border-slate-200 bg-white p-5">
              <p className="text-sm font-medium text-slate-800">
                Sign up to BidcoreAI Tender Connect to submit the quote
              </p>
              <p className="text-sm text-slate-500">
                Review eligibility, prepare your pricing and submit. Your 30-day free trial covers quotations, with no
                credit card required.
              </p>
              <Link
                href={signUpHref("tender-connect", { next, intent: "quote" })}
                className="block rounded-full bg-brand-accent px-5 py-2.5 text-center text-sm font-semibold text-white hover:bg-brand-accent-light"
              >
                Sign Up to Submit a Quote
              </Link>
              {t.documents && t.documents.length > 0 && (
                <a href="#documents" className="block text-center text-sm text-slate-600 hover:text-brand-accent">
                  View tender documents
                </a>
              )}
              {t.submission_mode === "external" && t.official_url && (
                <a
                  href={t.official_url}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="flex items-center justify-center gap-1.5 text-sm text-slate-600 hover:text-brand-accent"
                >
                  Open the official tender portal <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
              <p className="pt-1 text-xs text-slate-500">
                {t.submission_mode === "external"
                  ? "This tender is submitted outside BidcoreAI. BidcoreAI helps you prepare the quotation; you submit it the way the publisher asks."
                  : "Submit your quotation through BidcoreAI Tender Connect."}
              </p>
              <div className="border-t border-slate-100 pt-3 text-center text-sm text-slate-500">
                Already a Tender Connect member?{" "}
                <a href={appLoginUrl(`/tenders/${t.canonical_slug}?action=quote`)} className="font-medium text-brand-accent hover:underline">
                  Sign in to prepare your quotation
                </a>
              </div>
            </div>
          ) : (
            <p className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
              This tender is closed to new quotations.{" "}
              <Link href="/tenders" className="font-medium text-brand-accent hover:underline">
                Browse open tenders
              </Link>
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}

function ScopeSection({ summary, next }: { summary: string | null; next: string }) {
  const text = summary ?? "";
  // Show roughly the first half of the scope; a short scope is shown in full
  // rather than cut down to an awkward fragment.
  const gated = text.length > 240;
  const preview = gated ? text.slice(0, Math.ceil(text.length / 2)).replace(/\s+\S*$/, "") + "…" : text;

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">Scope of work</h2>
      <p className="mt-2 whitespace-pre-line text-slate-600">{preview}</p>
      {gated && (
        <p className="mt-2 text-sm text-slate-500">
          <Link href={signUpHref("tender-connect", { next, intent: "view" })} className="font-medium text-brand-accent hover:underline">
            Sign up to Tender Connect
          </Link>{" "}
          to view the complete scope of work.
        </p>
      )}
    </section>
  );
}

function BidFormSection({ form, next }: { form: TenderBidForm; next: string }) {
  const parts = [
    form.base_bid ? "a priced base bid" : "a lump-sum amount",
    form.line_items.length > 0 && `${form.line_items.length} priced line item${form.line_items.length === 1 ? "" : "s"}`,
    form.alternates.length > 0 && `${form.alternates.length} alternate${form.alternates.length === 1 ? "" : "s"}`,
    form.questions.length > 0 && `${form.questions.length} question${form.questions.length === 1 ? "" : "s"}`,
  ].filter(Boolean);

  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900">Quotation form</h2>
      <p className="mt-2 text-slate-600">
        This tender has a quotation form attached: bidders submit {parts.join(", ")}.
      </p>
      <Link
        href={signUpHref("tender-connect", { next, intent: "quote" })}
        className="mt-3 inline-block rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-accent-light"
      >
        Sign Up to BidcoreAI Tender Connect to Submit a Quote
      </Link>
    </section>
  );
}

function Fact({ label, value, strong }: { label: string; value?: string | null; strong?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`text-right ${strong ? "font-semibold text-slate-900" : "text-slate-700"}`}>{value}</dd>
    </div>
  );
}
