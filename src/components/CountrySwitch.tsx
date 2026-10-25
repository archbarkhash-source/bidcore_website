"use client";

import { useEffect, useRef } from "react";
import { Globe } from "lucide-react";

// Bidcore.in serves India; the BidcoreAI website serves the United States. Choosing the other country goes straight to that site.
const US_SITE_URL = (process.env.NEXT_PUBLIC_US_SITE_URL ?? "https://www.bidcoreai.com").replace(/\/$/, "");

export default function CountrySwitch({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLSelectElement>(null);

  // Coming back with the browser's back button must show this site's own country again, not the one that was just picked.
  useEffect(() => {
    const reset = () => {
      if (ref.current) ref.current.value = "IN";
    };
    window.addEventListener("pageshow", reset);
    return () => window.removeEventListener("pageshow", reset);
  }, []);

  return (
    <label className={`inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700 ${className}`} title="Country / region">
      <Globe className="h-4 w-4" aria-hidden />
      <select
        ref={ref}
        defaultValue="IN"
        aria-label="Country or region"
        onChange={(e) => {
          if (e.target.value === "US") window.location.href = US_SITE_URL;
        }}
        className="cursor-pointer rounded-sm bg-transparent py-0.5 pr-1 text-sm font-semibold text-slate-700 outline-none hover:text-brand-accent focus-visible:ring-2 focus-visible:ring-brand-navy/30"
      >
        <option value="IN">IN</option>
        <option value="US">US</option>
      </select>
    </label>
  );
}
