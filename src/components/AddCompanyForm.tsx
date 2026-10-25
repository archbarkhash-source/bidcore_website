"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSession } from "@/lib/use-session";
import { COMPANY_TYPES, STATES } from "@/lib/data";
import { signUpHref } from "@/lib/app-links";

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

export default function AddCompanyForm() {
  const session = useSession();
  const [card, setCard] = useState<Card>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [field, setField] = useState("");
  const [done, setDone] = useState<null | { synced: boolean }>(null);

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

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setField("");
    setBusy(true);
    try {
      const res = await fetch("/api/company-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...card,
          trades: card.trades
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        setField(json.field ?? "");
        return;
      }
      setDone({ synced: json.synced });
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (session === undefined) return <p className="text-sm text-slate-400">Loading...</p>;

  if (session === null) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
        <h2 className="text-lg font-semibold text-brand-navy">Verify your business email first</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
          Add your company to Bidcore after a quick email check, so only you can edit it.
        </p>
        <Link
          href="/sign-in?intent=company&next=/add-company"
          className="mt-5 inline-block rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light"
        >
          Continue with your email
        </Link>
        <p className="mt-3 text-sm text-slate-500">
          Already a member?{" "}
          <Link href="/login?next=/add-company" className="font-medium text-brand-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8">
        <h2 className="text-lg font-semibold text-emerald-800">Your company information is saved.</h2>
        <p className="mt-2 text-sm text-emerald-700">
          {done.synced
            ? "It is also saved in your BidcoreAI account."
            : "It is saved. The copy to your BidcoreAI account is queued and will complete automatically."}{" "}
          Your company appears on Bidcore.in once it has an active Bidcore subscription.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={signUpHref("tender-connect")} className="rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-accent-light">
            Start Free
          </Link>
          <Link href="/companies" className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-brand-navy hover:border-slate-400">
            Back to companies
          </Link>
          <button onClick={() => setDone(null)} className="px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-brand-accent">
            Edit again
          </button>
        </div>
      </div>
    );
  }

  const input =
    "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10";
  const bad = (f: string) => (field === f ? " border-red-400" : "");

  return (
    <form onSubmit={submit} className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
      <label className="block text-sm font-medium text-slate-700">
        Company name *
        <input required className={input + bad("companyName")} value={card.companyName} onChange={(e) => set("companyName", e.target.value)} maxLength={300} />
      </label>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Company type
          <select className={input + bad("companyType")} value={card.companyType} onChange={(e) => set("companyType", e.target.value)}>
            <option value="">Choose…</option>
            {COMPANY_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          State
          <select className={input + bad("state")} value={card.state} onChange={(e) => set("state", e.target.value)}>
            <option value="">Choose…</option>
            {STATES.map((s) => (
              <option key={s.slug}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          City
          <input className={input} value={card.city} onChange={(e) => set("city", e.target.value)} maxLength={120} />
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Website
          <input className={input + bad("website")} value={card.website} onChange={(e) => set("website", e.target.value)} placeholder="www.yourcompany.in" maxLength={300} />
        </label>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Trades / specializations <span className="font-normal text-slate-400">— separated by commas</span>
        <input className={input} value={card.trades} onChange={(e) => set("trades", e.target.value)} placeholder="Civil, MEP, Roads & Highways" />
      </label>

      <label className="block text-sm font-medium text-slate-700">
        About your company
        <textarea className={input} rows={4} value={card.about} onChange={(e) => set("about", e.target.value)} maxLength={4000} />
      </label>

      <label className="flex items-start gap-2.5 text-sm text-slate-700">
        <input type="checkbox" className="mt-1" checked={card.listed} onChange={(e) => set("listed", e.target.checked)} />
        <span>
          List my company on Bidcore.in once it has an active subscription.
          <span className="block text-xs text-slate-500">Name, type, location, trades and website only. Never your phone or email.</span>
        </span>
      </label>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          disabled={busy || !loaded}
          className="rounded-full bg-brand-navy px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Saving…" : "Save company information"}
        </button>
        <Link href="/companies" className="text-sm text-slate-500 hover:text-brand-accent">
          Cancel
        </Link>
      </div>
    </form>
  );
}
