"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export interface EditableCompany {
  stateSlug: string;
  slug: string;
  about: string;
  phone: string;
  address: string;
  sizeRange: string;
  specializations: string;
  operatingLocations: string;
}

const splitList = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export default function CompanyEditForm({ company }: { company: EditableCompany }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const profilePath = `/companies/${company.stateSlug}/${company.slug}`;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const data = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/companies/update", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: company.stateSlug,
          slug: company.slug,
          about: data.get("about"),
          phone: data.get("phone"),
          address: data.get("address"),
          sizeRange: data.get("sizeRange"),
          specializations: splitList(String(data.get("specializations") ?? "")),
          operatingLocations: splitList(String(data.get("operatingLocations") ?? "")),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Couldn't save your changes.");
        return;
      }
      router.push(profilePath);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="About the company">
        <textarea name="about" rows={4} defaultValue={company.about} className={inputClass} maxLength={2000} />
      </Field>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Phone">
          <input name="phone" type="tel" defaultValue={company.phone} className={inputClass} placeholder="+91" />
        </Field>
        <Field label="Company size">
          <input name="sizeRange" defaultValue={company.sizeRange} className={inputClass} placeholder="e.g. 100-250 employees" />
        </Field>
      </div>
      <Field label="Office address">
        <input name="address" defaultValue={company.address} className={inputClass} />
      </Field>
      <Field label="Services / specializations" hint="Separate with commas">
        <input name="specializations" defaultValue={company.specializations} className={inputClass} placeholder="e.g. Roads, Bridges, Water Infrastructure" />
      </Field>
      <Field label="Operating locations" hint="Separate with commas">
        <input name="operatingLocations" defaultValue={company.operatingLocations} className={inputClass} placeholder="e.g. Tamil Nadu, Karnataka" />
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light disabled:opacity-60"
        >
          {busy ? "Saving..." : "Save Changes"}
        </button>
        <Link href={profilePath} className="text-sm font-medium text-slate-600 hover:text-brand-accent">
          Cancel
        </Link>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {hint && <span className="ml-2 text-xs text-slate-400">{hint}</span>}
      <div className="mt-1.5">{children}</div>
    </label>
  );
}
