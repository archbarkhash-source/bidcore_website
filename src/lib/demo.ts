// Choices on the "Request a Demo" form, shared by the form (client) and the API route (server validation).
export const DEMO_ROLES = ["EPC / General Contractor", "Subcontractor", "Developer / Owner", "Consultant / PMC", "Supplier / Manufacturer", "Other"];
export const DEMO_INTERESTS = ["Tender Connect", "Tender Management", "Project Management", "Procurement Management", "Site Operations", "Marketplace", "Custom solutions / integration", "Not sure yet"];

/** Live demos are given on these weekdays (0 = Sunday): Tuesday and Friday. */
export const DEMO_DAYS = [2, 5];
/** How far ahead a demo date can be chosen. */
export const DEMO_MAX_DAYS_AHEAD = 90;

/** A local calendar date as YYYY-MM-DD. */
export const toIsoDate = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Is `iso` (YYYY-MM-DD) a valid calendar date that is a demo day, after `todayIso` and within the allowed range? Pure, so the server can check what the calendar offered. */
export function isDemoDate(iso: string, todayIso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return false; // e.g. 2026-02-31
  if (!DEMO_DAYS.includes(date.getUTCDay())) return false;
  const [ty, tm, td] = todayIso.split("-").map(Number);
  const dayMs = 24 * 3600 * 1000;
  const diff = Math.round((date.getTime() - Date.UTC(ty, tm - 1, td)) / dayMs);
  return diff >= 1 && diff <= DEMO_MAX_DAYS_AHEAD;
}
