"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function SearchBar({
  placeholder = "Search company, contractor, developer, city or state",
  size = "lg",
}: {
  placeholder?: string;
  size?: "lg" | "md";
}) {
  const [value, setValue] = useState("");
  const router = useRouter();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (q) router.push(`/companies?q=${encodeURIComponent(q)}`);
  }

  const padding = size === "lg" ? "py-4 text-base" : "py-2.5 text-sm";

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-2xl items-stretch gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-md border border-slate-300 bg-white px-4 ${padding} text-slate-900 shadow-sm outline-none placeholder:text-slate-400 focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/20`}
      />
      <button
        type="submit"
        className="shrink-0 rounded-md bg-brand-accent px-5 text-sm font-semibold text-white transition hover:bg-brand-accent-light"
      >
        Search
      </button>
    </form>
  );
}
