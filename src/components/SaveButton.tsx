"use client";

import { Bookmark } from "lucide-react";
import { useEffect, useState } from "react";
import { isSaved, toggleSaved } from "@/lib/saved";

export default function SaveButton({
  slug,
  variant = "icon",
}: {
  slug: string;
  variant?: "icon" | "button";
}) {
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setSaved(isSaved(slug));
  }, [slug]);

  function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setSaved(toggleSaved(slug));
  }

  if (variant === "button") {
    return (
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition ${
          saved
            ? "border-brand-navy bg-brand-navy text-white"
            : "border-slate-300 text-slate-700 hover:border-brand-navy hover:text-brand-navy"
        }`}
      >
        <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
        {saved ? "Saved" : "Save"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      aria-label={saved ? "Remove from saved companies" : "Save company"}
      className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition ${
        saved
          ? "border-brand-navy bg-brand-navy text-white"
          : "border-slate-300 text-slate-500 hover:border-brand-navy hover:text-brand-navy"
      }`}
    >
      <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
