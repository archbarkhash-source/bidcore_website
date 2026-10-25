import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import DashboardShell, { Notice } from "@/components/marketplace/DashboardNav";
import ListingForm, { type CategoryOption } from "@/components/marketplace/ListingForm";
import { db } from "@/lib/db";
import { loadDashboard } from "@/lib/marketplace/dashboard";
import { flattenCategories, getCategoryTree } from "@/lib/marketplace/queries";
import { MP } from "@/lib/marketplace/constants";

export const metadata: Metadata = { title: "Edit listing | Bidcore marketplace", robots: { index: false, follow: false } };

type SP = Record<string, string | string[] | undefined>;

export default async function ListingEditor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<SP> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { companies, company } = await loadDashboard(sp, `${MP}/dashboard/listings`);
  if (!company) redirect(`${MP}/dashboard`);

  const existing = id === "new" ? null : await db.marketplaceListing.findFirst({ where: { id, companyId: company.id } });
  if (id !== "new" && !existing) notFound();
  const kind: "product" | "service" = existing ? (existing.kind as "product" | "service") : sp.kind === "service" ? "service" : "product";

  const tree = await getCategoryTree();
  const categories: CategoryOption[] = flattenCategories(tree)
    .filter((c) => !c.builtin) // only categories that exist in the database can be assigned
    .map((c) => ({ id: c.id, label: c.parentId ? `— ${c.name}` : c.name, kind: c.kind, attributes: c.attributes }));

  return (
    <DashboardShell active="listings" company={company} companies={companies} title={existing ? "Edit listing" : kind === "product" ? "Add a product" : "Add a service"}>
      <Notice sp={sp} />
      {categories.length === 0 && (
        <p className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">Categories have not been set up yet, so you can save a draft but not submit it. A Bidcore admin needs to add the default categories.</p>
      )}
      {existing?.status === "published" && <p className="mb-4 text-sm text-slate-500">This listing is live. Changes you save go live immediately and are recorded in the audit log.</p>}
      <ListingForm
        companyId={company.id}
        kind={kind}
        categories={categories}
        values={
          existing
            ? {
                ...existing,
                specs: (existing.specs ?? {}) as Record<string, string>,
                documents: (Array.isArray(existing.documents) ? existing.documents : []) as { name: string; url: string }[],
              }
            : {}
        }
      />
      <p className="mt-6 text-sm"><Link href={`${MP}/dashboard/listings?company=${company.id}`} className="text-slate-500 hover:text-slate-800">Back to my listings</Link></p>
    </DashboardShell>
  );
}
