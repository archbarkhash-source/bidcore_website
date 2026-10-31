import type { Metadata } from "next";
import PricingPlans from "@/components/PricingPlans";

export const metadata: Metadata = {
  title: "Plans | Bidcore",
  description:
    "BidcoreAI software plans: Starter Lite (Tender Connect), Starter, Pro and Enterprise. Starter Lite starts with a 30-day free trial, no credit card. Request a demo for Starter and Pro.",
  alternates: { canonical: "/pricing" },
};

const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "info@bidcore.in";

// No price is shown on the website. Starter Lite (Tender Connect) is the one plan with a 30-day free trial; a visitor requests a demo to see the pricing of Starter and Pro.
export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-brand-navy sm:text-4xl">Plans</h1>
        <p className="mt-3 text-xl font-semibold leading-snug text-brand-navy">
          AI-Powered End-to-End Construction Solutions
          <br />
          On One Integrated Platform
        </p>
        <p className="mx-auto mt-3 max-w-xl text-slate-600">
          Browsing tenders and companies is free. Starter Lite starts with a 30-day free trial, no credit card required. Request a demo, or contact us, to see pricing.
        </p>
      </div>
      <div className="mt-10">
        <PricingPlans />
      </div>
      <p className="mt-10 text-center text-sm text-slate-600">
        Questions about plans? Contact us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium text-brand-accent hover:underline">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    </div>
  );
}
