import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/marketplace/DashboardNav";
import { db } from "@/lib/db";
import { first, loadDashboard } from "@/lib/marketplace/dashboard";
import { ENQUIRY_STATUSES, MP, enquiryStatusLabel } from "@/lib/marketplace/constants";

export const metadata: Metadata = { title: "My enquiries | Bidcore marketplace", robots: { index: false, follow: false } };

type SP = Record<string, string | string[] | undefined>;

export default async function EnquiriesPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { companies, company } = await loadDashboard(sp, `${MP}/dashboard/enquiries`);
  if (!company) redirect(`${MP}/dashboard`);
  const status = first(sp.status);
  // Held (flagged) enquiries are not shown to the supplier until an admin releases them.
  const rows = await db.marketplaceEnquiry.findMany({
    where: { companyId: company.id, flagged: false, status: status && status !== "all" ? status : { not: "spam" } },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { listing: { select: { title: true } } },
  });

  return (
    <DashboardShell active="enquiries" company={company} companies={companies}>
      <div className="flex flex-wrap gap-2 text-sm">
        {[{ value: "all", label: "All" }, ...ENQUIRY_STATUSES].map((s) => (
          <Link key={s.value} href={`${MP}/dashboard/enquiries?company=${company.id}&status=${s.value}`} className={`rounded-full border px-3 py-1 ${(status || "all") === s.value ? "border-brand-navy bg-brand-navy text-white" : "border-slate-300 text-slate-600 hover:border-slate-400"}`}>
            {s.label}
          </Link>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No enquiries here yet. They appear when buyers contact you from your profile or listings.</p>
      ) : (
        <ul className="mt-5 divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
          {rows.map((e) => (
            <li key={e.id}>
              <Link href={`${MP}/dashboard/enquiries/${e.id}?company=${company.id}`} className="flex flex-col gap-1 p-4 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900">{e.buyerName}{e.buyerCompany ? `, ${e.buyerCompany}` : ""}</p>
                  <p className="truncate text-sm text-slate-500">{e.listing?.title ?? "General enquiry"} — {e.message}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3 text-xs text-slate-500">
                  <span className={`rounded-full px-2.5 py-0.5 font-medium ${e.status === "new" ? "bg-amber-50 text-amber-700" : "bg-slate-100 text-slate-600"}`}>{enquiryStatusLabel(e.status)}</span>
                  <time dateTime={e.createdAt.toISOString()}>{e.createdAt.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}</time>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardShell>
  );
}
