import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";
import { STATES } from "@/lib/data";
import { emailMatchesCompany } from "@/lib/company-domain";
import { claimCompany, createCompany } from "@/lib/marketplace/actions";
import { signInUrl } from "@/lib/marketplace/auth";
import { BUSINESS_TYPES, MP } from "@/lib/marketplace/constants";
import { domainOf, normalizeCin, normalizeName } from "@/lib/marketplace/identity";
import { Field, inputClass, outlineBtn, primaryBtn, one } from "@/components/marketplace/ui";

export const metadata: Metadata = {
  title: "List Your Business on the Bidcore Marketplace",
  description: "Add your construction company, products and services to the Bidcore marketplace for free, or claim an existing profile.",
  alternates: { canonical: `${MP}/list-your-business` },
};

type SP = Record<string, string | string[] | undefined>;

const STEPS = ["Find your company", "Claim or add", "Business details", "Products and services", "Review and publish"];

function Steps({ current }: { current: number }) {
  return (
    <ol className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="Steps">
      {STEPS.map((s, i) => (
        <li key={s} aria-current={i + 1 === current ? "step" : undefined} className={i + 1 === current ? "font-semibold text-brand-navy" : "text-slate-400"}>
          {i + 1}. {s}
        </li>
      ))}
    </ol>
  );
}

function Shell({ children, step, error }: { children: React.ReactNode; step: number; error?: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">List your business</h1>
      <p className="mt-1 text-slate-600">Free to join. Add your company, products and services so buyers across India can find and contact you. Only the basics are required — you can complete the rest later.</p>
      <Steps current={step} />
      {error && <p role="alert" className="mt-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</p>}
      <div className="mt-6">{children}</div>
    </div>
  );
}

export default async function ListYourBusiness({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = await getCurrentUser().catch(() => null);
  const q = one(sp.q);
  const claimId = one(sp.claim);
  const creating = one(sp.new) === "1";
  const error = one(sp.error);
  const next = `${MP}/list-your-business${claimId ? `?claim=${claimId}` : creating ? "?new=1" : ""}`;

  // Step 0 for visitors who are not signed in.
  if (!user) {
    return (
      <Shell step={1} error={error}>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Sign in with your business email</h2>
          <p className="mt-1 text-sm text-slate-600">We use your company email to confirm you act for the business and to send you enquiries. Personal email addresses (Gmail, Outlook, Yahoo…) are not accepted.</p>
          <Link href={signInUrl(next)} className={`${primaryBtn} mt-4`}>Sign in or create an account</Link>
        </div>
      </Shell>
    );
  }

  // Claim a specific company
  if (claimId) {
    const c = await db.company.findFirst({ where: { id: claimId, active: true }, include: { state: { select: { name: true } } } });
    if (!c) return <Shell step={2} error={error}><p className="text-sm text-slate-600">That company was not found. <Link className="text-brand-accent underline" href={`${MP}/list-your-business`}>Search again</Link>.</p></Shell>;
    const taken = c.claimedById && c.claimedById !== user.id;
    const domainOk = emailMatchesCompany(user.email, c);
    return (
      <Shell step={2} error={error}>
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900">{c.name}</h2>
          <p className="text-sm text-slate-500">{c.type} · {[c.cityName, c.state.name].filter(Boolean).join(", ")}</p>
          {one(sp.sent) ? (
            <p role="status" className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">Your claim request was sent. Our team will review it and email you at {user.email}.</p>
          ) : taken ? (
            <p className="mt-4 text-sm text-slate-600">This company is already managed by another member. If that is a mistake, open its public profile and use “Report a problem”.</p>
          ) : c.claimedById === user.id ? (
            <Link href={`${MP}/dashboard?company=${c.id}`} className={`${primaryBtn} mt-4`}>Open your dashboard</Link>
          ) : domainOk ? (
            <form action={claimCompany} className="mt-4">
              <input type="hidden" name="companyId" value={c.id} />
              <p className="text-sm text-slate-600">Your email <span className="font-medium">{user.email}</span> is on this company&apos;s domain, so you can claim the profile immediately.</p>
              <button className={`${primaryBtn} mt-3`}>Claim this company</button>
            </form>
          ) : (
            <form action={claimCompany} className="mt-4 space-y-4">
              <input type="hidden" name="companyId" value={c.id} />
              <p className="text-sm text-slate-600">Your email ({user.email}) is not on this company&apos;s website or email domain, so the Bidcore team will review your request before you can manage the profile.</p>
              <Field label="Your role at the company *"><input name="role" required maxLength={120} className={inputClass} /></Field>
              <Field label="How can we confirm you act for this company? *" hint="e.g. your company email address, an official website page listing you, GST or registration details."><textarea name="evidence" required minLength={20} maxLength={1500} rows={4} className={inputClass} /></Field>
              <button className={primaryBtn}>Send claim request</button>
            </form>
          )}
          <p className="mt-5 text-sm"><Link href={`${MP}/list-your-business`} className="text-slate-500 hover:text-slate-800">← Search again</Link></p>
        </div>
      </Shell>
    );
  }

  // Create a new company
  if (creating) {
    return (
      <Shell step={3} error={error}>
        <form action={createCompany} className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
          <input type="hidden" name="confirmNew" value="1" />
          <Field label="Registered company name *"><input name="name" required maxLength={300} defaultValue={q} className={inputClass} /></Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Business type *">
              <select name="type" required defaultValue="" className={inputClass}>
                <option value="" disabled>Choose…</option>
                {BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="State *">
              <select name="state" required defaultValue="" className={inputClass}>
                <option value="" disabled>Choose…</option>
                {STATES.map((s) => <option key={s.slug}>{s.name}</option>)}
              </select>
            </Field>
            <Field label="City"><input name="city" maxLength={120} className={inputClass} /></Field>
            <Field label="Website"><input name="website" maxLength={300} placeholder="www.yourcompany.in" className={inputClass} /></Field>
            <Field label="Business email"><input name="email" type="email" maxLength={200} className={inputClass} /></Field>
            <Field label="Business phone"><input name="phone" maxLength={40} className={inputClass} /></Field>
            <Field label="GSTIN"><input name="gstin" maxLength={15} className={inputClass} /></Field>
            <Field label="CIN"><input name="cin" maxLength={21} className={inputClass} /></Field>
          </div>
          <Field label="About the company"><textarea name="about" rows={4} maxLength={4000} className={inputClass} /></Field>
          <p className="text-xs text-slate-500">Add at least one of website, email or phone. Your details stay hidden from visitors who are not signed in until you choose to show them. After saving you can add products and services and submit the profile for publication.</p>
          <div className="flex items-center gap-3">
            <button className={primaryBtn}>Save and continue</button>
            <Link href={`${MP}/list-your-business`} className="text-sm text-slate-500 hover:text-slate-800">Back</Link>
          </div>
        </form>
      </Shell>
    );
  }

  // Step 1: find the company (never create a duplicate)
  const nq = q ? normalizeName(q) : "";
  const cin = q ? normalizeCin(q) : null;
  const domain = q.includes(".") ? domainOf(q) : null;
  const matches = q
    ? await db.company.findMany({
        where: {
          active: true,
          OR: [{ name: { contains: q, mode: "insensitive" } }, ...(nq.length >= 3 ? [{ normalizedName: { contains: nq } }] : []), ...(cin ? [{ cin }] : []), ...(domain ? [{ domain }] : [])],
        },
        select: { id: true, name: true, type: true, cityName: true, claimed: true, claimedById: true, state: { select: { name: true } } },
        orderBy: { name: "asc" },
        take: 15,
      })
    : [];
  const mine = await db.company.findMany({ where: { claimedById: user.id, active: true }, select: { id: true, name: true } });

  return (
    <Shell step={1} error={error}>
      {mine.length > 0 && (
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <p className="font-medium text-slate-800">Companies you manage</p>
          <ul className="mt-1 space-y-1">{mine.map((m) => <li key={m.id}><Link className="text-brand-accent hover:underline" href={`${MP}/dashboard?company=${m.id}`}>{m.name}</Link></li>)}</ul>
        </div>
      )}
      {one(sp.dup) && (
        <p role="status" className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">A company that looks like yours is already in the directory (same name, website, CIN or GSTIN). Please claim it below instead of creating a second record.</p>
      )}
      <form method="get" className="flex gap-2" role="search">
        <input name="q" defaultValue={q} aria-label="Company name, website or CIN" placeholder="Search your company name, website or CIN" className={`${inputClass} py-3`} />
        <button className="rounded-md bg-brand-navy px-5 text-sm font-semibold text-white">Search</button>
      </form>
      {q && (
        <div className="mt-5">
          {matches.length === 0 ? (
            <p className="text-sm text-slate-600">No company matches “{q}”.</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-white">
              {matches.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium text-slate-900">{m.name}</p>
                    <p className="text-sm text-slate-500">{m.type} · {[m.cityName, m.state.name].filter(Boolean).join(", ")}</p>
                  </div>
                  {m.claimedById === user.id ? (
                    <Link href={`${MP}/dashboard?company=${m.id}`} className={outlineBtn}>Open dashboard</Link>
                  ) : m.claimedById ? (
                    <span className="text-sm text-slate-400">Already managed</span>
                  ) : (
                    <Link href={`${MP}/list-your-business?claim=${m.id}`} className={outlineBtn}>This is my company</Link>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-5 text-sm text-slate-600">
            Not in the list? <Link href={`${MP}/list-your-business?new=1${q ? `&q=${encodeURIComponent(q)}` : ""}`} className="font-medium text-brand-accent hover:underline">Add your company as a new business</Link>.
          </p>
        </div>
      )}
      {!q && <p className="mt-4 text-sm text-slate-500">Search first so we do not create a second record for a business that is already listed.</p>}
    </Shell>
  );
}
