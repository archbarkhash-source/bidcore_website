import {
  BadgeCheck,
  Banknote,
  Bookmark,
  Boxes,
  Building2,
  CalendarClock,
  Calculator,
  ClipboardCheck,
  ClipboardList,
  FileSearch,
  FileStack,
  FileText,
  Gauge,
  HardHat,
  LayoutDashboard,
  ListChecks,
  Mail,
  Megaphone,
  Package,
  Receipt,
  Ruler,
  Scale,
  Search,
  ShieldAlert,
  ShoppingCart,
  Truck,
  Users,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { signUpHref, type ProductKey, FREE_TRIAL_OPEN, TENDER_CONNECT_DEMO } from "@/lib/app-links";

// Content for the three BidcoreAI product landing pages (Tender Connect, BidcoreAI Scale = takeoff and estimating, BidcoreAI Sync = the end-to-end lifecycle) (/products/<slug>), rendered by components/product/ProductLanding.tsx.
//
// Truthfulness rules for this file:
//  - "live" / "coming-soon" = built in the BidcoreAI application. The website shows no label for either: only "planned" features get a visible marker.
//  - "planned"              = not built yet. Never describe it as available.
// Nothing here may state prices, customer counts, testimonials, savings or win-rates.

export type FeatureStatus = "live" | "coming-soon" | "planned";

export interface Cta {
  label: string;
  href: string;
}

export interface Capability {
  icon: LucideIcon;
  title: string;
  /** The practical problem this solves for an Indian construction business. */
  problem: string;
  body: string;
  status: FeatureStatus;
}

export interface Workflow {
  audience: string;
  steps: string[];
  note?: string;
}

export interface ProductPage {
  slug: string;
  key: ProductKey;
  /** Full brand name, e.g. "BidcoreAI Tender Connect" (used in the nav, H1 eyebrow and metadata). */
  name: string;
  availability: "available" | "coming-soon";
  metaTitle: string;
  metaDescription: string;
  headline: string;
  intro: string;
  /** Short list shown beside the hero when no genuine screenshot is available. */
  atAGlance: string[];
  /** Add a real product screenshot here (in /public/images) to show it in the hero. Leave unset until one exists. */
  screenshot?: { src: string; alt: string };
  /** A product illustration shown in the hero when there is no screenshot. */
  visual?: "tender-connect" | "tender-management" | "project-management" | "procurement-management" | "site-management";
  ctas: { primary: Cta; secondary?: Cta; tertiary?: Cta };
  valueProps: { title: string; body: string }[];
  audiences: { title: string; points: string[] }[];
  capabilitiesHeading: string;
  capabilities: Capability[];
  workflows: Workflow[];
  benefitsHeading: string;
  benefits: string[];
  access: { heading: string; body: string; rows: [string, string][]; ctas: Cta[] };
  faqs: { q: string; a: string }[];
  finalCta: { heading: string; body: string; ctas: Cta[] };
}

export type ProductSlug = "tender-connect" | "scale" | "sync";

export const productHref = (slug: ProductSlug) => `/products/${slug}`;

const explore = (label: string): Cta => ({ label, href: "#capabilities" });
const pricing: Cta = { label: "View Pricing", href: "/pricing" };
const demo: Cta = { label: "Request a Demo", href: "/request-demo" };
/** Only Tender Connect has a free trial; every other product goes through Request a Demo, with the product pre-selected on the form. */
const DEMO_PRODUCT: Partial<Record<ProductKey, string>> = {
  "tender-management": "BidcoreAI Scale",
  "all-in-one": "BidcoreAI Sync",
};
const demoFor = (key: ProductKey): Cta => ({ label: "Request a Demo", href: `/request-demo?product=${encodeURIComponent(DEMO_PRODUCT[key] ?? "")}` });
const tenderConnectLive: Cta = { label: "See Tender Connect", href: productHref("tender-connect") };

/** How the free allowance really works (backend/tender_entitlements.py: 30-day company-level trial, then the Tender Connect plan). One place to change if that rule changes. */
const TENDER_CONNECT_ACCESS: ProductPage["access"] = {
  heading: "30-day free trial. No credit card.",
  body:
    "Browsing public tenders and companies is free. Each company gets a 30-day free trial of Tender Connect that begins the first time you prepare a quotation or publish a tender, with no credit card. After the trial, one yearly plan covers publishing public and private tenders and submitting quotations.",
  rows: [
    ["Browse public tenders and companies", "Free"],
    ["Prepare and publish your first tenders / quotations", "30-day free trial per company, no card"],
    ["Keep publishing and submitting after the trial", "Yearly plan"],
    ["Your drafts, submitted quotations and records", "Kept, whatever your plan"],
  ],
  ctas: [
    ...(FREE_TRIAL_OPEN ? [{ label: "Start Free", href: signUpHref("tender-connect") }] : [{ label: "Request a Demo", href: TENDER_CONNECT_DEMO }]),
    { label: "View Pricing", href: "/pricing" },
  ],
};

const COMING_SOON_NOTE = (name: string, key: ProductKey): ProductPage["access"] => ({
  heading: "See it in a live demo",
  body: `Request a demo and a Bidcore team member will show you ${name} and share the pricing. The 30-day free trial is for Tender Connect (Starter Lite).`,
  rows: [
    ["Live demo", "Pick a date and time (IST)"],
    ["Pricing", "Shared in the demo"],
  ],
  ctas: [demoFor(key), { label: "View Plans", href: "/pricing" }],
});

export const PRODUCT_PAGES: ProductPage[] = [
  // ────────────────────────────────────────────────────────────────────────────────────────────── Tender Connect
  {
    slug: "tender-connect",
    key: "tender-connect",
    name: "BidcoreAI Tender Connect",
    availability: "available",
    visual: "tender-connect",
    metaTitle: "BidcoreAI Tender Connect | Construction Tendering in India",
    metaDescription:
      "Discover construction tenders, publish opportunities, share BOQs and manage contractor quotations with BidcoreAI Tender Connect.",
    headline: "One Platform to Publish Tenders, Find Contractors and Manage Quotations",
    intro:
      "Connect General Contractors, Subcontractors and construction companies through a common tendering workspace. Publish public or private tenders, invite contractors, discover construction opportunities, manage bid documents and receive quotations through a structured digital workflow.",
    atAGlance: [
      "Publish public tenders on Bidcore.in",
      "Invite your own network privately",
      "Search live public tenders by state, city and category",
      "Share BOQ and tender documents",
      "Receive item-wise quotations on one BOQ",
    ],
    ctas: {
      primary: { label: "Explore Public Tenders", href: "/tenders" },
      secondary: { label: "Publish a Tender", href: signUpHref("tender-connect", { intent: "publish" }) },
      ...(FREE_TRIAL_OPEN ? { tertiary: { label: "Start Free", href: signUpHref("tender-connect") } } : {}),
    },
    valueProps: [
      {
        title: "One workspace for both sides of a tender",
        body: "General Contractors publish packages and receive quotations; subcontractors find work and respond, all against the same tender record.",
      },
      {
        title: "Reach beyond WhatsApp and phone contacts",
        body: "Send a package to your own network, or publish it openly so contractors you do not already know can find and quote it.",
      },
      {
        title: "Structured, comparable quotations",
        body: "Every bidder prices the same BOQ lines, so quotations line up item by item instead of arriving as mismatched PDFs.",
      },
    ],
    audiences: [
      {
        title: "General Contractors and EPC Companies",
        points: [
          "Publish public and private tender packages",
          "Invite selected contractors and subcontractors",
          "Share BOQs, drawings, specifications and submission requirements",
          "Review contractor quotations side by side",
          "Keep tender documents and bid responses organised in one package",
          "Be found through the contractor directory on Bidcore.in (listed companies with an active plan)",
        ],
      },
      {
        title: "Subcontractors",
        points: [
          "Discover public construction tenders",
          "Receive private tender invitations",
          "Review scope, BOQ and tender documents",
          "Prepare item-wise quotations and attach supporting documents",
          "Save opportunities and watch closing dates",
          "Build a company profile so contractors can find you",
        ],
      },
      {
        title: "Small and Growing Contractors",
        points: [
          "Use a structured tendering workflow without a large tender administration team",
          "Keep project information and quotations together",
          "Find relevant opportunities through searchable public tender listings",
          "Check your eligibility before you invest time in a quotation",
        ],
      },
    ],
    capabilitiesHeading: "What you can do in Tender Connect",
    capabilities: [
      {
        icon: Megaphone,
        title: "Public Tender Publishing",
        problem: "Sourcing only from known contacts limits who quotes.",
        body: "Publish a tender package from a project. It appears on Bidcore.in and in the Opportunities of Tender Connect users, with a link you can share.",
        status: "live",
      },
      {
        icon: Mail,
        title: "Private Tender Invitations",
        problem: "Some packages should go only to contractors you already trust.",
        body: "Invite selected companies to a private tender. Private tenders never appear on the public site.",
        status: "live",
      },
      {
        icon: Search,
        title: "Tender Discovery and Search",
        problem: "Finding relevant tenders across portals and groups is slow.",
        body: "Search public tenders by state, city, category and keywords, and use matched search to see tenders that fit your company profile.",
        status: "live",
      },
      {
        icon: FileStack,
        title: "BOQ and Document Sharing",
        problem: "Bidders waste time chasing drawings, BOQs and specifications.",
        body: "Attach the BOQ, bid form and tender documents to the package and choose, per document, whether it is private, for bidders only, or public.",
        status: "live",
      },
      {
        icon: FileText,
        title: "Structured Quotation Submission",
        problem: "Quotations sent as ad-hoc files are hard to check and compare.",
        body: "Prepare item-wise rates against the tender's BOQ, attach supporting documents and submit. If the publisher asks for quotations to be submitted outside BidcoreAI, prepare here, submit as the publisher asks, then mark it submitted.",
        status: "live",
      },
      {
        icon: ClipboardCheck,
        title: "Bidder Questionnaire and Eligibility",
        problem: "Reviewing unsuitable bidders costs time.",
        body: "Add a qualification questionnaire to screen on experience and capability, and run Go / No-Go eligibility checks against the tender's requirements and your company profile. Missing information is shown as 'review', never as a pass.",
        status: "live",
      },
      {
        icon: Building2,
        title: "Contractor Company Profiles",
        problem: "Good subcontractors are hard to discover by name alone.",
        body: "Add your company information to be listed on Bidcore.in. Only companies with an active Tender Connect plan appear in the public contractor directory, and contact details are not shown publicly.",
        status: "live",
      },
      {
        icon: Bookmark,
        title: "Tender Opportunity Tracking",
        problem: "Deadlines slip when opportunities live in chats and spreadsheets.",
        body: "Save tenders, see closing dates, and keep your quotation drafts and submissions together in Opportunities.",
        status: "live",
      },
      {
        icon: Scale,
        title: "Bid Comparison",
        problem: "Comparing quotations by hand in spreadsheets invites errors.",
        body: "Item-wise rates from every bidder are shown side by side against the same BOQ, with the status of each invited company, and can be exported as CSV by the publisher.",
        status: "live",
      },
      {
        icon: BadgeCheck,
        title: "Free Trial and Subscription",
        problem: "Teams hesitate to commit before they have tried the workflow.",
        body: "Try Tender Connect free for 30 days with no credit card, then continue on a yearly plan. Browsing, drafts and past quotations never depend on a plan.",
        status: "live",
      },
    ],
    workflows: [
      {
        audience: "For General Contractors",
        steps: [
          "Create Project",
          "Prepare Tender Package",
          "Attach BOQ and Documents",
          "Publish Public Tender or Invite Contractors",
          "Receive Quotations",
          "Review Bids",
        ],
        note: "A tender package must belong to a project before it can be published or sent.",
      },
      {
        audience: "For Subcontractors",
        steps: [
          "Create Company Profile",
          "Discover Tenders or Receive Invitations",
          "Review Scope and BOQ",
          "Prepare Quotation",
          "Submit Bid",
          "Track Opportunity",
        ],
      },
    ],
    benefitsHeading: "Built for how Indian contractors source and win work",
    benefits: [
      "Item-wise BOQ quotations in rupees, ready to compare",
      "Public and private tendering in one place",
      "Eligibility and Go / No-Go checks before you bid",
      "Packages, documents and quotations stay private to the companies involved",
      "Works for large EPC companies and small, growing contractors alike",
    ],
    access: TENDER_CONNECT_ACCESS,
    faqs: [
      {
        q: "Who is Tender Connect for?",
        a: "General Contractors and EPC companies that need to source subcontractors, and subcontractors and growing contractors that want to find and quote on work. One company can do both.",
      },
      {
        q: "How do I get started?",
        a: "Browse public tenders on Bidcore.in, and create a BidcoreAI account to publish tenders and submit quotations.",
      },
      {
        q: "What does it cost?",
        a: "Browsing is free. Each company gets a 30-day free trial, with no credit card, that starts when you first prepare a quotation or publish a tender. After that, a yearly plan applies. Contact us for pricing.",
      },
      {
        q: "Is the free trial per person?",
        a: "No. It is per company, so colleagues share one trial and creating another login does not start another.",
      },
      {
        q: "How is Tender Connect related to BidcoreAI Scale and Sync?",
        a: "Tender Connect is its own product for publishing tenders, inviting contractors and quoting. BidcoreAI Scale is takeoff and estimating, and BidcoreAI Sync is the end-to-end lifecycle. Sync includes Tender Connect and Scale, so a contractor on Sync prices the package in Scale and sources it through Tender Connect.",
      },
      {
        q: "Can I keep a tender private?",
        a: "Yes. A private tender goes only to the companies you invite and never appears on Bidcore.in. You can also publish a package publicly to reach more contractors.",
      },
      {
        q: "What if a tender is submitted outside BidcoreAI?",
        a: "Prepare the complete quotation in BidcoreAI, submit it the way the publisher asks, then mark it as submitted. BidcoreAI cannot see anything outside the platform, so it only records the submission after you confirm it.",
      },
    ],
    finalCta: {
      heading: "Publish your first tender or find your next opportunity",
      body: "Browse live public tenders now, or create a BidcoreAI account to publish a tender and submit quotations.",
      ctas: [
        { label: "Explore Public Tenders", href: "/tenders" },
        { label: "Publish Your First Tender", href: signUpHref("tender-connect", { intent: "publish" }) },
        { label: "Submit Your First Quotation Free", href: signUpHref("tender-connect") },
        pricing,
        demo,
      ],
    },
  },

  // ────────────────────────────────────────────────────────────────────────────────────────────────── BidcoreAI Scale
  {
    slug: "scale",
    visual: "tender-management",
    key: "tender-management",
    name: "BidcoreAI Scale",
    availability: "coming-soon",
    metaTitle: "BidcoreAI Scale | Takeoff and Estimating Software for Indian Contractors",
    metaDescription:
      "BidcoreAI Scale: digital takeoff, BOQ and cost estimation with CPWD Civil, CPWD E&M and MoRTH cost models and your own rates, for Indian EPC and general contractors.",
    headline: "Take Off, Price and Build the Tender Cost on Indian Cost Models",
    intro:
      "BidcoreAI Scale is takeoff and estimating for India and the Asian market: measure the drawings, build the BOQ, price it against CPWD Civil, CPWD E&M and MoRTH cost models or your own company rates, and finish with the bid cost estimate, in rupees.",
    atAGlance: [
      "Quantity takeoff from PDF drawings with AI-assisted counts",
      "BOQ and item-rate BOQ for government tenders",
      "CPWD Civil, CPWD E&M and MoRTH cost models",
      "Your own Company cost model and rates",
      "Tender Cost with overheads, GST and profit",
    ],
    ctas: {
      primary: explore("Explore Scale"),
      secondary: demoFor("tender-management"),
      tertiary: pricing,
    },
    valueProps: [
      {
        title: "Priced from rate analysis, not guesswork",
        body: "Auto Assign matches BOQ lines to rate analyses in the cost model. A line it cannot price stays empty and is reported, so you decide.",
      },
      {
        title: "Your rates as well as the schedule of rates",
        body: "Copy items from CPWD or MoRTH into your Company cost model and set your own rates. The published rate is never edited.",
      },
      {
        title: "From drawing to bid cost in one place",
        body: "Quantities, BOQ, estimate and the tender cost sit in the same project, so a change is made once.",
      },
    ],
    audiences: [
      {
        title: "EPC and General Contractors",
        points: ["Price building, road and infrastructure BOQs on the cost model the tender uses", "Keep the estimate, the BOQ and the tender cost on one project", "Reuse your own rates across projects"],
      },
      {
        title: "Estimators and Quantity Surveyors",
        points: ["Measure PDF drawings and group quantities under Sub Heads or Chapters", "Use BOQ templates for repeat kinds of work", "See which lines are priced and which still need a decision"],
      },
      {
        title: "Subcontractors and Specialist Contractors",
        points: ["Price your own scope on your own rates", "Respond to tender packages with item-wise quotations through Tender Connect"],
      },
    ],
    capabilitiesHeading: "BidcoreAI Scale capabilities",
    capabilities: [
      {
        icon: Ruler,
        title: "Quantity Takeoff",
        problem: "Measuring drawings by hand is slow and hard to check.",
        body: "Measure counts, lengths and areas on PDF drawings. AI-assisted symbol counting proposes counts for you to review before they are used.",
        status: "coming-soon",
      },
      {
        icon: ClipboardList,
        title: "BOQ Management",
        problem: "BOQs live in spreadsheets that drift from the estimate.",
        body: "Build and maintain the project BOQ in the workspace, including item-rate BOQs for government tenders, with template download and upload.",
        status: "coming-soon",
      },
      {
        icon: Calculator,
        title: "Cost Estimation on CPWD and MoRTH Cost Models",
        problem: "Rate analysis by hand is slow and hard to audit.",
        body: "Resource-based costing with CPWD Civil, CPWD E&M and MoRTH cost models, with Auto Assign of rate analyses to BOQ lines and a note on every line it priced from another model.",
        status: "coming-soon",
      },
      {
        icon: Boxes,
        title: "Company Cost Model",
        problem: "Published rates are not what your own crews and suppliers cost.",
        body: "Duplicate items from CPWD or MoRTH into your own Company cost model, set your own rate, and keep several named cost models. The master data is only read, never changed.",
        status: "coming-soon",
      },
      {
        icon: FileStack,
        title: "BOQ Intelligence Templates",
        problem: "Every water main, data centre or road starts from a blank BOQ.",
        body: "Templates of the BOQ a kind of work needs per standard unit. Enter the size, review the preview and add the lines to the project. These are planning benchmarks to check against your own data.",
        status: "coming-soon",
      },
      {
        icon: Banknote,
        title: "Tender Cost and Bid Cost Estimate",
        problem: "Overheads, GST and profit are worked out on the side.",
        body: "Project Factors for overheads, profit and GST, itemised general conditions, and a bid cost estimate that carries them, with EMD and security calculators for the tender.",
        status: "coming-soon",
      },
      {
        icon: Search,
        title: "Market Rates and Vendor Quotes",
        problem: "Rate decisions need a reference.",
        body: "Market-rate, vendor-quote and historical-bid references from the cost-intelligence workspace support your pricing decisions.",
        status: "coming-soon",
      },
      {
        icon: Gauge,
        title: "Agent X Assistant",
        problem: "Finding a figure in a large estimate takes time.",
        body: "Ask questions about the tender, the estimate and the project in plain language. You can also connect your own AI assistant with your own key; it proposes, and a person approves.",
        status: "coming-soon",
      },
    ],
    workflows: [
      {
        audience: "From drawing to bid cost",
        steps: ["Set Up Project", "Take Off Quantities", "Build the BOQ", "Assign Rate Analyses", "Apply Overheads, GST and Profit", "Review the Bid Cost Estimate"],
        note: "Review every priced line before you rely on it: the figures depend on the inputs and rates you choose.",
      },
    ],
    benefitsHeading: "Why estimators use Scale",
    benefits: [
      "CPWD Civil, CPWD E&M and MoRTH cost models in the estimate",
      "Your own rates beside the published ones",
      "Unpriced lines are shown, not guessed",
      "Works in rupees, with GST and Indian cost structure",
    ],
    access: COMING_SOON_NOTE("BidcoreAI Scale", "tender-management"),
    faqs: [
      {
        q: "What is BidcoreAI Scale?",
        a: "The takeoff and estimating product of BidcoreAI: quantity takeoff, BOQ, cost estimation on Indian cost models and your own rates, and the tender cost.",
      },
      {
        q: "How is Scale different from BidcoreAI Sync?",
        a: "Scale stops at the priced BOQ and the bid cost estimate. Sync includes everything in Scale and adds tender document analysis, Go / No-Go, schedules, project management, procurement and site operations.",
      },
      {
        q: "Which cost models are supported?",
        a: "CPWD Civil, CPWD E&M and MoRTH, plus company cost models you create from them. Check results against your own rates and the tender conditions before relying on them.",
      },
      {
        q: "Can I use Scale in the UAE, Singapore or another Asian country?",
        a: "India is the live market today. The takeoff and your own Company cost model do not depend on a country, so tell us where you work and we will plan it with you.",
      },
      {
        q: "How do I get started?",
        a: "Request a demo and a Bidcore team member will show you the product and share the pricing.",
      },
    ],
    finalCta: {
      heading: "Price your next BOQ on the cost model the tender uses",
      body: "Bring a BOQ and drawings. We will price it and show which lines still need a decision.",
      ctas: [demoFor("tender-management"), tenderConnectLive],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────────────────────────────── BidcoreAI Sync
  {
    slug: "sync",
    visual: "project-management",
    key: "all-in-one",
    name: "BidcoreAI Sync",
    availability: "coming-soon",
    metaTitle: "BidcoreAI Sync | End-to-End Construction Lifecycle Software for India and Asia",
    metaDescription:
      "BidcoreAI Sync connects tender analysis, takeoff, estimating, scheduling, budgeting, procurement and site operations on one platform for Indian EPC and general contractors.",
    headline: "One Platform from Tender to Site: the Whole Construction Lifecycle",
    intro:
      "BidcoreAI Sync carries one project from the tender notice to the site. It includes everything in BidcoreAI Scale and Tender Connect, and adds tender document analysis, Go / No-Go, the tender schedule, project management, procurement and site operations, so the numbers you bid with are the numbers you build against.",
    atAGlance: [
      "Tender documents analysed with page references",
      "Takeoff, BOQ and estimating on CPWD and MoRTH cost models (Scale)",
      "Tender schedule and a separate project schedule",
      "Budget, daily progress, procurement and site crews",
      "Subcontractor invitations through Tender Connect",
    ],
    ctas: {
      primary: explore("Explore Sync"),
      secondary: demoFor("all-in-one"),
      tertiary: pricing,
    },
    valueProps: [
      {
        title: "One project, one set of numbers",
        body: "The estimate, schedule and budget are built on the same project, so a change in one is visible in the others.",
      },
      {
        title: "From tender notice to site record",
        body: "Read the tender, decide to bid, price it, win it, plan it and record the work without re-entering anything.",
      },
      {
        title: "Built for Indian cost practice",
        body: "Rupees, GST, CPWD and MoRTH cost models, Indian WBS templates and tender structures such as MoRTH / NHIDCL highway EPC RFPs.",
      },
    ],
    audiences: [
      {
        title: "EPC and General Contractors",
        points: ["Assess a tender, price it, plan it and run it in one workspace", "Track budget against plan and the schedule against progress", "Source subcontractors through Tender Connect"],
      },
      {
        title: "Infrastructure and Highway Contractors",
        points: ["Work through highway RFPs clause by clause and track corrigenda", "Use road and highway WBS templates and productivity-based durations", "Assess schedule risk with P50 / P80 / P90 outcomes"],
      },
      {
        title: "Subcontractors and Site Teams",
        points: ["Track job costing and progress billing for the work you receive", "Plan your own crews and equipment", "Log daily progress, site visits and existing conditions with photos"],
      },
    ],
    capabilitiesHeading: "BidcoreAI Sync capabilities",
    capabilities: [
      {
        icon: FileSearch,
        title: "Tender Document Analysis",
        problem: "Key conditions are buried in hundreds of pages.",
        body: "Scan issued tender documents for clauses on bid security, insurance, damages, milestones and more. Each finding shows its document and page, and a topic that is not found is reported as not found, never as not required.",
        status: "coming-soon",
      },
      {
        icon: ClipboardCheck,
        title: "Eligibility and Go / No-Go",
        problem: "Bidding on a tender you do not qualify for wastes effort.",
        body: "Assess a tender against your Company Intelligence (turnover, net worth, credentials, commitments). Results are pass, fail, review or conditional; missing data is a review, and a restriction is a red flag but never an automatic No-Go.",
        status: "coming-soon",
      },
      {
        icon: ListChecks,
        title: "Bid Pack Checklist and Submission Review",
        problem: "It is easy to miss a required form or annexure.",
        body: "A checklist for the bid pack, ticked from your documents, takeoff, estimate and schedule, currently built around MoRTH / NHIDCL highway EPC RFPs, with a draft .docx. Signatures and seals are always left for you to confirm.",
        status: "coming-soon",
      },
      {
        icon: Ruler,
        title: "Everything in BidcoreAI Scale",
        problem: "Estimating tools that stop at the BOQ leave the rest to spreadsheets.",
        body: "Quantity takeoff, BOQ, cost estimation on CPWD Civil, CPWD E&M and MoRTH cost models or your own rates, and the Tender Cost workspace.",
        status: "coming-soon",
      },
      {
        icon: Gauge,
        title: "Tender Schedule, WBS and Productivity",
        problem: "A bid needs a credible programme, not a guess.",
        body: "Build a tender schedule from a Work Breakdown Structure and standard productivity rates, view it as a Gantt chart, and keep a separate Project Schedule for the job you win.",
        status: "coming-soon",
      },
      {
        icon: Banknote,
        title: "Budget and Cost Control",
        problem: "Overruns are noticed late.",
        body: "Sync the budget from the estimate, then track project cost against it in rupees, with approved changes and the forecast.",
        status: "coming-soon",
      },
      {
        icon: CalendarClock,
        title: "Project Schedule, Calendars and Risk",
        problem: "A single-date schedule hides uncertainty.",
        body: "A project Gantt with actual dates and baselines, a Preconstruction Calendar for tender dates, a Project Management Calendar for the job, and schedule risk with P50 / P80 / P90 outcomes.",
        status: "coming-soon",
      },
      {
        icon: HardHat,
        title: "Daily Progress and Site Records",
        problem: "Site records arrive late and in different formats.",
        body: "Daily progress reports of manpower, work done, materials and issues, plus site visits and existing-conditions surveys with photos.",
        status: "coming-soon",
      },
      {
        icon: ShoppingCart,
        title: "Procurement: Orders, Log and Change Orders",
        problem: "Orders tracked in chats and sheets lose their status.",
        body: "Purchase orders from draft to closed, a procurement log with supplier, lead time and onsite status, and change orders recorded against the project cost.",
        status: "coming-soon",
      },
      {
        icon: Wrench,
        title: "Site Operations: Crews, Equipment and Work Packages",
        problem: "Crews and machines get double-booked.",
        body: "A day-level calendar with conflict checks, a workforce directory, work packages with work orders, subcontractor capacity and a dashboard that shows where each figure comes from.",
        status: "coming-soon",
      },
      {
        icon: Megaphone,
        title: "Tender Connect Included",
        problem: "Subcontractor quotations arrive as mismatched files.",
        body: "Publish public or private tenders, invite contractors from the Bidcore directory and compare item-wise quotations on one BOQ. See BidcoreAI Tender Connect.",
        status: "live",
      },
      {
        icon: Truck,
        title: "Material Requirements, RFQs and Delivery Tracking",
        problem: "Requirements, quotations and deliveries sit in separate places.",
        body: "Generating material requirements from the BOQ, comparing supplier quotations and tracking deliveries as one linked workflow is not available yet.",
        status: "planned",
      },
      {
        icon: Boxes,
        title: "Productivity-based Crew Planning, Material Tracking and Billing",
        problem: "Plans and measured site output are not linked.",
        body: "Shift calendars, productivity-based crew planning, material integration, subcontractor measurement and billing, and variations and claims are on the roadmap and are not available yet.",
        status: "planned",
      },
    ],
    workflows: [
      {
        audience: "From tender notice to site record",
        steps: ["Analyse the Tender", "Check Eligibility and Decide", "Take Off and Estimate", "Invite and Compare Subcontractors", "Win, Budget and Schedule", "Procure, Run the Site and Report"],
        note: "Planned, not yet available: automatic material requirements from the BOQ, comparing supplier quotations, and subcontractor measurement and billing.",
      },
    ],
    benefitsHeading: "What a connected lifecycle gives you",
    benefits: [
      "The estimate you bid with becomes the budget you track",
      "Every tender finding traces back to a document and page",
      "Tender schedule and project schedule kept separate and in step",
      "Separate views for General Contractors and subcontractors",
    ],
    access: COMING_SOON_NOTE("BidcoreAI Sync", "all-in-one"),
    faqs: [
      {
        q: "What is BidcoreAI Sync?",
        a: "The end-to-end lifecycle product of BidcoreAI: tender analysis, takeoff and estimating, scheduling, budgeting, procurement and site operations on one platform.",
      },
      {
        q: "Does Sync include BidcoreAI Scale and Tender Connect?",
        a: "Yes. Everything in Scale and Tender Connect is part of Sync. Scale on its own is for teams that only need takeoff and estimating, and Tender Connect on its own is for publishing tenders and quoting.",
      },
      {
        q: "Does it guarantee that I will win a tender?",
        a: "No. It helps you read, check, price and prepare a bid, then run the job. Eligibility results are decision support and missing information is always shown for your review.",
      },
      {
        q: "Which tender documents does the bid pack support?",
        a: "The bid-pack checklist is currently built around MoRTH / NHIDCL highway EPC RFPs, with lease-auction and works-contract formats. Other tender structures are not claimed.",
      },
      {
        q: "Can I use Sync outside India?",
        a: "India is the live market today. For the UAE, Singapore and other Asian countries, tell us where you work and we will plan it with you.",
      },
      {
        q: "How do I get started?",
        a: "Request a demo and a Bidcore team member will show you the product and share the pricing.",
      },
    ],
    finalCta: {
      heading: "Run the job from the same numbers you bid with",
      body: "Request a demo and bring a tender. We will take it from the documents to the site plan with you.",
      ctas: [demoFor("all-in-one"), tenderConnectLive],
    },
  },
];

export const getProductPage = (slug: string): ProductPage | undefined => PRODUCT_PAGES.find((p) => p.slug === slug);
export const PRODUCT_SLUG_LIST = PRODUCT_PAGES.map((p) => p.slug);
