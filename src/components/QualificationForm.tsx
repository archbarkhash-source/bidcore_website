"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function QualificationForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="text-lg font-semibold text-emerald-800">Qualification submitted.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-emerald-700">
          We&apos;ll review your details and reflect them on your company profile. A fuller
          qualification workflow — licenses, financials, safety record — rolls out with{" "}
          <Link href="/bid-board" className="text-brand-accent hover:underline">
            Bid Board
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Licenses &amp; Registration
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Company registration / GST number">
            <input type="text" className={inputClass} placeholder="Optional" />
          </Field>
          <Field label="Contractor license number">
            <input type="text" className={inputClass} placeholder="Optional" />
          </Field>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Certifications &amp; Insurance
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="ISO / quality certifications">
            <input type="text" className={inputClass} placeholder="e.g. ISO 9001, ISO 45001" />
          </Field>
          <Field label="Insurance / bonding capacity">
            <input type="text" className={inputClass} placeholder="Optional" />
          </Field>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Track Record
        </h2>
        <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Field label="Annual turnover range">
            <select className={inputClass} defaultValue="">
              <option value="" disabled>
                Select a range
              </option>
              <option>Under ₹5 Cr</option>
              <option>₹5–25 Cr</option>
              <option>₹25–100 Cr</option>
              <option>₹100+ Cr</option>
            </select>
          </Field>
          <Field label="Years in operation">
            <input type="number" min="0" className={inputClass} placeholder="e.g. 12" />
          </Field>
        </div>
        <div className="mt-5">
          <Field label="Notable completed projects">
            <textarea
              rows={3}
              className={inputClass}
              placeholder="Project name, location, value — one per line"
            />
          </Field>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        This information helps qualify your company for Bid Board invitations once that
        network opens. Nothing here is published on your public profile without your review.
      </p>

      <button
        type="submit"
        className="rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light"
      >
        Submit Qualification
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
