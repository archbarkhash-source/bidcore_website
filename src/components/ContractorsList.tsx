import Link from "next/link";
import { Mail, MapPin, Phone, Search } from "lucide-react";
import { DIRECTORY_CITIES, DIRECTORY_TYPES } from "@/lib/directory-core";
import { listDirectory } from "@/lib/directory";
import { STATES } from "@/lib/data";

// The Bidcore contractor directory as a list: /contractors and the category pages (/contractors/epc-contractors, /contractors/mumbai ...). The Bidcore directory is built
// city by city (Mumbai first, then Delhi); the type names are the ones the directory stores. Cards carry the contact MASKED and blurred; the real values need a
// signed-in member. Read straight from this site's database.
const COMPANY_TYPES = DIRECTORY_TYPES;

export type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function ContractorsList({
  sp,
  basePath = "/contractors",
  preset = {},
  heading = "Contractors on Bidcore",
  intro = "EPC contractors, subcontractors and design-build contractors. Sign up free to view contact details.",
}: {
  sp: SP;
  basePath?: string;
  preset?: { type?: string; city?: string };
  heading?: string;
  intro?: string;
}) {
  const f = { q: one(sp.q), state: one(sp.state), city: one(sp.city) ?? preset.city, type: one(sp.type) ?? preset.type, page: one(sp.page) ?? "1", page_size: "24" };
  const page = Number(f.page) || 1;
  const res = await listDirectory({ q: f.q, city: f.city, state: f.state, type: f.type, page, page_size: 24 });
  const link = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries({ q: f.q, state: f.state, city: sp.city ? f.city : undefined, type: sp.type ? f.type : undefined, page: String(p) })) if (v) qs.set(k, v);
    return `${basePath}?${qs}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{heading}</h1>
          <p className="mt-1 text-sm text-slate-500">{intro}</p>
        </div>
        <Link href="/add-company" className="rounded-full bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
          + Add your company info
        </Link>
      </div>

      <form method="get" action="/contractors" className="mt-6 flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            defaultValue={f.q}
            placeholder="Search contractors"
            className="w-full rounded-md border border-slate-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-navy"
          />
        </div>
        <select name="state" defaultValue={f.state ?? ""} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="">All states</option>
          {STATES.map((s) => (
            <option key={s.slug} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
        <select name="city" defaultValue={f.city ?? ""} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="">All cities</option>
          {DIRECTORY_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select name="type" defaultValue={f.type ?? ""} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm">
          <option value="">All contractor types</option>
          {COMPANY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <button className="rounded-md bg-brand-navy px-4 py-2 text-sm font-semibold text-white hover:opacity-90">Search</button>
      </form>

      {!res.ok ? (
        <p className="mt-8 text-sm text-slate-600">
          Contractors are temporarily unavailable. Please try again in a few minutes. You can still{" "}
          <Link href="/add-company" className="font-medium text-brand-accent hover:underline">
            add your company info
          </Link>
          .
        </p>
      ) : res.data.items.length === 0 ? (
        <div className="mt-8 rounded-lg border border-slate-200 bg-white p-8 text-center">
          <p className="font-medium text-slate-800">No contractors to show yet.</p>
          <p className="mt-1 text-sm text-slate-500">Try a different search or filter, or add your own company.</p>
          <Link href="/add-company" className="mt-4 inline-block rounded-full bg-brand-accent px-5 py-2 text-sm font-semibold text-white hover:bg-brand-accent-light">
            Add your company info
          </Link>
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-slate-500">{res.data.total} contractor{res.data.total === 1 ? "" : "s"}</p>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {res.data.items.map((c) => (
              <Link key={c.slug} href={`/contractor/${c.slug}`} className="rounded-lg border border-slate-200 bg-white p-5 transition hover:border-brand-accent/40 hover:shadow-sm">
                <h2 className="font-semibold text-brand-navy">{c.name}</h2>
                {c.type && <p className="mt-0.5 text-sm text-slate-500">{c.type}</p>}
                {(c.city || c.state) && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-600">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    {[c.city, c.state].filter(Boolean).join(", ")}
                  </p>
                )}
                {c.trades.length > 0 && <p className="mt-2 line-clamp-1 text-xs text-slate-500">{c.trades.join(" · ")}</p>}
                {c.contact?.available && (
                  <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-600">
                    {c.contact.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-slate-400" />
                        <span aria-hidden className="select-none blur-[4px]">{c.contact.phone}</span>
                      </p>
                    )}
                    {c.contact.email && (
                      <p className="mt-1 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400" />
                        <span aria-hidden className="select-none blur-[4px]">{c.contact.email}</span>
                      </p>
                    )}
                    <p className="mt-2 font-medium text-brand-accent">Sign up free to view contact</p>
                  </div>
                )}
              </Link>
            ))}
          </div>
          {res.data.pages > 1 && (
            <nav className="mt-8 flex justify-center gap-3 text-sm" aria-label="Pagination">
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
    </div>
  );
}
