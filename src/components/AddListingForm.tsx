"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useSession } from "@/lib/use-session";
import { STATES } from "@/lib/data";
import { AVAILABILITY, KIND_META, type ListingKind } from "@/lib/listings";

interface Form {
  role: string;
  name: string;
  headline: string;
  about: string;
  state: string;
  city: string;
  skills: string;
  experienceYears: string;
  availability: string;
  equipmentDetails: string;
  phone: string;
  email: string;
  listed: boolean;
}

const EMPTY: Form = { role: "", name: "", headline: "", about: "", state: "", city: "", skills: "", experienceYears: "", availability: "Available now", equipmentDetails: "", phone: "", email: "", listed: true };

export default function AddListingForm({ initialKind }: { initialKind: ListingKind }) {
  const session = useSession();
  const [kind, setKind] = useState<ListingKind>(initialKind);
  const [form, setForm] = useState<Form>(EMPTY);
  const [member, setMember] = useState<{ name: string; email: string; phone: string; city: string | null } | null>(null);
  const [existing, setExisting] = useState<Partial<Record<ListingKind, boolean>>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [field, setField] = useState("");
  const [done, setDone] = useState<null | { synced: boolean; slug: string }>(null);
  const meta = KIND_META[kind];

  // the member's own listings (to edit) and the details they signed up with (to fill in)
  useEffect(() => {
    if (!session) return;
    fetch("/api/listings")
      .then((r) => r.json())
      .then((d) => {
        setMember(d.member ?? null);
        const have: Partial<Record<ListingKind, boolean>> = {};
        for (const l of d.listings ?? []) have[l.kind as ListingKind] = true;
        setExisting(have);
        window.__bidcoreListings = d.listings ?? [];
        load(initialKind, d.listings ?? [], d.member ?? null);
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  function load(k: ListingKind, listings: { kind: string; [key: string]: unknown }[], m: typeof member) {
    const mine = listings.find((l) => l.kind === k) as Record<string, unknown> | undefined;
    if (mine) {
      setForm({
        role: String(mine.role ?? ""),
        name: String(mine.name ?? ""),
        headline: String(mine.headline ?? ""),
        about: String(mine.about ?? ""),
        state: String(mine.state ?? ""),
        city: String(mine.city ?? ""),
        skills: ((mine.skills as string[]) ?? []).join(", "),
        experienceYears: mine.experienceYears == null ? "" : String(mine.experienceYears),
        availability: String(mine.availability ?? "Available now"),
        equipmentDetails: String(mine.equipmentDetails ?? ""),
        phone: String(mine.phone ?? ""),
        email: String(mine.email ?? ""),
        listed: mine.listed !== false,
      });
    } else {
      setForm({ ...EMPTY, name: k === "professional" ? (m?.name ?? "") : "", phone: m?.phone ?? "", email: m?.email ?? "", city: m?.city ?? "" });
    }
  }

  function pickKind(k: ListingKind) {
    setKind(k);
    setError("");
    setField("");
    load(k, window.__bidcoreListings ?? [], member);
  }

  const set = (k: keyof Form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setField("");
    setBusy(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          ...form,
          skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
          experienceYears: form.experienceYears === "" ? null : Number(form.experienceYears),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        setField(json.field ?? "");
        return;
      }
      setDone({ synced: json.synced, slug: json.listing.slug });
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
        <h2 className="text-lg font-semibold text-brand-navy">Verify your email first</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">A quick email check keeps listings genuine and lets only you edit yours.</p>
        <Link
          href={`/sign-in?intent=contacts&next=${encodeURIComponent(`/add-listing?kind=${initialKind}`)}`}
          className="mt-5 inline-block rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light"
        >
          Continue with your email
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8">
        <h2 className="text-lg font-semibold text-emerald-800">Your listing is saved.</h2>
        <p className="mt-2 text-sm text-emerald-700">
          {form.listed ? "It is now visible under Explore." : "It is saved but hidden."}{" "}
          {done.synced ? "A copy is also saved in your BidcoreAI account." : "The copy to your BidcoreAI account is queued and will complete automatically."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href={`${meta.path}/${done.slug}`} className="rounded-full bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-accent-light">
            View my listing
          </Link>
          <Link href={meta.path} className="rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-brand-navy hover:border-slate-400">
            Browse {meta.plural.toLowerCase()}
          </Link>
          <button onClick={() => setDone(null)} className="px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-brand-accent">
            Edit again
          </button>
        </div>
      </div>
    );
  }

  const input = "mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10";
  const bad = (f: string) => (field === f ? " border-red-400" : "");

  return (
    <form onSubmit={submit} className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
      <div className="grid grid-cols-2 rounded-md bg-slate-100 p-0.5 text-sm font-medium">
        {(["professional", "equipment"] as ListingKind[]).map((k) => (
          <button key={k} type="button" onClick={() => pickKind(k)} aria-pressed={kind === k} className={`rounded px-3 py-2 transition ${kind === k ? "bg-white text-brand-navy shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            {k === "professional" ? "I am a professional" : "I have equipment"}
            {existing[k] ? " ✓" : ""}
          </button>
        ))}
      </div>

      <label className="block text-sm font-medium text-slate-700">
        {kind === "equipment" ? "Business / owner name *" : "Your name *"}
        <input required className={input + bad("name")} value={form.name} onChange={(e) => set("name", e.target.value)} maxLength={200} />
      </label>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          {meta.roleLabel} *
          <select required className={input + bad("role")} value={form.role} onChange={(e) => set("role", e.target.value)}>
            <option value="">Choose…</option>
            {meta.roles.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          Availability
          <select className={input + bad("availability")} value={form.availability} onChange={(e) => set("availability", e.target.value)}>
            {AVAILABILITY.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          State
          <select className={input + bad("state")} value={form.state} onChange={(e) => set("state", e.target.value)}>
            <option value="">Choose…</option>
            {STATES.map((s) => (
              <option key={s.slug}>{s.name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">
          City
          <input className={input} value={form.city} onChange={(e) => set("city", e.target.value)} maxLength={120} />
        </label>
      </div>

      {kind === "professional" ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Years of experience
            <input inputMode="numeric" className={input + bad("experienceYears")} value={form.experienceYears} onChange={(e) => set("experienceYears", e.target.value.replace(/\D/g, ""))} />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Skills <span className="font-normal text-slate-400">(separated by commas)</span>
            <input className={input} value={form.skills} onChange={(e) => set("skills", e.target.value)} placeholder="Billing, Shuttering, AutoCAD" />
          </label>
        </div>
      ) : (
        <label className="block text-sm font-medium text-slate-700">
          What you have <span className="font-normal text-slate-400">(make, model, capacity, quantity)</span>
          <input className={input} value={form.equipmentDetails} onChange={(e) => set("equipmentDetails", e.target.value)} placeholder="2 × JCB 3DX, 1 × 20 t tipper" maxLength={300} />
        </label>
      )}

      <label className="block text-sm font-medium text-slate-700">
        Headline
        <input className={input} value={form.headline} onChange={(e) => set("headline", e.target.value)} placeholder={kind === "equipment" ? "Excavators and tippers on hire, with operators" : "Civil site engineer, 8 years on highway and building sites"} maxLength={200} />
      </label>
      <label className="block text-sm font-medium text-slate-700">
        About
        <textarea className={input} rows={4} value={form.about} onChange={(e) => set("about", e.target.value)} maxLength={4000} />
      </label>

      <div className="rounded-md bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-800">Contact details</p>
        <p className="mt-0.5 text-xs text-slate-500">Shown only to signed-in members, so general contractors and subcontractors can reach you. Add at least one.</p>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium text-slate-700">
            Phone
            <input type="tel" className={input + bad("phone")} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91" />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Email
            <input type="email" className={input + bad("email")} value={form.email} onChange={(e) => set("email", e.target.value)} />
          </label>
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-slate-700">
        <input type="checkbox" className="mt-1" checked={form.listed} onChange={(e) => set("listed", e.target.checked)} />
        <span>Show my listing under Explore.</span>
      </label>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex items-center gap-3">
        <button disabled={busy} className="rounded-full bg-brand-navy px-6 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50">
          {busy ? "Saving…" : existing[kind] ? "Update listing" : "Save listing"}
        </button>
        <Link href="/explore" className="text-sm text-slate-500 hover:text-brand-accent">
          Cancel
        </Link>
      </div>
    </form>
  );
}

declare global {
  interface Window {
    __bidcoreListings?: { kind: string; [key: string]: unknown }[];
  }
}
