"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2, CheckCircle2, ChevronLeft, ChevronRight, ExternalLink, Mail } from "lucide-react";
import { Company, CompanyType } from "@/lib/types";
import { CITIES, COMPANY_TYPES, STATES, getState } from "@/lib/data";
import SaveButton from "@/components/SaveButton";
import StatusBadge from "@/components/StatusBadge";
import { useSession } from "@/lib/use-session";

export default function CompanyDirectory({
  companies,
  total,
  page,
  pageCount,
  pageSize,
  showStateFilter = false,
  showCityFilter = false,
  cityOptions,
  lockedType,
}: {
  companies: Company[];
  total: number;
  page: number;
  pageCount: number;
  pageSize: number;
  showStateFilter?: boolean;
  showCityFilter?: boolean;
  cityOptions?: { slug: string; name: string }[];
  lockedType?: CompanyType;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session = useSession();

  const type = searchParams.get("type") ?? "";
  const city = searchParams.get("city") ?? "";
  const state = searchParams.get("state") ?? "";
  const verifiedOnly = searchParams.get("verified") === "1";
  const activeOnly = searchParams.get("active") === "1";
  const sort = searchParams.get("sort") ?? "name";

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    const qs = params.toString();
    router.push(qs ? `?${qs}` : "?", { scroll: false });
  }

  function onSearch(value: string) {
    setSearch(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setParam("q", value.trim()), 350);
  }

  const cities = cityOptions ?? CITIES;
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search companies..."
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/15"
          />
        </div>

        {showStateFilter && (
          <select value={state} onChange={(e) => setParam("state", e.target.value)} className={selectClass}>
            <option value="">All States</option>
            {STATES.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        )}

        {showCityFilter && (
          <select value={city} onChange={(e) => setParam("city", e.target.value)} className={selectClass}>
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {!lockedType && (
          <select value={type} onChange={(e) => setParam("type", e.target.value)} className={selectClass}>
            <option value="">All Company Types</option>
            {COMPANY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        )}

        <select value={sort} onChange={(e) => setParam("sort", e.target.value)} className={selectClass}>
          <option value="name">Sort: Name</option>
          <option value="verified">Sort: Verified First</option>
        </select>

        <label className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setParam("active", e.target.checked ? "1" : "")}
            className="h-3.5 w-3.5 accent-brand-navy"
          />
          Active only
        </label>

        <label className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(e) => setParam("verified", e.target.checked ? "1" : "")}
            className="h-3.5 w-3.5 accent-brand-navy"
          />
          Verified only
        </label>
      </div>

      <p className="mt-4 text-sm text-slate-500">
        {total.toLocaleString("en-IN")} {total === 1 ? "company" : "companies"}
      </p>

      <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
        {companies.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <h2 className="text-base font-semibold text-slate-900">No companies match</h2>
            <p className="mt-1 text-sm text-slate-500">Try adjusting filters or search terms.</p>
            <p className="mt-4 text-sm text-slate-500">
              Don&apos;t see the company you&apos;re looking for?{" "}
              <Link href="/invite" className="font-medium text-brand-accent hover:underline">
                Invite them to Bidcore
              </Link>
            </p>
          </div>
        ) : (
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="w-12 px-4 py-3 font-medium" aria-hidden="true"></th>
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Company Type</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Company Status</th>
                <th className="px-4 py-3 font-medium">Verification</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {companies.map((company) => {
                const stateName = getState(company.stateSlug)?.name ?? company.stateSlug;
                const location = company.cityName ? `${company.cityName}, ${stateName}` : stateName;
                return (
                  <tr key={`${company.stateSlug}/${company.slug}`} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-400">
                        <Building2 className="h-4 w-4" />
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/companies/${company.stateSlug}/${company.slug}`}
                        className="font-medium text-slate-900 hover:text-brand-navy"
                      >
                        {company.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{company.type}</td>
                    <td className="px-4 py-3 text-slate-600">{location}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={company.registry?.status} />
                    </td>
                    <td className="px-4 py-3">
                      {company.verified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">Unverified</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={
                          session
                            ? `/companies/${company.stateSlug}/${company.slug}?tab=contacts`
                            : "/sign-in?intent=contacts"
                        }
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-accent hover:underline"
                      >
                        <Mail className="h-3.5 w-3.5" />
                        View Contact
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <SaveButton slug={company.slug} />
                        <Link
                          href={`/companies/${company.stateSlug}/${company.slug}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 text-slate-500 hover:border-brand-navy hover:text-brand-navy"
                          aria-label={`View ${company.name}`}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {total > 0 && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500">
          <span>
            Showing {from.toLocaleString("en-IN")}–{to.toLocaleString("en-IN")} of{" "}
            {total.toLocaleString("en-IN")}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setParam("page", String(page - 1))}
              disabled={page <= 1}
              className={pagerClass}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </button>
            <span className="px-1">
              Page {page} of {pageCount.toLocaleString("en-IN")}
            </span>
            <button
              onClick={() => setParam("page", String(page + 1))}
              disabled={page >= pageCount}
              className={pagerClass}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const selectClass =
  "rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-brand-navy";

const pagerClass =
  "inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-brand-navy disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-slate-300";
