import type { Metadata } from "next";
import PricingPlans from "@/components/PricingPlans";

export const metadata: Metadata = {
  title: "BidcoreAI Pricing: Tender Connect, Scale and Sync | Bidcore",
  description:
    "Pricing for BidcoreAI Tender Connect, BidcoreAI Scale (takeoff and cost estimating) and BidcoreAI Sync (the whole lifecycle). Every product starts with a 30-day free trial, no credit card required.",
  alternates: { canonical: "/pricing" },
};

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@bidcore.in";

// No price is shown on the website. One tab per product; every product starts with a 30-day free trial, and a visitor requests a demo to see the pricing.
export default async function PricingPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams;
  const initial = product === "scale" || product === "sync" || product === "tender-connect" ? product : "tender-connect";
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-navy sm:text-4xl">Pricing</h1>
        <p className="mt-3 text-xl font-semibold leading-snug text-brand-navy">
          AI-Powered End-to-End Construction Solutions
          <br />
          On One Integrated Platform
        </p>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Browsing tenders and companies is free. BidcoreAI Tender Connect, Scale and Sync each start with a 30-day free trial, no credit card required. Request a demo, or contact us, to see pricing.
        </p>
      </div>
      <div className="mt-10">
        <PricingPlans initial={initial} />
      </div>
      <p className="mt-10 text-center text-sm text-slate-600">
        Questions about pricing? Contact us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-brand-accent hover:underline">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </div>
  );
}
