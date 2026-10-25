"use client";

import { FormEvent, useState } from "react";
import { BUSINESS_EMAIL_MESSAGE, isBusinessEmail } from "@/lib/email-domain";

export default function InviteToBidcoreForm({
  defaultCompanyName,
}: {
  defaultCompanyName?: string;
}) {
  const [submitted, setSubmitted] = useState(false);
  const [emailError, setEmailError] = useState("");

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    if (!isBusinessEmail(email)) {
      setEmailError(BUSINESS_EMAIL_MESSAGE);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="text-lg font-semibold text-emerald-800">Invite sent.</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-emerald-700">
          They&apos;ll get an email to join Bidcore. Once they do, you&apos;ll be able to send
          them tender invites directly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Company name" required>
        <input
          required
          type="text"
          defaultValue={defaultCompanyName}
          className={inputClass}
          placeholder="Company you want to invite"
        />
      </Field>
      <Field label="Their email" required>
        <input
          required
          type="email"
          name="email"
          className={inputClass}
          placeholder="contact@theircompany.com"
          onChange={(e) =>
            setEmailError(
              e.target.value && !isBusinessEmail(e.target.value.trim()) ? BUSINESS_EMAIL_MESSAGE : "",
            )
          }
        />
        {emailError && <p className="mt-1.5 text-xs text-red-600">{emailError}</p>}
      </Field>
      <Field label="Message">
        <textarea rows={3} className={inputClass} placeholder="Optional note" />
      </Field>
      <button
        type="submit"
        className="rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light"
      >
        Send Invite
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
