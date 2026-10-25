"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import DemoSlotPicker from "@/components/DemoSlotPicker";
import { DEMO_INTERESTS, DEMO_ROLES } from "@/lib/demo";
import { COUNTRIES } from "@/lib/roles";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-brand-accent"> *</span>}
      </span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

export default function DemoRequestForm({ initialInterest }: { initialInterest?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/demo-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
        <h2 className="mt-3 text-lg font-semibold text-emerald-800">Thank you, your request has been sent.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-emerald-700">The Bidcore team will contact you on the email or phone number you gave.</p>
        <Link href="/" className="mt-5 inline-block rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light">
          Back to home
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Full name" required>
          <input required name="name" type="text" autoComplete="name" className={inputClass} placeholder="Your name" />
        </Field>
        <Field label="Work email" required>
          <input required name="email" type="email" autoComplete="email" className={inputClass} placeholder="you@company.com" />
        </Field>
        <Field label="Phone" required>
          <input required name="phone" type="tel" autoComplete="tel" className={inputClass} placeholder="Mobile number" />
        </Field>
        <Field label="Company" required>
          <input required name="company" type="text" autoComplete="organization" className={inputClass} placeholder="Your company" />
        </Field>
        <Field label="Country" required>
          <select required name="country" defaultValue="India" className={inputClass}>
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.label}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="I am a">
          <select name="role" defaultValue="" className={inputClass}>
            <option value="">Select who you are</option>
            {DEMO_ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Interested in">
          <select name="interest" defaultValue={initialInterest && DEMO_INTERESTS.includes(initialInterest) ? initialInterest : ""} className={inputClass}>
            <option value="">Select a product</option>
            {DEMO_INTERESTS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div>
        <span className="text-sm font-medium text-slate-700">
          Pick a date &amp; time <span className="text-brand-accent">*</span>
        </span>
        <p className="mt-1 text-sm text-slate-600">Choose any day from tomorrow. All times are Indian Standard Time (IST).</p>
        <div className="mt-3">
          <DemoSlotPicker />
        </div>
      </div>
      <Field label="Anything you would like us to know">
        <textarea name="message" rows={4} maxLength={2000} className={inputClass} placeholder="For example: the kind of projects you bid on, or what you would like to see." />
      </Field>
      {/* honeypot: hidden from people, filled in by bots */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={busy} className="rounded-sm bg-orange-500 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-white transition hover:bg-orange-400 disabled:opacity-60">
        {busy ? "Sending..." : "Request a Demo"}
      </button>
    </form>
  );
}
