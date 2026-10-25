// Read-only client for the BidcoreAI public API (www.bidcore.in has no tender or company data of its own).
// Tenders come from the published public tenders of Tender Connect; companies are only those with an active paid subscription.
// Server-side only: the site key stays on the server. Pages revalidate every minute, so a withdrawn tender leaves the site within a minute.

const API = (process.env.BIDCORE_API_URL ?? process.env.NEXT_PUBLIC_BIDCORE_API_URL ?? "").replace(/\/$/, "");

export const PUBLIC_API_URL = (process.env.NEXT_PUBLIC_BIDCORE_API_URL ?? process.env.BIDCORE_API_URL ?? "").replace(/\/$/, "");
export const SITE_URL = (process.env.SITE_URL ?? "https://www.bidcore.in").replace(/\/$/, "");

export interface TenderDoc {
  id: number;
  name: string;
  type: string | null;
  size: number | null;
  download_url: string;
}

// The bid form's structure only — question text and line-item/alternate
// labels. Never a bidder's priced answers.
export interface TenderBidForm {
  questions: { text: string; required: boolean }[];
  base_bid: boolean;
  line_items: { description: string; unit: string | null }[];
  alternates: { name: string; description: string | null }[];
}

export interface Tender {
  id: number;
  slug: string;
  title: string;
  reference_no: string | null;
  organization: string | null;
  category: string | null;
  state: string | null;
  city: string | null;
  location: string | null;
  value_inr: number | null;
  summary: string | null;
  published_at: string | null;
  closing_date: string | null;
  status: "open" | "closed";
  submission_mode: "bidcore" | "external";
  amended_at: string | null;
  amendment_count: number;
  // detail only
  eligibility?: string | null;
  clarification_deadline?: string | null;
  site_visit_date?: string | null;
  official_url?: string | null;
  required_documents?: string[];
  documents?: TenderDoc[];
  bid_form?: TenderBidForm | null;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface Contractor {
  slug: string;
  name: string;
  type: string | null;
  state: string | null;
  city: string | null;
  trades: string[];
  website: string | null;
  about?: string | null;
}

export interface PublicPlan {
  code: string;
  name: string;
  kind: "tender_connect" | "starter" | "end_to_end" | "storage";
  storage_gb: number | null;
  interval: "monthly" | "yearly";
  amount_paise: number;
  amount_inr: number;
  currency: string;
}

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number };

async function get<T>(path: string, params?: Record<string, string | undefined>): Promise<ApiResult<T>> {
  if (!API) return { ok: false, status: 0 };
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params ?? {})) if (v) qs.set(k, v);
  try {
    const res = await fetch(`${API}${path}${qs.size ? `?${qs}` : ""}`, {
      headers: { "X-Bidcore-Site-Key": process.env.PUBLIC_SITE_KEY ?? "" },
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, status: res.status };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, status: 0 };
  }
}

export const getTenders = (params?: Record<string, string | undefined>) => get<Page<Tender>>("/api/public/tenders", params);
export const getTender = (slug: string) => get<Tender & { canonical_slug: string }>(`/api/public/tenders/${encodeURIComponent(slug)}`);
export const getTenderSitemap = () => get<{ items: { slug: string; lastmod: string | null; status: string }[] }>("/api/public/tenders-sitemap");
export const getContractors = (params?: Record<string, string | undefined>) => get<Page<Contractor>>("/api/public/contractors", params);
export const getContractor = (slug: string) => get<Contractor>(`/api/public/contractors/${encodeURIComponent(slug)}`);

// ── formatting ────────────────────────────────────────────────────────────────────────────────────────────────────
export function formatValue(inr: number | null | undefined): string | null {
  if (!inr || inr <= 0) return null;
  if (inr >= 1e7) return `₹${(inr / 1e7).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Cr`;
  if (inr >= 1e5) return `₹${(inr / 1e5).toLocaleString("en-IN", { maximumFractionDigits: 2 })} Lakh`;
  return `₹${inr.toLocaleString("en-IN")}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  return isNaN(+d) ? iso : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export function daysLeft(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const end = new Date(`${iso}T23:59:59`);
  return Math.ceil((+end - Date.now()) / 86400000);
}

export const getPlans = () => get<{ plans: PublicPlan[]; trial_days: number; credit_card_required: boolean }>("/api/public/plans");
