"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { signUpHref, FREE_TRIAL_OPEN, TENDER_CONNECT_DEMO } from "@/lib/app-links";

const SALES_EMAIL = "barkha@bidcoreai.com";
const mailto = (subject: string, ask: string) =>
  `mailto:${SALES_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Hello,\n\n${ask}\n\nCompany:\nNumber of users:\nContact number:\n`)}`;

type TabKey = "tender-connect" | "scale" | "sync";

interface Product {
  key: TabKey;
  name: string;
  tagline: string;
  /** What the "Request a Demo" form calls it. */
  interest: string;
  href: string;
  groups: { heading: string; features: string[] }[];
}

// The pricing page is one tab per product. No price is shown on the website: Tender Connect has a 30-day free trial, Scale and Sync go through Request a Demo.
const PRODUCTS: Product[] = [
  {
    key: "tender-connect",
    name: "BidcoreAI Tender Connect",
    tagline: "Publish tenders, find contractors and manage quotations.",
    interest: "Tender Connect",
    href: "/products/tender-connect",
    groups: [
      {
        heading: "Tendering",
        features: [
          "Publish public and private tenders",
          "Invite contractors from your network or the Bidcore contractor directory",
          "Share the BOQ, bid form and documents, with visibility set per document",
          "Compare item-wise quotations side by side on one BOQ",
        ],
      },
      {
        heading: "Quoting",
        features: [
          "Submit quotations on public tenders",
          "Go / No-Go eligibility checks before you invest time in a quotation",
          "BOQ pricing, documents and checklists",
          "A company profile so contractors can find you",
        ],
      },
    ],
  },
  {
    key: "scale",
    name: "BidcoreAI Scale",
    tagline: "AI-powered takeoff, auto takeoff, agents and cost estimating.",
    interest: "BidcoreAI Scale",
    href: "/products/scale",
    groups: [
      {
        heading: "Takeoff",
        features: [
          "AI-powered takeoff from PDF drawings, reviewed by your estimator",
          "Auto takeoff: count a symbol once, find the rest across the drawing",
          "AI agents: Agent X, or your own AI assistant, that propose and you approve",
        ],
      },
      {
        heading: "Cost estimation",
        features: [
          "Cost estimation with CPWD Civil, CPWD E&M and MoRTH cost models",
          "Auto Assign of rate analyses to BOQ lines, with unpriced lines reported",
          "Your own Company cost model and rates",
          "BOQ, item-rate BOQ and market-rate references",
        ],
      },
    ],
  },
  {
    key: "sync",
    name: "BidcoreAI Sync",
    tagline: "The whole lifecycle, from tender to site. Includes Scale and Tender Connect.",
    interest: "BidcoreAI Sync",
    href: "/products/sync",
    groups: [
      {
        heading: "Everything in Scale and Tender Connect, plus",
        features: ["AI takeoff, auto takeoff, agents and cost estimation", "Tendering and quotations through Tender Connect"],
      },
      {
        heading: "Tender Management",
        features: [
          "Tender document analysis with document and page references",
          "Eligibility and Go / No-Go assessment, and the bid pack checklist",
          "Tender cost and estimated project cost",
          "Tender schedule, WBS and productivity",
        ],
      },
      {
        heading: "Project Management",
        features: [
          "Budget and cost control, scheduling and Gantt",
          "Daily Progress Reports, site visits, RA bills and monthly MIS",
          "Procurement log, purchase orders and change orders",
        ],
      },
      {
        heading: "Site Operations",
        features: ["Resource planning, crews and equipment", "Work packages and subcontractor capacity"],
      },
    ],
  },
];

export default function PricingPlans({ initial = "tender-connect" }: { initial?: TabKey }) {
  const [active, setActive] = useState<TabKey>(initial);
  const product = PRODUCTS.find((p) => p.key === active) ?? PRODUCTS[0];
  const trial = product.key === "tender-connect";

  return (
    <div>
      <div role="tablist" aria-label="Products" className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2 rounded-xl border border-slate-200 bg-white p-1.5">
        {PRODUCTS.map((p) => (
          <button
            key={p.key}
            role="tab"
            id={`tab-${p.key}`}
            aria-selected={p.key === active}
            aria-controls={`panel-${p.key}`}
            onClick={() => setActive(p.key)}
            className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold transition sm:flex-none ${
              p.key === active ? "bg-brand-navy text-white" : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${product.key}`} aria-labelledby={`tab-${product.key}`} className="mx-auto mt-6 max-w-5xl rounded-xl border border-brand-navy bg-white p-6 ring-1 ring-brand-navy sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold text-brand-navy">{product.name}</h2>
            <p className="mt-2 text-slate-600">{product.tagline}</p>
            <Link href={product.href} className="mt-3 inline-block text-sm font-semibold text-brand-accent hover:underline">
              About {product.name} &rarr;
            </Link>
          </div>
          <div className="md:w-64 md:shrink-0">
            <span className="text-lg font-bold text-brand-navy">30-day free trial</span>
            <p className="mt-1 text-xs text-slate-500">No credit card required. Request a demo to see pricing after the trial.</p>
            <Link
              href={trial ? (FREE_TRIAL_OPEN ? signUpHref("tender-connect") : TENDER_CONNECT_DEMO) : `/request-demo?product=${encodeURIComponent(product.interest)}`}
              className="mt-4 block rounded-full bg-brand-accent px-5 py-2.5 text-center text-sm font-semibold text-white transition hover:bg-brand-accent-light"
            >
              {FREE_TRIAL_OPEN && trial ? "Start Free Trial" : "Request Your Free Trial"}
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 border-t border-slate-200 pt-6 sm:grid-cols-2">
          {product.groups.map((g) => (
            <div key={g.heading}>
              <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500">{g.heading}</h3>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                {g.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 text-center text-sm text-slate-600">
        Need several seats for a larger team?{" "}
        <a
          href={mailto("Pricing request: BidcoreAI (multiple seats)", "Please share the pricing for BidcoreAI with multiple seats.")}
          className="font-medium text-brand-accent hover:underline"
        >
          Request pricing
        </a>
        .
      </p>
    </div>
  );
}
