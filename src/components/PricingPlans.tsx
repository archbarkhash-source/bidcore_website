import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { signUpHref } from "@/lib/app-links";

const SALES_EMAIL = "barkha@bidcoreai.com";
const mailto = (subject: string, ask: string) =>
  `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Hello,\n\n${ask}\n\nCompany:\nNumber of users:\nContact number:\n`)}`;

interface Plan {
  key: "tender_connect" | "starter" | "end_to_end" | "enterprise";
  name: string;
  tagline: string;
  features: string[];
  highlight?: boolean;
  /** A price shown on the website. Only Starter Lite has one; every other plan says "Sign up to see pricing". */
  price?: { amount: string; per: string };
}

const PLANS: Plan[] = [
  {
    key: "tender_connect",
    name: "Starter Lite",
    tagline: "Tender Connect",
    features: [
      "Submit quotations on public tenders",
      "Publish public and private tenders",
      "Go / No-Go eligibility checks",
      "BOQ pricing, documents and checklists",
    ],
    highlight: true,
  },
  {
    key: "starter",
    name: "Starter",
    tagline: "Tender Connect + Tender Management",
    features: [
      "Everything in Starter Lite",
      "Tender document analysis with document and page references",
      "Digital Quantity Takeoff using PDFs",
      "Cost estimation with CPWD, E&M and MoRTH cost models",
      "Tender cost and estimated project cost",
      "Tender schedule, WBS and productivity",
    ],
  },
  {
    key: "end_to_end",
    name: "Pro",
    tagline: "Tender Connect + Tender Management + Project Management",
    features: [
      "Everything in Starter",
      "Budget and cost control, scheduling and Gantt",
      "Procurement log, purchase orders and change orders",
      "Resource planning, work packages and subcontractor capacity",
      "Daily Progress Reports, site visits, RA bills and monthly MIS",
    ],
  },
  {
    key: "enterprise",
    name: "Enterprise",
    tagline: "For larger teams",
    features: ["Everything in Pro", "Multiple seat options", "A named contact for onboarding and support"],
  },
];

// Plans and what they include. No plan shows a price on the website. Starter Lite (Tender Connect) is the one plan with a free trial and a Start Free Trial button;
// Starter and Pro go through Request a Demo, and Enterprise through Request for pricing.
export default function PricingPlans() {
  return (
    <div>
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const enterprise = plan.key === "enterprise";
          return (
            <div
              key={plan.key}
              className={`flex flex-col rounded-xl border bg-white p-6 ${
                plan.highlight ? "border-brand-navy ring-1 ring-brand-navy" : "border-slate-200"
              }`}
            >
              <h3 className="font-semibold text-brand-navy">{plan.name}</h3>
              <p className="mt-1.5 text-sm text-slate-500">{plan.tagline}</p>

              <div className="mt-5">
                {plan.key === "tender_connect" ? (
                  <>
                    <span className="text-lg font-bold text-brand-navy">30-day free trial</span>
                    <p className="mt-1 text-xs text-slate-500">No credit card required</p>
                  </>
                ) : (
                  <span className="text-lg font-bold text-brand-navy">{enterprise ? "Request for pricing" : "Request a demo to see pricing"}</span>
                )}
              </div>

              <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-700">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {f}
                  </li>
                ))}
              </ul>

              {plan.key === "tender_connect" ? (
                <Link
                  href={signUpHref("tender-connect")}
                  className="mt-6 block rounded-full bg-brand-accent px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-accent-light"
                >
                  Start Free Trial
                </Link>
              ) : enterprise ? (
                <a
                  href={mailto("Pricing request: BidcoreAI Enterprise (multiple seats)", "Please share the pricing for BidcoreAI Enterprise with multiple seats.")}
                  className="mt-6 block rounded-full border border-slate-300 px-5 py-2.5 text-center text-sm font-semibold text-brand-navy transition hover:border-slate-400"
                >
                  Request for pricing
                </a>
              ) : (
                <Link
                  href={`/request-demo?product=${encodeURIComponent(plan.key === "starter" ? "Tender Management" : "Project Management")}`}
                  className="mt-6 block rounded-full bg-brand-accent px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-accent-light"
                >
                  Request a Demo
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
