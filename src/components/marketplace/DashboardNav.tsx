import Link from "next/link";
import { MP } from "@/lib/marketplace/constants";
import { companyTitle } from "./ui";

const TABS = [
  { key: "", label: "Overview" },
  { key: "profile", label: "Company profile" },
  { key: "listings", label: "My products and services" },
  { key: "enquiries", label: "My enquiries" },
  { key: "settings", label: "Settings" },
] as const;

export default function DashboardShell({
  active,
  company,
  companies,
  title,
  children,
}: {
  active: (typeof TABS)[number]["key"];
  company: { id: string; name: string; displayName: string | null };
  companies: { id: string; name: string; displayName: string | null }[];
  title?: string;
  children: React.ReactNode;
}) {
  const q = `?company=${company.id}`;
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Marketplace dashboard</p>
          <h1 className="text-2xl font-bold text-slate-900">{title ?? companyTitle(company)}</h1>
        </div>
        {companies.length > 1 && (
          <form method="get" className="flex items-center gap-2 text-sm">
            <label htmlFor="company" className="text-slate-500">Company</label>
            <select id="company" name="company" defaultValue={company.id} className="rounded-md border border-slate-300 bg-white px-3 py-1.5">
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{companyTitle(c)}</option>
              ))}
            </select>
            <button className="rounded-md border border-slate-300 px-3 py-1.5 hover:border-slate-400">Switch</button>
          </form>
        )}
      </div>
      <nav className="mt-5 flex flex-wrap gap-1 border-b border-slate-200" aria-label="Dashboard sections">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`${MP}/dashboard${t.key ? `/${t.key}` : ""}${q}`}
            aria-current={t.key === active ? "page" : undefined}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${t.key === active ? "border-brand-navy text-brand-navy" : "border-transparent text-slate-500 hover:text-slate-800"}`}
          >
            {t.label}
          </Link>
        ))}
      </nav>
      <div className="mt-6">{children}</div>
    </div>
  );
}

export function Notice({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const v = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined));
  if (v("error")) return <p role="alert" className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{v("error")}</p>;
  if (v("saved") === "pending") return <p role="status" className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Saved and submitted for review. It goes live once approved.</p>;
  if (v("saved")) return <p role="status" className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Saved.</p>;
  if (v("submitted")) return <p role="status" className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Submitted for review. We will publish your profile once it is approved.</p>;
  if (v("welcome")) return <p role="status" className="mb-4 rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">Welcome. Complete the checklist below at your own pace — only the basics are needed to publish.</p>;
  return null;
}
