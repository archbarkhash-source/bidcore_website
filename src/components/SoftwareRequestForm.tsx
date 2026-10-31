"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { COUNTRIES } from "@/lib/roles";
import { SOFTWARE, TRIAL_DAYS } from "@/lib/software";

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10";

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-brand-accent"> *</span>}
      </span>
      <div className="mt-1.5">{children}</div>
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

// Request the yearly subscription of an installable program. The licence is issued by the Bidcore team and e-mailed back; the program itself already runs for 30 days without it.
export default function SoftwareRequestForm({ initialProduct }: { initialProduct?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<number | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/software-requests", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      setDone(json.id ?? 0);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (done !== null) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
        <h2 className="mt-3 text-lg font-semibold text-emerald-800">Thank you, your request has been received{done ? ` (#${done})` : ""}.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-emerald-700">
          The Bidcore team will contact you on the email or phone number you gave, with the details of the yearly subscription. Your licence file is sent by email once it is arranged.
          Until then the program keeps working for its {TRIAL_DAYS}-day free trial.
        </p>
        <Link href="/software" className="mt-5 inline-block rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light">
          Back to the software
        </Link>
      </div>
    );
  }

  const initial = SOFTWARE.some((p) => p.key === initialProduct) ? initialProduct : "";
  return (
    <form onSubmit={onSubmit} className="space-y-5 rounded-lg border border-slate-200 bg-white p-6">
      <Field label="Program" required>
        <select name="product" required defaultValue={initial} className={inputClass}>
          <option value="" disabled>
            Choose a program
          </option>
          {SOFTWARE.map((p) => (
            <option key={p.key} value={p.key}>
              {p.name}
            </option>
          ))}
        </select>
      </Field>
      <p className="rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-600">Plan: yearly subscription (1 year). Every program starts with a {TRIAL_DAYS}-day free trial, with no card.</p>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Your name" required>
          <input name="name" required maxLength={120} className={inputClass} autoComplete="name" />
        </Field>
        <Field label="Company" required>
          <input name="company" required maxLength={160} className={inputClass} autoComplete="organization" />
        </Field>
        <Field label="Email" required>
          <input name="email" type="email" required maxLength={200} className={inputClass} autoComplete="email" />
        </Field>
        <Field label="Phone" required>
          <input name="phone" type="tel" required maxLength={40} className={inputClass} autoComplete="tel" />
        </Field>
      </div>
      <Field label="Country" required>
        <select name="country" required defaultValue="India" className={inputClass}>
          {COUNTRIES.map((c) => (
            <option key={c.code} value={c.label}>
              {c.label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Computer code (optional)" hint="Makes the licence work only on one computer. Find it in the program under Settings > Product Licence. Leave it blank for a licence that works on any computer.">
        <input name="machineCode" maxLength={40} placeholder="ABCD-1234-EFGH-5678-IJKL" className={inputClass} />
      </Field>
      <Field label="Message (optional)">
        <textarea name="message" rows={3} maxLength={2000} className={inputClass} />
      </Field>
      {/* Honeypot: real visitors never see or fill this field. */}
      <div className="hidden" aria-hidden>
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button disabled={busy} className="w-full rounded-full bg-brand-accent px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-accent-light disabled:opacity-60">
        {busy ? "Sending..." : "Request the yearly subscription"}
      </button>
    </form>
  );
}
