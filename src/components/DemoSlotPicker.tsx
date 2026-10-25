"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import DemoCalendar from "@/components/DemoCalendar";
import { DEMO_DEFAULT_TIME, DEMO_TIME_MAX, DEMO_TIME_MIN, formatSlotIst, formatTime12, isDemoTime, istTodayIso, nextDemoDateIso } from "@/lib/demo";

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_SHORT = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

// "Pick a date & time": tomorrow is selected for you, you set a time in IST, and "Find another date" opens the calendar.
// Every time on this page is Indian Standard Time (IST, UTC+5:30); nothing is converted to the visitor's own time zone.
export default function DemoSlotPicker() {
  const [date, setDate] = useState(() => nextDemoDateIso(istTodayIso()));
  const [time, setTime] = useState(DEMO_DEFAULT_TIME);
  const [showCalendar, setShowCalendar] = useState(false);

  const [y, m, d] = date.split("-").map(Number);
  const dayName = DAYS_SHORT[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  const timeOk = isDemoTime(time);
  const [h] = DEMO_DEFAULT_TIME.split(":").map(Number);

  return (
    <div>
      <input type="hidden" name="preferredDate" value={date} />
      <input type="hidden" name="preferredTime" value={time} />

      <div className="flex flex-wrap items-stretch gap-4">
        {/* the date card */}
        <div className="flex w-24 shrink-0 flex-col items-center justify-center rounded-lg border-2 border-orange-400 bg-orange-50 px-2 py-3 text-center" aria-live="polite">
          <span className="text-xs font-bold tracking-wider text-orange-700">{dayName}</span>
          <span className="text-3xl font-bold leading-none text-brand-navy">{d}</span>
          <span className="mt-1 text-xs font-medium text-slate-600">
            {MONTHS_SHORT[m - 1]} {y}
          </span>
        </div>

        <div className="min-w-[14rem] flex-1">
          <label htmlFor="demo-time" className="text-sm font-medium text-slate-700">
            Time <span className="font-normal text-slate-500">(IST · UTC+5:30)</span> <span className="text-brand-accent">*</span>
          </label>
          <input
            id="demo-time"
            type="time"
            required
            min={DEMO_TIME_MIN}
            max={DEMO_TIME_MAX}
            step={1800}
            value={time}
            onChange={(e) => setTime(e.target.value)}
            aria-invalid={!timeOk}
            className={`mt-1.5 w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-brand-navy/10 ${timeOk ? "border-slate-300 focus:border-brand-navy" : "border-red-400"}`}
          />
          {timeOk ? (
            <p className="mt-1.5 text-sm text-slate-700">
              Your slot: <strong className="font-semibold">{formatSlotIst(date, time)}</strong>
            </p>
          ) : (
            <p role="alert" className="mt-1.5 text-sm text-red-600">
              Choose a time between {formatTime12(DEMO_TIME_MIN)} and {formatTime12(DEMO_TIME_MAX)} IST, on the hour or half hour.
            </p>
          )}
          <p className="mt-1 text-xs text-slate-500">
            Suggested: {formatTime12(DEMO_DEFAULT_TIME)} – {formatTime12(`${h + 1}:00`.padStart(5, "0"))} IST
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowCalendar((v) => !v)}
        aria-expanded={showCalendar}
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent hover:underline"
      >
        <CalendarDays className="h-4 w-4" />
        Find another date
      </button>
      {showCalendar && (
        <div className="mt-2">
          <DemoCalendar value={date} onChange={setDate} />
        </div>
      )}
    </div>
  );
}
