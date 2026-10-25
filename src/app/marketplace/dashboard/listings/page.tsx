import type { Metadata } from "next";
import Link from "next/link";
import DashboardShell, { Notice } from "@/components/marketplace/DashboardNav";
import { outlineBtn, primaryBtn } from "@/components/marketplace/ui";
import { db } from "@/lib/db";
import { listingViews, loadDashboard } from "@/lib/marketplace/dashboard";
import { listingAction } from "@/lib/marketplace/actions";
import { FREE_LISTING_LIMIT, LISTING_STATUS_LABEL, MP } from "@/lib/marketplace/constants";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "My products and services | Bidcore marketplace", robots: { index: false, follow: false } };

type SP = Record<string, string | string[] | undefined>;

const TONE: Record<string, string> = {
  published: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  draft: "bg-slate-100 text-slate-600",
  rejected: "bg-red-50 text-red-700",
  archived: "bg-slate-100 text-slate-400",
};

function ActionButton({ id, action, label }: { id: string; action: string; label: string }) {
  return (
    <form action={listingAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="action" value={action} />
      <button className="text-sm text-slate-600 hover:text-brand-accent hover:underline">{label}</button>
    </form>
  );
}

export default async function ListingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { companies, company } = await loadDashboard(sp, `${MP}/dashboard/listings`);
  if (!company) redirect(`${MP}/dashboard`);
  const rows = await db.marketplaceListing.findMany({ where: { companyId: company.id }, orderBy: { updatedAt: "desc" }, include: { category: { select: { name: true } } } });
  const views = await listingViews(company.id);
  const viewsOf = (id: string) => views.get(id) ?? 0;
  const active = rows.filter((r) => r.status !== "archived").length;
  const q = `company=${company.id}`;

  return (
    <DashboardShell active="listings" company={company} companies={companies}>
      <Notice sp={sp} />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{active} of {FREE_LISTING_LIMIT} free listings in use.</p>
        <div className="flex gap-2">
          <Link href={`${MP}/dashboard/listings/new?${q}&kind=product`} className={primaryBtn}>Add a product</Link>
          <Link href={`${MP}/dashboard/listings/new?${q}&kind=service`} className={outlineBtn}>Add a service</Link>
        </div>
      </div>
      {company.marketplaceStatus !== "published" && rows.length > 0 && (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Your listings are only visible to the public once your company profile is published. <Link className="underline" href={`${MP}/dashboard?${q}`}>Check your profile status</Link>.
        </p>
      )}
      {rows.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No listings yet. Add your first product or service — a basic listing takes a few minutes.</p>
      ) : (
        <ul className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-900">{r.title}</span>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[r.status] ?? TONE.draft}`}>{LISTING_STATUS_LABEL[r.status] ?? r.status}</span>
                  <span className="rounded-full bg-slate-50 px-2 py-0.5 text-xs text-slate-500">{r.kind === "product" ? "Product" : "Service"}</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">
                  {r.category?.name ?? "No category"}{r.status === "published" ? ` · ${viewsOf(r.id)} views in 30 days` : ""}
                  {r.status === "published" && r.expiresAt ? ` · expires ${r.expiresAt.toLocaleDateString("en-GB")}` : ""}
                </p>
                {r.status === "rejected" && r.rejectionReason && <p className="mt-1 text-xs text-red-700">Reason: {r.rejectionReason}</p>}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                {r.status === "published" && <Link href={`${MP}/${r.kind === "product" ? "products" : "services"}/${r.slug}`} className="text-sm text-slate-600 hover:text-brand-accent hover:underline">View</Link>}
                <Link href={`${MP}/dashboard/listings/${r.id}?${q}&kind=${r.kind}`} className="text-sm font-medium text-brand-accent hover:underline">Edit</Link>
                {(r.status === "draft" || r.status === "rejected") && <ActionButton id={r.id} action="submit" label="Submit for review" />}
                {(r.status === "published" || r.status === "pending") && <ActionButton id={r.id} action="withdraw" label="Withdraw" />}
                {r.status === "published" && <ActionButton id={r.id} action="renew" label="Renew 12 months" />}
                {r.status === "archived" ? <ActionButton id={r.id} action="restore" label="Restore" /> : <ActionButton id={r.id} action="archive" label="Archive" />}
              </div>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}
