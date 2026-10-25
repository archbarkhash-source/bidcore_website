// Choices on the "Request a Demo" form, shared by the form (client) and the API route (server validation).
export const DEMO_ROLES = ["EPC / General Contractor", "Subcontractor", "Developer / Owner", "Consultant / PMC", "Supplier / Manufacturer", "Other"];
export const DEMO_INTERESTS = ["Tender Connect", "Tender Management", "Project Management", "Procurement Management", "Site Operations", "Marketplace", "Custom solutions / integration", "Not sure yet"];

/** How far ahead a demo date can be chosen (any day from tomorrow on). */
export const DEMO_MAX_DAYS_AHEAD = 90;

/** Demo times are always Indian Standard Time (IST, UTC+5:30): the first and last start, on the hour or half hour. */
export const DEMO_TIME_MIN = "10:00";
export const DEMO_TIME_MAX = "17:30";
export const DEMO_DEFAULT_TIME = "15:30";
/** The suggested slot is one hour long. */
export const DEMO_SUGGEST_END = "16:30";

const DAY_MS = 24 * 3600 * 1000;

/** Today's date in India as YYYY-MM-DD. Computed from UTC arithmetic so the server and every browser agree, whatever their own time zone. */
export const istTodayIso = () => new Date(Date.now() + 5.5 * 3600 * 1000).toISOString().slice(0, 10);

/** A local calendar date as YYYY-MM-DD. */
export const toIsoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** The suggested demo day, every week: the first Tuesday after `todayIso`. Any other day can still be chosen. */
export const DEMO_SUGGEST_DAY = 2;
export function nextDemoDateIso(todayIso: string): string {
  const [y, m, d] = todayIso.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d));
  do t.setUTCDate(t.getUTCDate() + 1);
  while (t.getUTCDay() !== DEMO_SUGGEST_DAY);
  return t.toISOString().slice(0, 10);
}

/** Is `iso` (YYYY-MM-DD) a valid calendar date that is from tomorrow on, after `todayIso` and within the allowed range? Pure, so the server can check what the calendar offered. */
export function isDemoDate(iso: string, todayIso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return false; // e.g. 2026-02-31
  const [ty, tm, td] = todayIso.split("-").map(Number);
  const diff = Math.round((date.getTime() - Date.UTC(ty, tm - 1, td)) / DAY_MS);
  return diff >= 1 && diff <= DEMO_MAX_DAYS_AHEAD;
}

/** A valid start time (HH:MM, 24-hour, IST): on the hour or half hour, between the first and last start. */
export const isDemoTime = (t: string) => /^([01]\d|2[0-3]):(00|30)$/.test(t) && t >= DEMO_TIME_MIN && t <= DEMO_TIME_MAX;

/** "13:30" -> "1:30 PM" */
export function formatTime12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

/** "Friday, 30 October 2026" for a YYYY-MM-DD date. */
export function formatDateLong(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** "Friday, 30 October 2026, 11:00 AM IST" */
export const formatSlotIst = (iso: string, t: string) => `${formatDateLong(iso)}, ${formatTime12(t)} IST`;
