"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { notifySessionChange, useSession } from "@/lib/use-session";
import { COMPANY_TYPES, STATES } from "@/lib/data";

// One page to add a company to the Bidcore directory: the company, and the person to contact for tender invites (name, designation, verified email and mobile).
// There is no app account to create. Verifying the e-mail and the mobile number with one-time codes is what keeps the directory real; the saved company is copied to
// the BidcoreAI India contractor database (api/company-info), where the Add Tenderers search finds it.

interface Card {
  companyName: string;
  companyType: string;
  state: string;
  city: string;
  trades: string;
  website: string;
  about: string;
  listed: boolean;
}

const EMPTY: Card = { companyName: "", companyType: "", state: "", city: "", trades: "", website: "", about: "", listed: true };

/** The sign-up role (lib/roles) that best matches a company type, for the OTP request. */
function roleForType(t: string): string {
  if (/supplier/i.test(t)) return "Vendor / Supplier";
  if (t === "Architect") return "Architect";
  if (t === "Real Estate Developer") return "Developer / Owner";
  if (t === "Construction Consultant" || t === "PMC") return "Consultant / PMC";
  if (t === "General Contractor" || t === "EPC Contractor") return "General Contractor";
  return "Subcontractor";
}

const input =
  "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10";

export default function AddCompanyForm() {
  const session = useSession();
  const [card, setCard] = useState<Card>(EMPTY);
  const [contact, setContact] = useState({ name: "", designation: "", email: "", phone: "" });
  const [loaded, setLoaded] = useState(false);
  const [step, setStep] = useState<"form" | "codes">("form");
  const [code, setCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [field, setField] = useState("");
  const [done, setDone] = useState<null | { listedInDirectory: boolean }>(null);

  // A signed-in member sees what they saved before (and is already verified).
  useEffect(() => {
    if (!session) return;
    fetch("/api/company-info")
      .then((r) => r.json())
      .then((d) => {
        const c = d.company;
        if (c)
          setCard({
            companyName: c.companyName ?? "",
            companyType: c.companyType ?? "",
            state: c.state ?? "",
            city: c.city ?? "",
            trades: (c.trades ?? []).join(", "),
            website: c.website ?? "",
            about: c.about ?? "",
            listed: c.listed !== false,
          });
      })
      .finally(() => setLoaded(true));
  }, [session]);

  const set = (k: keyof Card, v: string | boolean) => setCard((c) => ({ ...c, [k]: v }));
  const bad = (f: string) => (field === f ? " border-red-400" : "");
  const phoneFull = `+91 ${contact.phone.replace(/\D/g, "")}`;
  // A signed-in member's own name is the default contact person until they type another.
  const contactName = contact.name || session?.name || "";

  async function save() {
    const res = await fetch("/api/company-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...card,
        trades: card.trades
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        contactName,
        designation: contact.designation,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Something went wrong. Please try again.");
      setField(json.field ?? "");
      setStep("form");
      return;
    }
    setDone({ listedInDirectory: !!json.listedInDirectory });
  }

  async function requestCode() {
    const res = await fetch("/api/signup/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: contactName,
        email: contact.email,
        phone: phoneFull,
        role: roleForType(card.companyType),
        companyName: card.companyName,
        city: card.city,
        country: "IN",
        intent: "company",
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "We couldn't send the codes. Please try again.");
      setField(json.field ?? "");
      return false;
    }
    return true;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setField("");
    setBusy(true);
    try {
      if (session) {
        await save();
      } else if (await requestCode()) {
        setStep("codes");
      }
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verify(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/signup/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: contact.email.trim().toLowerCase(), code, phoneCode }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Verification failed. Please try again.");
        return;
      }
      notifySessionChange();
      await save();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (session === undefined) return <p className="text-sm text-slate-400">Loading...</p>;

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8">
        <h2 className="text-lg font-semibold text-emerald-800">Your company is added to the Bidcore directory.</h2>
        <p className="mt-2 text-sm text-emerald-700">
          {done.listedInDirectory
            ? `${card.companyName || "Your company"} is now listed under Find Contractors on Bidcore.in. Your phone and email are never shown.`
            : `${card.companyName || "Your company"} is saved. It is not shown in Find Contractors, because that list is for EPC, general, specialty and design-build contractors, or because you chose not to list it.`}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/contractors" className="rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-accent-light">
            Find contractors
          </Link>
          <button onClick={() => setDone(null)} className="px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-brand-accent">
            Edit again
          </button>
        </div>
      </div>
    );
  }

  if (step === "codes") {
    return (
      <form onSubmit={verify} className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
        <div className="rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-700">
          We emailed a 6-digit code to <span className="font-semibold">{contact.email}</span> and sent an SMS code to <span className="font-semibold">{phoneFull}</span>. Both expire in 10 minutes.
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Email verification code *
          <input
            required
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className={`${input} text-center text-lg tracking-[0.5em]`}
            placeholder="······"
          />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Mobile (SMS) verification code *
          <input
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={phoneCode}
            onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ""))}
            className={`${input} text-center text-lg tracking-[0.5em]`}
            placeholder="······"
          />
        </label>
        {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <button
            disabled={busy || code.length !== 6 || phoneCode.length !== 6}
            className="rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light disabled:opacity-60"
          >
            {busy ? "Verifying…" : "Verify and add my company"}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setError("");
              setBusy(true);
              try {
                await requestCode();
              } finally {
                setBusy(false);
              }
            }}
            className="text-sm font-medium text-slate-600 hover:text-brand-accent disabled:opacity-50"
          >
            Resend codes
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("form");
              setError("");
            }}
            className="text-sm font-medium text-slate-600 hover:text-brand-accent"
          >
            Change details
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6 rounded-lg border border-slate-200 bg-white p-6">
      <section className="space-y-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Company</h2>
        <label className="block text-sm font-medium text-slate-700">
          Company name *
          <input required className={input + bad("companyName")} value={card.companyName} onChange={(e) => set("companyName", e.target.value)} maxLength={300} />
        </label>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Company type *
            <select required className={input + bad("companyType")} value={card.companyType} onChange={(e) => set("companyType", e.target.value)}>
              <option value="">Choose…</option>
              {COMPANY_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            State *
            <select required className={input + bad("state")} value={card.state} onChange={(e) => set("state", e.target.value)}>
              <option value="">Choose…</option>
              {STATES.map((s) => (
                <option key={s.slug}>{s.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium text-slate-700">
            City *
            <input required className={input} value={card.city} onChange={(e) => set("city", e.target.value)} maxLength={120} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Website
            <input className={input + bad("website")} value={card.website} onChange={(e) => set("website", e.target.value)} placeholder="www.yourcompany.in" maxLength={300} />
          </label>
        </div>
        <label className="block text-sm font-medium text-slate-700">
          Trades / specializations <span className="font-normal text-slate-400">(separated by commas)</span>
          <input className={input} value={card.trades} onChange={(e) => set("trades", e.target.value)} placeholder="Civil, MEP, Roads & Highways" />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          About your company
          <textarea className={input} rows={3} value={card.about} onChange={(e) => set("about", e.target.value)} maxLength={4000} />
        </label>
      </section>

      <section className="space-y-5 border-t border-slate-200 pt-6">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">Point of contact for tender invites</h2>
          <p className="mt-1 text-sm text-slate-500">
            The person who should receive tender invitations. Shown to signed-in contractors who invite tenderers on Tender Connect, never on the public website.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Contact person *
            <input required className={input} value={contactName} onChange={(e) => setContact({ ...contact, name: e.target.value })} maxLength={120} autoComplete="name" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Designation *
            <input required className={input} value={contact.designation} onChange={(e) => setContact({ ...contact, designation: e.target.value })} placeholder="e.g. Managing Partner, Estimator" maxLength={100} />
          </label>
          {!session && (
            <>
              <label className="block text-sm font-medium text-slate-700">
                Email *
                <input required type="email" className={input + bad("email")} value={contact.email} onChange={(e) => setContact({ ...contact, email: e.target.value })} placeholder="you@company.com" autoComplete="email" />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Mobile *
                <div className="mt-1 flex">
                  <span className="flex items-center rounded-l-md border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-500">+91</span>
                  <input
                    required
                    inputMode="numeric"
                    className={`${input.replace("mt-1 ", "")} rounded-l-none${bad("phone")}`}
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                    placeholder="10-digit mobile number"
                    autoComplete="tel-national"
                  />
                </div>
              </label>
            </>
          )}
        </div>
        {!session && <p className="text-xs text-slate-500">We send a code to this email and an SMS code to this mobile number to confirm both are real. No account or payment is needed.</p>}
      </section>

      <label className="flex items-start gap-2.5 text-sm text-slate-700">
        <input type="checkbox" className="mt-1" checked={card.listed} onChange={(e) => set("listed", e.target.checked)} />
        <span>
          Show my company on Bidcore.in.
          <span className="block text-xs text-slate-500">Name, type, location, trades and website only. Never your phone or email.</span>
        </span>
      </label>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex items-center gap-3">
        <button disabled={busy || (!!session && !loaded)} className="rounded-full bg-brand-navy px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
          {busy ? "Please wait…" : session ? "Save company information" : "Verify and add my company"}
        </button>
        <Link href="/contractors" className="text-sm text-slate-500 hover:text-brand-accent">
          Cancel
        </Link>
      </div>
    </form>
  );
}
