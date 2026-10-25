// Every BidcoreAI product's "Sign Up" / "Start free trial" on www.bidcore.in goes straight to the BidcoreAI
// application's own sign-up (appSignupUrl) — the website doesn't verify the email or create an account of its
// own for these. The website's own email-code sign-in (SignInForm, /sign-in with no `product`) is kept only
// for website-only features: listing a company in the directory and viewing other companies' contact details.

export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://app.bidcoreai.com").replace(/\/$/, "");

export type ProductKey = "tender-connect" | "tender-management" | "project-management" | "procurement" | "site-management" | "all-in-one";

export interface Product {
  key: ProductKey;
  name: string;
  href: string; // the product's page on www.bidcore.in
  tagline: string;
}

export const PRODUCTS: Product[] = [
  { key: "tender-connect", name: "Tender Connect", href: "/products/tender-connect", tagline: "Publish tenders, find contractors and manage quotations." },
  { key: "tender-management", name: "Tender Management", href: "/products/tender-management", tagline: "Takeoff, cost estimation and tender cost preparation." },
  { key: "project-management", name: "Project Management", href: "/products/project-management", tagline: "Budgeting, scheduling, DPRs, submittals and RFIs." },
  { key: "procurement", name: "Procurement Management", href: "/products/procurement-management", tagline: "Purchase orders, vendors, material delivery and change orders." },
  { key: "site-management", name: "Site Operations", href: "/products/site-management", tagline: "Plan crews, equipment and work packages, and run the site day to day." },
];

/** Where "Sign Up" / "Start free trial" for a product goes: straight to the BidcoreAI sign-up. */
export function signUpHref(product: ProductKey = "tender-connect", extra?: Record<string, string>): string {
  return appSignupUrl(product, extra);
}

/** The BidcoreAI sign-up page, India preselected, the product remembered, and whatever we already know filled in. */
export function appSignupUrl(product: ProductKey, prefill?: { name?: string; email?: string; company?: string; phone?: string; next?: string; intent?: string; market?: string; role?: string; vt?: string }): string {
  const qs = new URLSearchParams({ market: "IN", product, source: "bidcore.in" });
  for (const [k, v] of Object.entries(prefill ?? {})) if (v) qs.set(k, v);
  return `${APP_URL}/signup?${qs}`;
}

export const appLoginUrl = (next?: string) => `${APP_URL}/login?source=bidcore.in&market=IN${next ? `&next=${encodeURIComponent(next)}` : ""}`;

/** Open a public tender inside Tender Connect (the same record, in Opportunities). */
export const appTenderUrl = (slug: string, action?: "quote" | "gonogo") => `${APP_URL}/tenders/${encodeURIComponent(slug)}${action ? `?action=${action}` : ""}`;
