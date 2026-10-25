"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DEMO_DAYS, DEMO_MAX_DAYS_AHEAD, toIsoDate } from "@/lib/demo";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** A month calendar where only the live-demo days (Tuesday and Friday, from tomorrow on) can be picked. Writes the choice into the form as `preferredDate` (YYYY-MM-DD). */
export default function DemoCalendar() {
  const [today] = useState(() => startOfDay(new Date()));
  const [view, setView] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [picked, setPicked] = useState("");

  const first = new Date(today.getTime() + 24 * 3600 * 1000); // earliest day: tomorrow
  const last = new Date(today.getFullYear(), today.getMonth(), today.getDate() + DEMO_MAX_DAYS_AHEAD);
  const canGoBack = view > new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoForward = new Date(view.getFullYear(), view.getMonth() + 1, 1) <= last;

  const lead = view.getDay(); // blank cells before the 1st
  const daysInMonth = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => new Date(view.getFullYear(), view.getMonth(), i + 1))];

  const pickedLabel = picked
    ? new Date(`${picked}T00:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
    : "";

  return (
    <div className="rounded-md border border-slate-300 bg-white p-4">
      <input type="hidden" name="preferredDate" value={picked} />
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))}
          disabled={!canGoBack}
          aria-label="Previous month"
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold text-slate-900">
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </p>
        <button
          type="button"
          onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))}
          disabled={!canGoForward}
          aria-label="Next month"
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-500">
        {WEEKDAYS.map((d, i) => (
          <span key={d} className={DEMO_DAYS.includes(i) ? "text-brand-navy" : ""}>
            {d}
          </span>
        ))}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (!d) return <span key={`b${i}`} />;
          const iso = toIsoDate(d);
          const enabled = DEMO_DAYS.includes(d.getDay()) && d >= first && d <= last;
          const selected = iso === picked;
          return (
            <button
              key={iso}
              type="button"
              disabled={!enabled}
              onClick={() => setPicked(selected ? "" : iso)}
              aria-pressed={selected}
              aria-label={`${d.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}${enabled ? "" : " (not available)"}`}
              className={`h-9 rounded-md text-sm transition ${
                selected
                  ? "bg-brand-navy font-semibold text-white"
                  : enabled
                    ? "border border-orange-300 bg-orange-50 font-semibold text-brand-navy hover:bg-orange-100"
                    : "cursor-not-allowed text-slate-300"
              }`}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-slate-500" aria-live="polite">
        {picked ? (
          <>
            Selected: <span className="font-semibold text-slate-800">{pickedLabel}</span>{" "}
            <button type="button" onClick={() => setPicked("")} className="font-medium text-brand-accent hover:underline">
              Clear
            </button>
          </>
        ) : (
          "Tuesdays and Fridays are available. Pick a date, or leave it blank and we will suggest one."
        )}
      </p>
    </div>
  );
}
