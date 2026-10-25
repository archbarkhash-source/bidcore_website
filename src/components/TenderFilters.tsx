"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useRef, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";

export interface FilterValues {
  q?: string;
  keywords?: string;
  role?: string;
  state?: string;
  city?: string;
  organization?: string;
  category?: string;
  value_min?: string;
  value_max?: string;
  closing_within_days?: string;
  status: string;
  sort: string;
}

const KEYWORD_SUGGESTIONS = [
  "Waterproofing", "Plastering", "Painting", "Flooring", "Glazing", "Shuttering", "Steel fabrication", "Earthwork",
  "Electrical", "Plumbing", "HVAC", "Fire fighting", "Interiors", "Landscaping",
];

export default function TenderFilters({
  values,
  states,
  categories,
}: {
  values: FilterValues;
  states: string[];
  categories: string[];
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  // "I am a": the choice rides in the address (?role=sub), so it carries across every search without storing anything
  const [role, setRole] = useState<"contractor" | "sub">(values.role === "sub" || values.keywords ? "sub" : "contractor");
  const [keywords, setKeywords] = useState<string[]>((values.keywords ?? "").split(",").map((k) => k.trim()).filter(Boolean));
  const [kwInput, setKwInput] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [category, setCategory] = useState(values.category ?? "");

  const pickRole = (r: "contractor" | "sub") => setRole(r);

  const submit = () => formRef.current?.requestSubmit();
  const addKeyword = (raw: string) => {
    const parts = raw.split(/[,;\n]+/).map((k) => k.trim()).filter(Boolean);
    if (!parts.length) return;
    setKeywords((cur) => {
      const next = [...cur];
      for (const p of parts) if (next.length < 10 && !next.some((k) => k.toLowerCase() === p.toLowerCase())) next.push(p.slice(0, 40));
      return next;
    });
    setKwInput("");
  };
  const onKwKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addKeyword(kwInput);
    } else if (e.key === "Backspace" && !kwInput && keywords.length) setKeywords((k) => k.slice(0, -1));
  };
  const onSubmit = (e: FormEvent) => {
    if (kwInput.trim()) {
      // a keyword typed but not yet added still counts
      e.preventDefault();
      const extra = kwInput;
      setKwInput("");
      setKeywords((cur) => [...cur, ...extra.split(/[,;]+/).map((k) => k.trim()).filter(Boolean)].slice(0, 10));
      setTimeout(submit, 0);
    }
  };

  const shownCategories = categories.filter((c) => c.toLowerCase().includes(catSearch.trim().toLowerCase()));
  const field =
    "mt-1 w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-900 outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10";
  const label = "block text-xs font-semibold uppercase tracking-wide text-slate-500";

  return (
    <aside className="lg:sticky lg:top-20 lg:self-start">
      <button
        type="button"
        onClick={() => setMobileOpen((o) => !o)}
        className="mb-3 flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 lg:hidden"
        aria-expanded={mobileOpen}
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" /> Filters
        </span>
        <span className="text-slate-400">{mobileOpen ? "Hide" : "Show"}</span>
      </button>

      <form
        id="tender-filters"
        ref={formRef}
        method="get"
        action="/tenders"
        onSubmit={onSubmit}
        className={`${mobileOpen ? "block" : "hidden"} space-y-5 rounded-lg border border-slate-200 bg-white p-4 lg:block`}
      >
        <input type="hidden" name="role" value={role === "sub" ? "sub" : "gc"} />
        <input type="hidden" name="keywords" value={role === "sub" ? keywords.join(",") : ""} />

        <div>
          <span className={label}>I am a</span>
          <div className="mt-1.5 grid grid-cols-2 rounded-md bg-slate-100 p-0.5 text-sm font-medium">
            {(
              [
                ["contractor", "General Contractor"],
                ["sub", "Subcontractor"],
              ] as const
            ).map(([k, t]) => (
              <button
                key={k}
                type="button"
                onClick={() => pickRole(k)}
                aria-pressed={role === k}
                className={`rounded px-2 py-1.5 transition ${role === k ? "bg-white text-brand-navy shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <label className={label}>
          Search
          <span className="relative mt-1 block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input name="q" defaultValue={values.q} placeholder="Title, reference or organisation" className={`${field} !mt-0 pl-8`} />
          </span>
        </label>

        {role === "sub" && (
          <div>
            <span className={label}>Keywords</span>
            <div className="mt-1 flex flex-wrap gap-1.5 rounded-md border border-slate-300 bg-white p-1.5 focus-within:border-brand-navy focus-within:ring-2 focus-within:ring-brand-navy/10">
              {keywords.map((k) => (
                <span key={k} className="inline-flex items-center gap-1 rounded-full bg-brand-accent/10 px-2.5 py-0.5 text-xs font-medium text-brand-accent">
                  {k}
                  <button type="button" onClick={() => setKeywords((cur) => cur.filter((x) => x !== k))} aria-label={`Remove ${k}`}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
              <input
                value={kwInput}
                onChange={(e) => setKwInput(e.target.value)}
                onKeyDown={onKwKey}
                onBlur={() => addKeyword(kwInput)}
                placeholder={keywords.length ? "Add another…" : "e.g. waterproofing"}
                className="min-w-[7rem] flex-1 bg-transparent px-1.5 py-1 text-sm outline-none"
              />
            </div>
            <p className="mt-1 text-xs text-slate-500">Shows tenders that mention any of your keywords (press Enter to add).</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {KEYWORD_SUGGESTIONS.filter((s) => !keywords.some((k) => k.toLowerCase() === s.toLowerCase()))
                .slice(0, 8)
                .map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addKeyword(s)}
                    className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs text-slate-600 hover:border-brand-accent hover:text-brand-accent"
                  >
                    + {s}
                  </button>
                ))}
            </div>
          </div>
        )}

        <div>
          <span className={label}>Work category</span>
          <input
            value={catSearch}
            onChange={(e) => setCatSearch(e.target.value)}
            placeholder="Search categories"
            aria-label="Search categories"
            className={field}
          />
          <div className="mt-2 max-h-52 space-y-0.5 overflow-y-auto pr-1" role="radiogroup" aria-label="Work category">
            {(!catSearch.trim() ? ["", ...shownCategories] : shownCategories).map((c) => (
              <label key={c || "all"} className={`flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm ${category === c ? "bg-slate-100 font-medium text-brand-navy" : "text-slate-700 hover:bg-slate-50"}`}>
                <input
                  type="radio"
                  name="category"
                  value={c}
                  checked={category === c}
                  onChange={() => {
                    setCategory(c);
                    setTimeout(submit, 0);
                  }}
                  className="accent-brand-navy"
                />
                {c || "All categories"}
              </label>
            ))}
            {catSearch.trim() && shownCategories.length === 0 && <p className="px-2 py-1 text-xs text-slate-500">No category matches.</p>}
          </div>
        </div>

        <label className={label}>
          State
          <select name="state" defaultValue={values.state ?? ""} onChange={submit} className={field}>
            <option value="">Any</option>
            {states.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label className={label}>
          City
          <input name="city" defaultValue={values.city} className={field} />
        </label>
        <label className={label}>
          Organisation / department
          <input name="organization" defaultValue={values.organization} className={field} />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className={label}>
            Min ₹
            <input name="value_min" inputMode="numeric" defaultValue={values.value_min} className={field} />
          </label>
          <label className={label}>
            Max ₹
            <input name="value_max" inputMode="numeric" defaultValue={values.value_max} className={field} />
          </label>
        </div>
        <label className={label}>
          Closing
          <select name="closing_within_days" defaultValue={values.closing_within_days ?? ""} onChange={submit} className={field}>
            <option value="">Any</option>
            {["7", "15", "30"].map((d) => (
              <option key={d} value={d}>
                Within {d} days
              </option>
            ))}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className={label}>
            Status
            <select name="status" defaultValue={values.status} onChange={submit} className={field}>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="all">All</option>
            </select>
          </label>
          <label className={label}>
            Sort by
            <select name="sort" defaultValue={values.sort} onChange={submit} className={field}>
              <option value="newest">Newest</option>
              <option value="closing_soon">Closing soon</option>
              <option value="relevance">Relevance</option>
            </select>
          </label>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button className="flex-1 rounded-md bg-brand-navy px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">Apply filters</button>
          <Link href="/tenders" className="text-sm text-slate-500 hover:text-brand-accent">
            Reset
          </Link>
        </div>
      </form>
    </aside>
  );
}
