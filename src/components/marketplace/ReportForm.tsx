"use client";

import { FormEvent, useState } from "react";
import { REPORT_REASONS } from "@/lib/marketplace/constants";
import { inputClass } from "./ui";

// Abuse reports, corrections and removal requests. Goes to the admin queue (/admin/marketplace/reports).
export default function ReportForm({ targetType, targetId }: { targetType: "company" | "listing"; targetId: string }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [error, setError] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setState("sending");
    setError("");
    const res = await fetch("/api/marketplace/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetType, targetId, reason: fd.get("reason"), detail: fd.get("detail"), email: fd.get("email"), trap: fd.get("trap") }),
    }).catch(() => null);
    if (res?.ok) setState("done");
    else {
      setError((await res?.json().catch(() => ({})))?.error ?? "Could not send the report. Please try again.");
      setState("idle");
    }
  }

  if (state === "done") return <p className="text-sm text-emerald-700">Thank you — our team will review this.</p>;
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm text-slate-500 underline hover:text-slate-800">
        Report a problem or request a correction / removal
      </button>
    );
  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 text-sm">
      <input name="trap" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="block">
        <span className="font-medium text-slate-700">What is the problem?</span>
        <select name="reason" className={`${inputClass} mt-1`} defaultValue="incorrect_info">
          {REPORT_REASONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="font-medium text-slate-700">Details</span>
        <textarea name="detail" required minLength={10} maxLength={2000} rows={3} className={`${inputClass} mt-1`} placeholder="What should be changed, and why?" />
      </label>
      <label className="block">
        <span className="font-medium text-slate-700">Your email (so we can follow up)</span>
        <input name="email" type="email" className={`${inputClass} mt-1`} />
      </label>
      {error && <p className="font-medium text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button disabled={state === "sending"} className="rounded-md bg-brand-navy px-4 py-2 font-semibold text-white disabled:opacity-60">
          Send report
        </button>
        <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-slate-600">
          Cancel
        </button>
      </div>
    </form>
  );
}
