"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { useSession } from "@/lib/use-session";

export interface MaskedContact {
  phone: string | null;
  email: string | null;
  address: string | null;
}

interface RealContact extends MaskedContact {
  website: string | null;
}

// Contact block of a Bidcore directory company. Visitors see the masked copy from the public API (blurred); a signed-in member opens the real values, which
// are fetched on request and never part of the cached page.
export default function DirectoryContact({ slug, masked }: { slug: string; masked: MaskedContact }) {
  const session = useSession();
  const [real, setReal] = useState<RealContact | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reveal() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/contractors/contact?slug=${encodeURIComponent(slug)}`);
      const body = await res.json().catch(() => ({}));
      if (res.ok) setReal(body.contact);
      else setError(body.error ?? "Contact details are not available right now.");
    } catch {
      setError("Contact details are not available right now.");
    } finally {
      setBusy(false);
    }
  }

  const shown = real ?? masked;
  const blurred = real ? "" : "select-none blur-[5px]";
  const next = `/company/${slug}`;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-semibold text-slate-900">Contact</h2>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        {shown.phone && (
          <li className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-slate-400" />
            {real ? <a href={`tel:${shown.phone.replace(/\s/g, "")}`} className="hover:text-brand-accent">{shown.phone}</a> : <span aria-hidden className={blurred}>{shown.phone}</span>}
          </li>
        )}
        {shown.email && (
          <li className="flex items-center gap-2">
            <Mail className="h-4 w-4 shrink-0 text-slate-400" />
            {real ? <a href={`mailto:${shown.email}`} className="break-all hover:text-brand-accent">{shown.email}</a> : <span aria-hidden className={blurred}>{shown.email}</span>}
          </li>
        )}
        {shown.address && (
          <li className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span aria-hidden={!real} className={blurred}>{shown.address}</span>
          </li>
        )}
      </ul>

      {!real && session === null && (
        <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-600">
          <Link href={`/sign-in?intent=contacts&next=${encodeURIComponent(next)}`} className="font-semibold text-brand-accent hover:underline">
            Sign up free to view contact
          </Link>{" "}
          — verify your email and mobile number once and see contact details across the Bidcore directory. Already a member?{" "}
          <Link href="/login" className="font-medium text-brand-accent hover:underline">
            Sign in
          </Link>
          .
        </div>
      )}
      {!real && session && (
        <button
          type="button"
          onClick={reveal}
          disabled={busy}
          className="mt-4 rounded-full bg-brand-navy px-5 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "Opening…" : "View contact"}
        </button>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      <p className="mt-4 text-xs text-slate-400">Business contact details as the company publishes them. Not your company? Tell us and we will remove or correct it.</p>
    </div>
  );
}
