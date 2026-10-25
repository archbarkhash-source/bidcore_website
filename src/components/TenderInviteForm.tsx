"use client";

import { FormEvent, useState } from "react";
import { Paperclip } from "lucide-react";

const TRADES = [
  "General Contracting",
  "Civil",
  "Structural",
  "Electrical",
  "Plumbing",
  "MEP",
  "HVAC",
  "Interior / Finishes",
  "Carpentry",
  "Painting",
  "Roofing",
  "Masonry",
  "Landscaping",
  "Other",
];

export default function TenderInviteForm({ companyName }: { companyName?: string }) {
  const [submitted, setSubmitted] = useState(false);
  const [trade, setTrade] = useState("");
  const [files, setFiles] = useState<File[]>([]);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="text-lg font-semibold text-emerald-800">Tender invite sent.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-emerald-700">
          {companyName ? `${companyName} has` : "The company has"} been notified and can
          respond once they join Bidcore.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Project name" required>
        <input required type="text" className={inputClass} placeholder="e.g. Whitefield Tech Park" />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Tender package / trade" required>
          <select
            required
            value={trade}
            onChange={(e) => setTrade(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>
              Select a trade
            </option>
            {TRADES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {trade === "Other" && (
            <input
              required
              type="text"
              className={`${inputClass} mt-2`}
              placeholder="Enter the trade or tender package"
            />
          )}
        </Field>
        <Field label="Tender due date" required>
          <input required type="date" className={inputClass} />
        </Field>
      </div>

      <Field label="Scope of work">
        <textarea rows={4} className={inputClass} placeholder="Describe the scope for this tender package" />
      </Field>

      <Field label="Documents">
        <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3.5 py-3 text-sm text-slate-600 transition hover:border-brand-navy hover:text-brand-navy">
          <Paperclip className="h-4 w-4 shrink-0 text-slate-400" />
          <span>
            {files.length > 0
              ? `${files.length} file${files.length > 1 ? "s" : ""} attached`
              : "Attach drawings, specs or other documents"}
          </span>
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
        </label>
        {files.length > 0 && (
          <ul className="mt-2 space-y-1">
            {files.map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-slate-500">
                <Paperclip className="h-3 w-3 text-slate-400" />
                {f.name}
              </li>
            ))}
          </ul>
        )}
      </Field>

      <Field label="Or share a document link">
        <input
          type="url"
          name="documentLink"
          className={inputClass}
          placeholder="https://drive.google.com/... (Google Drive, OneDrive, Dropbox)"
        />
        <p className="mt-1.5 text-xs text-slate-500">
          Files too heavy to attach? Paste a shared link instead, and make sure the link is
          viewable by anyone with it.
        </p>
      </Field>

      <Field label="Message">
        <textarea rows={3} className={inputClass} placeholder="Add a note for the recipient" />
      </Field>

      <button
        type="submit"
        className="rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light"
      >
        Send Tender Invite
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
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
