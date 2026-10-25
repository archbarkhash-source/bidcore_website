"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

interface Contact {
  phone: string | null;
  email: string | null;
  address: string | null;
  pinCode: string | null;
}

// Contact details are loaded only for signed-in members, so they are not part of the cached public page.
export default function ContactReveal({ slug, signInHref, initial }: { slug: string; signInHref: string; initial?: Contact }) {
  const [contact, setContact] = useState<Contact | null | undefined>(initial);
  useEffect(() => {
    if (initial) return;
    let off = false;
    fetch(`/api/marketplace/contact?slug=${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => !off && setContact(d?.contact ?? null))
      .catch(() => !off && setContact(null));
    return () => {
      off = true;
    };
  }, [slug, initial]);

  if (contact === undefined) return <p className="text-sm text-slate-400">Loading…</p>;
  if (contact === null)
    return (
      <p className="text-sm text-slate-600">
        <Link href={signInHref} className="font-medium text-brand-accent hover:underline">
          Sign in with your business email
        </Link>{" "}
        to view this company&apos;s contact details.
      </p>
    );
  const has = contact.phone || contact.email || contact.address;
  if (!has) return <p className="text-sm text-slate-500">This company has not published contact details. Use the enquiry form.</p>;
  return (
    <ul className="space-y-2 text-sm text-slate-700">
      {contact.address && (
        <li className="flex gap-2">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> {[contact.address, contact.pinCode].filter(Boolean).join(" - ")}
        </li>
      )}
      {contact.phone && (
        <li className="flex gap-2">
          <Phone className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> <a href={`tel:${contact.phone}`} className="hover:text-brand-accent">{contact.phone}</a>
        </li>
      )}
      {contact.email && (
        <li className="flex gap-2">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> <a href={`mailto:${contact.email}`} className="break-all hover:text-brand-accent">{contact.email}</a>
        </li>
      )}
    </ul>
  );
}
