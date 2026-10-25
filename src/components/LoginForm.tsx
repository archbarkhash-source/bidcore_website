"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { notifySessionChange } from "@/lib/use-session";

const RESEND_SECONDS = 30;

export default function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [noAccount, setNoAccount] = useState(false);
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function sendCode(): Promise<boolean> {
    setError("");
    setNoAccount(false);
    setBusy(true);
    try {
      const res = await fetch("/api/login/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Something went wrong. Please try again.");
        setNoAccount(!!json.noAccount);
        return false;
      }
      setCooldown(RESEND_SECONDS);
      return true;
    } catch {
      setError("Couldn't reach the server. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function handleEmail(e: FormEvent) {
    e.preventDefault();
    if (await sendCode()) {
      setCode("");
      setStep("code");
    }
  }

  async function handleVerify(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/signup/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Verification failed. Please try again.");
        return;
      }
      notifySessionChange();
      router.push(next);
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "code") {
    return (
      <form onSubmit={handleVerify} className="space-y-5">
        <div className="rounded-md bg-slate-100 px-4 py-3 text-sm text-slate-700">
          We emailed a 6-digit code to <span className="font-semibold">{email}</span>. It expires in
          10 minutes.
        </div>
        <label className="block">
          <span className="text-sm font-medium text-slate-700">
            Verification code<span className="text-brand-accent"> *</span>
          </span>
          <input
            required
            autoFocus
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className={`${inputClass} mt-1.5 text-center text-lg tracking-[0.5em]`}
            placeholder="······"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light disabled:opacity-60"
          >
            {busy ? "Verifying..." : "Sign In"}
          </button>
          <button
            type="button"
            disabled={busy || cooldown > 0}
            onClick={() => sendCode()}
            className="text-sm font-medium text-slate-600 hover:text-brand-accent disabled:opacity-50"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setError("");
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
    <form onSubmit={handleEmail} className="space-y-5">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">
          Email<span className="text-brand-accent"> *</span>
        </span>
        <input
          required
          autoFocus
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${inputClass} mt-1.5`}
          placeholder="you@yourcompany.com"
        />
      </label>

      {error && (
        <p className="text-sm text-red-600">
          {error}{" "}
          {noAccount && (
            <Link href="/sign-in" className="font-medium underline">
              Sign up
            </Link>
          )}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light disabled:opacity-60"
      >
        {busy ? "Sending code..." : "Send Code"}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10";
