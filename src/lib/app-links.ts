// Sign-up and sign-in are done ON this website, with its own database (SignInForm at /sign-in, LoginForm at /login, both by an emailed one-time code).
// signUpHref / appLoginUrl keep their old names so every button keeps working, but they now point at those pages; nothing sends a visitor to the BidcoreAI
// application any more. (appSignupUrl is kept only for a future link to the application.)

export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://app.bidcoreai.com").replace(/\/$/, "");

export type ProductKey = "tender-connect" | "tender-management" | "project-management" | "procurement" | "site-management" | "all-in-one";

export interface Product {
  key: ProductKey;
  name: string;
  /** What the demo form calls it (the "Interested in" choice). */
  demoInterest: string;
  href: string; // the product's page on www.bidcore.in
  tagline: string;
}

// The Products menu and page show three products: Tender Connect, BidcoreAI Scale (takeoff and estimating) and BidcoreAI Sync (the end-to-end lifecycle).
// Scale and Sync keep the internal keys "tender-management" and "all-in-one", which are the sign-up product names the BidcoreAI application knows.
export const PRODUCTS: Product[] = [
  { key: "tender-connect", name: "Tender Connect", demoInterest: "Tender Connect", href: "/products/tender-connect", tagline: "Publish tenders, find contractors and manage quotations." },
  { key: "tender-management", name: "Scale", demoInterest: "BidcoreAI Scale", href: "/products/scale", tagline: "Takeoff, BOQ and cost estimation on CPWD, CPWD E&M and MoRTH cost models." },
  { key: "all-in-one", name: "Sync", demoInterest: "BidcoreAI Sync", href: "/products/sync", tagline: "The whole lifecycle: tender, estimate, schedule, budget, procurement and site." },
];

/** While the downloadable Starter Lite programs are not published on the website, no page offers a "Start Free Trial": visitors are sent to Request a Demo instead.
 *  Set to true when the downloads (/software) go live; every "Start Free Trial" button comes back with it. */
export const FREE_TRIAL_OPEN = false;
export const TENDER_CONNECT_DEMO = "/request-demo?product=Tender%20Connect";

/** Where "Sign Up" / "Start free trial" for a product goes: this website's own sign-up (the product and intent are remembered in the address). */
export function signUpHref(product: ProductKey = "tender-connect", extra?: Record<string, string>): string {
  const qs = new URLSearchParams({ product });
  for (const [k, v] of Object.entries(extra ?? {})) if (v) qs.set(k, v);
  return `/sign-in?${qs}`;
}

/** The BidcoreAI sign-up page, India preselected, the product remembered, and whatever we already know filled in. */
export function appSignupUrl(product: ProductKey, prefill?: { name?: string; email?: string; company?: string; phone?: string; next?: string; intent?: string; market?: string; role?: string; vt?: string }): string {
  const qs = new URLSearchParams({ market: "IN", product, source: "bidcore.in" });
  for (const [k, v] of Object.entries(prefill ?? {})) if (v) qs.set(k, v);
  return `${APP_URL}/signup?${qs}`;
}

/** Sign in: this website's own email-code login. */
export const appLoginUrl = (next?: string) => `/login${next ? `?next=${encodeURIComponent(next)}` : ""}`;

/** Open a public tender inside Tender Connect (the same record, in Opportunities). */
export const appTenderUrl = (slug: string, action?: "quote" | "gonogo") => `${APP_URL}/tenders/${encodeURIComponent(slug)}${action ? `?action=${action}` : ""}`;
