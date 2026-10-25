import type { Metadata } from "next";
import { redirect } from "next/navigation";
import DashboardShell, { Notice } from "@/components/marketplace/DashboardNav";
import { primaryBtn } from "@/components/marketplace/ui";
import { loadDashboard } from "@/lib/marketplace/dashboard";
import { saveSettings, withdrawFromMarketplace } from "@/lib/marketplace/actions";
import { MP } from "@/lib/marketplace/constants";

export const metadata: Metadata = { title: "Settings | Bidcore marketplace", robots: { index: false, follow: false } };

type SP = Record<string, string | string[] | undefined>;

export default async function SettingsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { user, companies, company } = await loadDashboard(sp, `${MP}/dashboard/settings`);
  if (!company) redirect(`${MP}/dashboard`);

  return (
    <DashboardShell active="settings" company={company} companies={companies}>
      <Notice sp={sp} />
      <div className="max-w-2xl space-y-8">
        <section>
          <h2 className="text-lg font-semibold text-slate-900">Account</h2>
          <p className="mt-1 text-sm text-slate-600">Signed in as <span className="font-medium">{user.name}</span> ({user.email}). Enquiry notifications are sent to this address. This is the only person who can manage the company today; adding colleagues is not supported yet.</p>
        </section>

        <form action={saveSettings} className="space-y-4">
          <input type="hidden" name="companyId" value={company.id} />
          <h2 className="text-lg font-semibold text-slate-900">Notifications and visibility</h2>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" name="notifyEnquiries" defaultChecked={company.notifyEnquiries} className="mt-1" />
            <span>Email me when a new enquiry arrives. (Enquiries are always saved in your dashboard.)</span>
          </label>
          <label className="flex items-start gap-2 text-sm text-slate-700">
            <input type="checkbox" name="contactPublic" defaultChecked={company.contactPublic} className="mt-1" />
            <span>Show my phone, email and address to everyone. Otherwise only signed-in Bidcore members see them.</span>
          </label>
          <button className={primaryBtn}>Save settings</button>
        </form>

        {(company.marketplaceStatus === "published" || company.marketplaceStatus === "pending") && (
          <form action={withdrawFromMarketplace} className="border-t border-slate-200 pt-6">
            <input type="hidden" name="companyId" value={company.id} />
            <h2 className="text-lg font-semibold text-slate-900">Remove from the marketplace</h2>
            <p className="mt-1 text-sm text-slate-600">Hides your profile and all your listings from the public. You can submit again later. Your data is kept.</p>
            <button className="mt-3 rounded-full border border-red-300 px-5 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Withdraw from marketplace</button>
          </form>
        )}
      </div>
    </DashboardShell>
  );
}
