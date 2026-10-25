import Link from "next/link";
import { notFound } from "next/navigation";
import { Lock, Mail, MapPin, Phone } from "lucide-react";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { KIND_META, type ListingKind } from "@/lib/listings";

// One listing. The contact details (phone / email) are shown ONLY to a signed-in member (verified business e-mail); everyone else sees the profile and is asked
// to sign in - so the directory cannot be scraped for numbers.
export default async function ListingProfile({ kind, slug }: { kind: ListingKind; slug: string }) {
  const meta = KIND_META[kind];
  const row = await db.memberListing.findUnique({ where: { slug } }).catch(() => null);
  if (!row || row.kind !== kind || !row.listed) notFound();
  const me = await getCurrentUser();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate-500">
        <Link href={meta.path} className="hover:text-brand-accent">
          {meta.plural}
        </Link>{" "}
        / <span>{row.name}</span>
      </nav>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-navy sm:text-3xl">{row.name}</h1>
          <p className="mt-1 text-slate-600">
            {row.role}
            {row.experienceYears != null ? ` · ${row.experienceYears} years` : ""}
          </p>
        </div>
        {row.availability && (
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${row.availability === "Not available" ? "bg-slate-100 text-slate-500" : "bg-emerald-50 text-emerald-700"}`}>{row.availability}</span>
        )}
      </div>

      {(row.city || row.state) && (
        <p className="mt-3 flex items-center gap-2 text-sm text-slate-600">
          <MapPin className="h-4 w-4 text-slate-400" /> {[row.city, row.state].filter(Boolean).join(", ")}
        </p>
      )}
      {row.headline && <p className="mt-4 text-lg text-slate-700">{row.headline}</p>}
      {row.equipmentDetails && (
        <p className="mt-3 text-sm text-slate-600">
          <span className="font-semibold text-slate-800">Equipment: </span>
          {row.equipmentDetails}
        </p>
      )}
      {row.skills.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {row.skills.map((s) => (
            <span key={s} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {s}
            </span>
          ))}
        </div>
      )}
      {row.about && <p className="mt-6 whitespace-pre-line leading-relaxed text-slate-700">{row.about}</p>}

      <div className="mt-8 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Contact</h2>
        {me ? (
          <ul className="mt-3 space-y-2 text-sm">
            {row.phone && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-400" />
                <a href={`tel:${row.phone}`} className="font-medium text-brand-accent hover:underline">
                  {row.phone}
                </a>
              </li>
            )}
            {row.email && (
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <a href={`mailto:${row.email}`} className="font-medium text-brand-accent hover:underline">
                  {row.email}
                </a>
              </li>
            )}
          </ul>
        ) : (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <Lock className="h-4 w-4 text-slate-400" /> Contact details are shown to signed-in members.
            </p>
            <Link
              href={`/sign-in?intent=contacts&next=${encodeURIComponent(`${meta.path}/${row.slug}`)}`}
              className="rounded-full bg-brand-accent px-5 py-2 text-sm font-semibold text-white hover:bg-brand-accent-light"
            >
              Sign in to view contact
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
