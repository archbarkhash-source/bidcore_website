"use client";

import Link from "next/link";
import { useState } from "react";
import { Lock } from "lucide-react";
import { notifySessionChange, useSession } from "@/lib/use-session";
import { signUpHref } from "@/lib/app-links";

const TRIAL_DAYS = 7;

export default function TenderInviteGate({
  companySlug,
  children,
}: {
  companySlug?: string;
  children: React.ReactNode;
}) {
  const session = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function startTrial() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/tender-trial", { method: "POST" });
      if (!res.ok) throw new Error();
      notifySessionChange();
    } catch {
      setError("Couldn't start your trial. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (session === undefined) return <p className="text-sm text-slate-400">Loading...</p>;

  if (session === null) {
    return (
      <GateCard
        title="Tender Connect is a members feature"
        body="Sign up to publish tenders and invite contractors to bid — your first tender invite is free."
      >
        <Link
          href={signUpHref("tender-connect", companySlug ? { company: companySlug } : undefined)}
          className={buttonClass}
        >
          Start Free
        </Link>
        <p className="mt-3 text-sm text-slate-500">
          Already a member?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(`/send-tender-invite${companySlug ? `?company=${companySlug}` : ""}`)}`}
            className="font-medium text-brand-accent hover:underline"
          >
            Sign in
          </Link>
        </p>
      </GateCard>
    );
  }

  if (!session.tenderTrialStartedAt) {
    return (
      <GateCard
        title="Start your Tender Connect free trial"
        body="Start a 7-day free trial, no credit card required. Sign up to see pricing."
      >
        <button onClick={startTrial} disabled={busy} className={`${buttonClass} disabled:opacity-60`}>
          {busy ? "Starting..." : "Start Free"}
        </button>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </GateCard>
    );
  }

  const trialEnds = new Date(session.tenderTrialStartedAt).getTime() + TRIAL_DAYS * 86_400_000;
  if (Date.now() > trialEnds) {
    return (
      <GateCard
        title="Your free trial has ended"
        body="Choose a plan to keep sending tender invites. Sign up to see pricing."
      >
        <Link href="/pricing" className={buttonClass}>
          View Pricing
        </Link>
      </GateCard>
    );
  }

  return <>{children}</>;
}

const buttonClass =
  "mt-4 inline-block rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light";

function GateCard({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <Lock className="mx-auto h-6 w-6 text-slate-400" />
      <h2 className="mt-3 font-semibold text-brand-navy">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">{body}</p>
      {children}
    </div>
  );
}
