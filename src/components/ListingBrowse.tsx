import Link from "next/link";
import { Briefcase, MapPin, Wrench } from "lucide-react";
import { db } from "@/lib/db";
import { STATES } from "@/lib/data";
import { KIND_META, type ListingKind } from "@/lib/listings";

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
const PAGE = 18;

// Explore > Professionals / Equipment: a left filter panel and the listings. No contact details here - those are on the profile, for signed-in members.
export default async function ListingBrowse({ kind, searchParams }: { kind: ListingKind; searchParams: SP }) {
  const meta = KIND_META[kind];
  const q = one(searchParams.q);
  const role = one(searchParams.role);
  const state = one(searchParams.state);
  const city = one(searchParams.city);
  const page = Math.max(1, Number(one(searchParams.page)) || 1);

  const where = {
    kind,
    listed: true,
    ...(role ? { role } : {}),
    ...(state ? { state } : {}),
    ...(city ? { city: { contains: city, mode: "insensitive" as const } } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { headline: { contains: q, mode: "insensitive" as const } },
            { about: { contains: q, mode: "insensitive" as const } },
            { equipmentDetails: { contains: q, mode: "insensitive" as const } },
            { skills: { has: q } },
          ],
        }
      : {}),
  };

  let rows: Awaited<ReturnType<typeof db.memberListing.findMany>> = [];
  let total = 0;
  let failed = false;
  try {
    [rows, total] = await Promise.all([
      db.memberListing.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * PAGE, take: PAGE }),
      db.memberListing.count({ where }),
    ]);
  } catch {
    failed = true;
  }
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const link = (p: number) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, role, state, city, page: String(p) })) if (v) qs.set(k, v);
    return `${meta.path}?${qs}`;
  };
  const Icon = kind === "equipment" ? Wrench : Briefcase;
  const field = "mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-brand-navy";
  const label = "block text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <div>
      <section className="bg-[#F6F7F9]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-4 px-4 py-10 sm:px-6">
          <div>
            <h1 className="text-3xl font-bold text-brand-navy sm:text-4xl">{meta.plural} on Bidcore</h1>
            <p className="mt-2 max-w-2xl text-slate-600">{meta.blurb}</p>
          </div>
          <Link href={`/add-listing?kind=${kind}`} className="rounded-full bg-brand-navy px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90">
            + Add your {kind === "equipment" ? "equipment" : "profile"}
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <form method="get" action={meta.path} className="space-y-5 rounded-lg border border-slate-200 bg-white p-4">
            <label className={label}>
              Search
              <input name="q" defaultValue={q} placeholder={kind === "equipment" ? "Name, make, model…" : "Name, skill or headline…"} className={field} />
            </label>
            <label className={label}>
              {meta.roleLabel}
              <select name="role" defaultValue={role ?? ""} className={field}>
                <option value="">Any</option>
                {meta.roles.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label className={label}>
              State
              <select name="state" defaultValue={state ?? ""} className={field}>
                <option value="">Any</option>
                {STATES.map((s) => (
                  <option key={s.slug}>{s.name}</option>
                ))}
              </select>
            </label>
            <label className={label}>
              City
              <input name="city" defaultValue={city} className={field} />
            </label>
            <div className="flex items-center gap-3">
              <button className="flex-1 rounded-md bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">Apply filters</button>
              <Link href={meta.path} className="text-sm text-slate-500 hover:text-brand-accent">
                Reset
              </Link>
            </div>
          </form>
        </aside>

        <div>
          {failed ? (
            <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-600">Listings are temporarily unavailable. Please try again in a few minutes.</p>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
              <p className="font-medium text-slate-800">No {meta.plural.toLowerCase()} match these filters yet.</p>
              <p className="mt-1 text-sm text-slate-500">Be the first to list {kind === "equipment" ? "your equipment" : "yourself"} — it is free.</p>
              <Link href={`/add-listing?kind=${kind}`} className="mt-4 inline-block rounded-full bg-brand-accent px-5 py-2 text-sm font-semibold text-white hover:bg-brand-accent-light">
                Add your {kind === "equipment" ? "equipment" : "profile"}
              </Link>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-slate-500">
                {total} listing{total === 1 ? "" : "s"} · page {page} of {pages}
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {rows.map((r) => (
                  <Link key={r.id} href={`${meta.path}/${r.slug}`} className="rounded-lg border border-slate-200 bg-white p-5 transition hover:border-brand-accent/40 hover:shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="font-semibold text-brand-navy">{r.name}</h2>
                      {r.availability && (
                        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${r.availability === "Not available" ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>
                          {r.availability}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                      <Icon className="h-3.5 w-3.5 text-slate-400" /> {r.role}
                      {r.experienceYears != null && <span className="text-slate-400">· {r.experienceYears} yr</span>}
                    </p>
                    {(r.city || r.state) && (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" /> {[r.city, r.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {(r.headline || r.equipmentDetails) && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{r.headline || r.equipmentDetails}</p>}
                    {r.skills.length > 0 && <p className="mt-2 line-clamp-1 text-xs text-slate-500">{r.skills.join(" · ")}</p>}
                  </Link>
                ))}
              </div>
              {pages > 1 && (
                <nav className="mt-8 flex justify-center gap-3 text-sm" aria-label="Pagination">
                  {page > 1 && (
                    <Link href={link(page - 1)} className="rounded-md border border-slate-300 px-4 py-2 hover:border-slate-400">
                      Previous
                    </Link>
                  )}
                  {page < pages && (
                    <Link href={link(page + 1)} className="rounded-md border border-slate-300 px-4 py-2 hover:border-slate-400">
                      Next
                    </Link>
                  )}
                </nav>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
