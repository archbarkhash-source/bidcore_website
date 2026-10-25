"use client";

import { FormEvent, useState } from "react";
import { UNITS } from "@/lib/marketplace/constants";
import { Field, inputClass } from "./ui";

interface Props {
  listingId?: string;
  companyId: string;
  kind: "product" | "service" | "company";
  /** what the enquiry is about, shown as the form title */
  subject: string;
  supplierName: string;
  defaults?: { name?: string; company?: string };
}

export default function EnquiryForm({ listingId, companyId, kind, subject, supplierName, defaults }: Props) {
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");
  const [ref, setRef] = useState("");
  const [error, setError] = useState<{ message: string; field?: string } | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = Object.fromEntries(fd.entries());
    body.consent = fd.get("consent") === "on";
    body.listingId = listingId;
    body.companyId = companyId;
    setState("sending");
    setError(null);
    try {
      const res = await fetch("/api/marketplace/enquiries", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ message: json.error ?? "Your enquiry could not be sent.", field: json.field });
        setState("idle");
        return;
      }
      setRef(json.ref);
      setState("done");
    } catch {
      setError({ message: "Network problem. Please try again." });
      setState("idle");
    }
  }

  if (state === "done") {
    return (
      <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-6">
        <h3 className="font-semibold text-emerald-800">Enquiry sent to {supplierName}</h3>
        <p className="mt-1 text-sm text-emerald-700">
          Your reference is <span className="font-mono font-semibold">{ref}</span>. A confirmation has been emailed to you, and the supplier will reply to the email address you gave.
        </p>
      </div>
    );
  }

  const bad = (f: string) => (error?.field === f ? " border-red-400" : "");
  const isService = kind === "service";

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5" aria-label={`Enquiry about ${subject}`}>
      <div>
        <h3 className="font-semibold text-slate-900">{kind === "product" ? "Request a quote" : "Send an enquiry"}</h3>
        <p className="text-sm text-slate-500">{subject}</p>
      </div>
      {/* honeypot: hidden from people, filled by bots */}
      <div className="hidden" aria-hidden>
        <label>
          Leave this empty <input name="trap" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Your name *">
          <input name="name" required defaultValue={defaults?.name} maxLength={120} autoComplete="name" className={inputClass + bad("name")} />
        </Field>
        <Field label="Your company">
          <input name="company" defaultValue={defaults?.company} maxLength={160} autoComplete="organization" className={inputClass} />
        </Field>
        <Field label="Business email *">
          <input name="email" type="email" required maxLength={200} autoComplete="email" className={inputClass + bad("email")} />
        </Field>
        <Field label="Phone">
          <input name="phone" type="tel" maxLength={40} autoComplete="tel" className={inputClass + bad("phone")} />
        </Field>
        {kind === "product" && (
          <div className="grid grid-cols-[1fr_7rem] gap-2">
            <Field label="Quantity needed">
              <input name="quantity" maxLength={60} className={inputClass} />
            </Field>
            <Field label="Unit">
              <select name="unit" className={inputClass} defaultValue="">
                <option value="">—</option>
                {UNITS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </select>
            </Field>
          </div>
        )}
        {isService && (
          <Field label="Project type">
            <input name="projectType" maxLength={120} placeholder="e.g. Highway, Building, Industrial" className={inputClass} />
          </Field>
        )}
        <Field label={isService ? "Project location" : "Delivery location"}>
          <input name="location" maxLength={160} placeholder="City, state" className={inputClass} />
        </Field>
        <Field label={isService ? "Expected start date" : "Needed by"}>
          <input name="timeline" maxLength={120} placeholder={isService ? "e.g. March 2027" : "e.g. within 2 weeks"} className={inputClass} />
        </Field>
      </div>
      <Field label={isService ? "Scope and requirements *" : "Your requirement *"} hint="Specifications, grade, size, scope — whatever the supplier needs to reply with a useful answer.">
        <textarea name="message" required minLength={20} maxLength={3000} rows={5} className={inputClass + bad("message")} />
      </Field>
      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input type="checkbox" name="consent" required className="mt-1" />
        <span>
          I understand that my name, company, email{" "}
          <span className="text-slate-500">and phone (if given)</span> and this requirement will be shared with {supplierName}, who may contact me about it.
        </span>
      </label>
      {error && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {error.message}
        </p>
      )}
      <button disabled={state === "sending"} className="rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-accent-light disabled:opacity-60">
        {state === "sending" ? "Sending…" : kind === "product" ? "Request quote" : "Send enquiry"}
      </button>
    </form>
  );
}
