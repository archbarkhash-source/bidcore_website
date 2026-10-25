import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import DashboardShell, { Notice } from "@/components/marketplace/DashboardNav";
import { inputClass, primaryBtn } from "@/components/marketplace/ui";
import { db } from "@/lib/db";
import { loadDashboard } from "@/lib/marketplace/dashboard";
import { respondToEnquiry, updateEnquiryStatus } from "@/lib/marketplace/actions";
import { ENQUIRY_STATUSES, MP, enquiryStatusLabel } from "@/lib/marketplace/constants";

export const metadata: Metadata = { title: "Enquiry | Bidcore marketplace", robots: { index: false, follow: false } };

type SP = Record<string, string | string[] | undefined>;

export default async function EnquiryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { companies, company } = await loadDashboard(sp, `${MP}/dashboard/enquiries`);
  if (!company) redirect(`${MP}/dashboard`);
  // Scoped to the managed company and never a held (flagged) enquiry: a supplier cannot read anyone else's leads.
  const e = await db.marketplaceEnquiry.findFirst({ where: { id, companyId: company.id, flagged: false }, include: { listing: { select: { title: true, slug: true, kind: true } }, events: { orderBy: { createdAt: "asc" } } } });
  if (!e) notFound();
  const when = (d: Date) => d.toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const details: [string, string | null][] = [
    ["Name", e.buyerName], ["Company", e.buyerCompany], ["Email", e.buyerEmail], ["Phone", e.buyerPhone], ["Quantity", e.quantity], ["Project type", e.projectType], ["Location", e.location], ["Timeline", e.timeline],
  ];

  return (
    <DashboardShell active="enquiries" company={company} companies={companies} title={`Enquiry ${e.ref}`}>
      <Notice sp={sp} />
      <p className="mb-4 text-sm"><Link href={`${MP}/dashboard/enquiries?company=${company.id}`} className="text-slate-500 hover:text-slate-800">← All enquiries</Link></p>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">About: <span className="text-slate-800">{e.listing?.title ?? "General enquiry"}</span></p>
            <p className="mt-3 whitespace-pre-line text-slate-800">{e.message}</p>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-t border-slate-100 pt-4 text-sm">
              {details.filter(([, v]) => v).map(([k, v]) => (
                <div key={k}><dt className="text-xs uppercase tracking-wide text-slate-400">{k}</dt><dd className="break-words text-slate-800">{v}</dd></div>
              ))}
            </dl>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">Reply to the buyer</h2>
            <form action={respondToEnquiry} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={e.id} />
              <textarea name="body" required minLength={5} maxLength={3000} rows={5} className={inputClass} aria-label="Reply" />
              <button className={primaryBtn}>Send reply</button>
              <p className="text-xs text-slate-500">Your reply is emailed to {e.buyerEmail}. They can reply to you directly using your account email.</p>
            </form>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">Status</h2>
            <form action={updateEnquiryStatus} className="mt-2 flex gap-2">
              <input type="hidden" name="id" value={e.id} />
              <select name="status" defaultValue={e.status} className={inputClass} aria-label="Status">
                {ENQUIRY_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <button className="rounded-md border border-slate-300 px-3 text-sm font-medium hover:border-slate-400">Update</button>
            </form>
          </section>
          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-semibold text-slate-900">Activity</h2>
            <ol className="mt-3 space-y-3 text-sm">
              {e.events.map((ev) => (
                <li key={ev.id}>
                  <p className="text-xs text-slate-400">{when(ev.createdAt)}</p>
                  <p className="text-slate-700">
                    {ev.type === "created" && "Enquiry received"}
                    {ev.type === "status" && `Status set to ${enquiryStatusLabel(ev.body ?? "")}`}
                    {ev.type === "response" && <>You replied:<span className="mt-0.5 block whitespace-pre-line text-slate-600">{ev.body}</span></>}
                    {ev.type === "moderation" && (ev.body ?? "Reviewed by Bidcore")}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </aside>
      </div>
    </DashboardShell>
  );
}
