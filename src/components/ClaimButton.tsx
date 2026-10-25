"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/lib/use-session";

const buttonClass =
  "rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-navy hover:text-brand-navy disabled:opacity-60";

export default function ClaimButton({
  stateSlug,
  slug,
  claimed,
  isOwner,
}: {
  stateSlug: string;
  slug: string;
  claimed: boolean;
  isOwner: boolean;
}) {
  const router = useRouter();
  const session = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const profilePath = `/companies/${stateSlug}/${slug}`;

  if (isOwner) {
    return (
      <Link href={`${profilePath}/edit`} className={buttonClass}>
        Update Information
      </Link>
    );
  }
  if (claimed) return null;

  async function claim() {
    setError("");
    setBusy(true);
    try {
      const res = await fetch("/api/companies/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: stateSlug, slug }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't claim this company.");
        return;
      }
      router.push(`${profilePath}/edit`);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (session === null) {
    return (
      <Link href={`/login?next=${encodeURIComponent(profilePath)}`} className={buttonClass}>
        Claim Company
      </Link>
    );
  }

  return (
    <div>
      <button onClick={claim} disabled={busy || session === undefined} className={buttonClass}>
        {busy ? "Claiming..." : "Claim Company"}
      </button>
      {error && <p className="mt-2 max-w-xs text-xs text-red-600">{error}</p>}
    </div>
  );
}
