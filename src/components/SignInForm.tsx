"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { notifySessionChange } from "@/lib/use-session";
import { appSignupUrl, type ProductKey } from "@/lib/app-links";
import { COUNTRIES, ROLE_LABELS, dialCodeFor, marketForCountry } from "@/lib/roles";


export type SignUpIntent = "company" | "contacts" | "tender";

interface Details {
  name: string;
  email: string;
  phone: string;
  role: string;
  country: string;
  companyName: string;
  city: string;
}

const RESEND_SECONDS = 30;

export default function SignInForm({
  intent = "company",
  next,
  product,
  appNext,
  publish,
}: {
  intent?: SignUpIntent;
  next?: string;
  /** A Bidcore product sign-up: once the email is verified (and saved here and in the BidcoreAI India database) the person continues in the BidcoreAI sign-up. */
  product?: ProductKey;
  appNext?: string;
  /** The person came from "Publish a tender": the BidcoreAI sign-up is told, so it can start them as a publisher. */
  publish?: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<"details" | "code" | "done">("details");
  const [details, setDetails] = useState<Details | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  // true when an SMS code was also sent to an Indian (+91) mobile number
  const [phoneRequired, setPhoneRequired] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [country, setCountry] = useState("IN");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function requestCode(d: Details): Promise<boolean> {
    setFormError("");
    setBusy(true);
    try {
      const res = await fetch("/api/signup/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d, intent }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.field === "email") setEmailError(json.error);
        else setFormError(json.error ?? "Something went wrong. Please try again.");
        return false;
      }
      setPhoneRequired(json.phoneRequired === true);
      setPhoneCode("");
      setCooldown(RESEND_SECONDS);
      return true;
    } catch {
      setFormError("Couldn't reach the server. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleDetails(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const dial = dialCodeFor(country);
    const d: Details = {
      name,
      email,
      phone: (dial ? `${dial} ` : "") + phone.trim(),
      role: String(data.get("role") ?? ""),
      country: marketForCountry(country),
      companyName: String(data.get("companyName") ?? ""),
      city: String(data.get("city") ?? ""),
    };
    if (await requestCode(d)) {
      setDetails(d);
      setCode("");
      setStep("code");
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    if (!details) return;
    setFormError("");
    setBusy(true);
    try {
      const res = await fetch("/api/signup/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: details.email, code, phoneCode: phoneRequired ? phoneCode : undefined, startTenderTrial: intent === "tender" && !product }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? "Verification failed. Please try again.");
        return;
      }
      notifySessionChange();
      if (product) {
        // Hand over to the BidcoreAI sign-up (India preselected, product remembered, details filled in).
        window.location.href = appSignupUrl(product, { name: details.name, email: details.email, company: details.companyName, phone: details.phone, next: appNext, intent: publish ? "publish" : undefined, market: details.country, role: details.role, vt: json.handoff ?? undefined });
        return;
      }
      if (next) {
        router.push(next);
        return;
      }
      setStep("done");
    } catch {
      setFormError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "done") {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-8 text-center">
        <h2 className="text-lg font-semibold text-emerald-800">
          {name ? `Welcome, ${name.split(" ")[0]}.` : "You're in."}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-emerald-700">
          Your details are verified and you&apos;re signed in. Contact details are now visible across
          the Bidcore directory.
        </p>
        <Link
          href="/companies"
          className="mt-5 inline-block rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light"
        >
          Browse Companies
        </Link>
      </div>
    );
  }

  if (step === "code" && details) {
    return (
      <form onSubmit={handleVerify} className="space-y-5">
        <div className="rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-700">
          We emailed a 6-digit code to <span className="font-semibold">{details.email}</span>
          {phoneRequired && (
            <>
              {" "}
              and sent an SMS code to <span className="font-semibold">{details.phone}</span>
            </>
          )}
          . {phoneRequired ? "Both expire" : "It expires"} in 10 minutes.
        </div>
        <Field label={phoneRequired ? "Email verification code" : "Verification code"} required>
          <input
            required
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className={`${inputClass} text-center text-lg tracking-[0.5em]`}
            placeholder="······"
          />
        </Field>
        {phoneRequired && (
          <Field label="Mobile (SMS) verification code" required>
            <input
              required
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="\d{6}"
              maxLength={6}
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value.replace(/\D/g, ""))}
              className={`${inputClass} text-center text-lg tracking-[0.5em]`}
              placeholder="······"
            />
          </Field>
        )}
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={busy || code.length !== 6 || (phoneRequired && phoneCode.length !== 6)}
            className="rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light disabled:opacity-60"
          >
            {busy ? "Verifying..." : "Verify & Continue"}
          </button>
          <button
            type="button"
            disabled={busy || cooldown > 0}
            onClick={() => details && requestCode(details)}
            className="text-sm font-medium text-slate-600 hover:text-brand-accent disabled:opacity-50"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("details");
              setFormError("");
            }}
            className="text-sm font-medium text-slate-600 hover:text-brand-accent"
          >
            Change email
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleDetails} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Full name" required>
          <input
            required
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
            placeholder="Your name"
          />
        </Field>
        <Field label="Email" required>
          <input
            required
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`${inputClass} ${emailError ? "border-red-400" : ""}`}
            placeholder="you@example.com"
          />
          {emailError && <p className="mt-1.5 text-xs text-red-600">{emailError}</p>}
        </Field>
        <Field label="Phone" required>
          <div className="flex">
            {dialCodeFor(country) && (
              <span className="flex items-center rounded-l-md border border-r-0 border-slate-300 bg-slate-50 px-3 text-sm text-slate-500">
                {dialCodeFor(country)}
              </span>
            )}
            <input
              required
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={`${inputClass} ${dialCodeFor(country) ? "rounded-l-none" : ""}`}
              placeholder="Mobile number"
            />
          </div>
        </Field>
        <Field label="Country" required>
          <select
            required
            name="country"
            className={inputClass}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="I am a" required>
          <select required name="role" className={inputClass} defaultValue="">
            <option value="" disabled>
              Select who you are
            </option>
            {ROLE_LABELS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Company name" required>
          <input required name="companyName" type="text" className={inputClass} placeholder="Your company" />
        </Field>
        {intent === "company" && (
          <Field label="City" required>
            <input required name="city" type="text" className={inputClass} placeholder="e.g. Chennai" />
          </Field>
        )}
      </div>

      <p className="text-xs text-slate-500">
        {intent !== "tender" && country === "IN"
          ? "We'll send a code to your email and an SMS code to your mobile number to confirm both are yours."
          : "We'll email you a code to confirm the address is yours."}
      </p>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light disabled:opacity-60"
      >
        {busy
          ? "Sending code..."
          : intent === "tender"
            ? "Start Free"
            : intent === "contacts"
              ? "Add My Details"
              : "Add Company Details"}
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
