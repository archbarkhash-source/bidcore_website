"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bookmark } from "lucide-react";
import { Company } from "@/lib/types";
import { getSavedSlugs } from "@/lib/saved";
import CompanyCard from "@/components/CompanyCard";

export default function SavedCompaniesPage() {
  const [slugs, setSlugs] = useState<string[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  useEffect(() => {
    setSlugs(getSavedSlugs());
    const handler = () => setSlugs(getSavedSlugs());
    window.addEventListener("bidcore-saved-change", handler);
    return () => window.removeEventListener("bidcore-saved-change", handler);
  }, []);

  useEffect(() => {
    if (slugs.length === 0) {
      setCompanies([]);
      return;
    }
    fetch(`/api/companies/saved?slugs=${encodeURIComponent(slugs.join(","))}`)
      .then((r) => r.json())
      .then((d) => setCompanies(d.companies ?? []))
      .catch(() => setCompanies([]));
  }, [slugs]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-slate-900">Saved Companies</h1>
      <p className="mt-1 text-sm text-slate-500">
        Companies you&apos;ve bookmarked for later. Saved on this device only.
      </p>

      <div className="mt-6">
        {companies.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <Bookmark className="mx-auto h-8 w-8 text-slate-300" />
            <h2 className="mt-3 text-lg font-semibold text-slate-900">No saved companies yet</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              Save companies while browsing the directory to build your shortlist.
            </p>
            <div className="mt-5">
              <Link
                href="/contractors"
                className="inline-block rounded-md bg-brand-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light"
              >
                Find Contractors
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <CompanyCard key={company.slug} company={company} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
