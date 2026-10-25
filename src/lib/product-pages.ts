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
import { signUpHref, type ProductKey } from "@/lib/app-links";

// Content for the five BidcoreAI product landing pages (/products/<slug>), rendered by components/product/ProductLanding.tsx.
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
  visual?: "tender-connect";
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

export type ProductSlug = "tender-connect" | "tender-management" | "project-management" | "procurement-management" | "site-management";

export const productHref = (slug: ProductSlug) => `/products/${slug}`;

const explore = (label: string): Cta => ({ label, href: "#capabilities" });
const pricing: Cta = { label: "View Pricing", href: "/pricing" };
const demo: Cta = { label: "Request a Demo", href: "/request-demo" };
/** Only Tender Connect has a free trial; every other product goes through Request a Demo, with the product pre-selected on the form. */
const DEMO_PRODUCT: Partial<Record<ProductKey, string>> = {
  "tender-management": "Tender Management",
  "project-management": "Project Management",
  procurement: "Procurement Management",
  "site-management": "Site Operations",
};
const demoFor = (key: ProductKey): Cta => ({ label: "Request a Demo", href: `/request-demo?product=${encodeURIComponent(DEMO_PRODUCT[key] ?? "")}` });
const tenderConnectLive: Cta = { label: "See Tender Connect", href: productHref("tender-connect") };

/** How the free allowance really works (backend/tender_entitlements.py: 7-day company-level trial, then the Tender Connect plan). One place to change if that rule changes. */
const TENDER_CONNECT_ACCESS: ProductPage["access"] = {
  heading: "7-day free trial. No credit card.",
  body:
    "Browsing public tenders and companies is free. Each company gets a 7-day free trial of Tender Connect that begins the first time you prepare a quotation or publish a tender, with no credit card. After the trial, one monthly or yearly plan covers publishing public and private tenders and submitting quotations.",
  rows: [
    ["Browse public tenders and companies", "Free"],
    ["Prepare and publish your first tenders / quotations", "7-day free trial per company, no card"],
    ["Keep publishing and submitting after the trial", "Monthly or yearly plan"],
    ["Your drafts, submitted quotations and records", "Kept, whatever your plan"],
  ],
  ctas: [
    { label: "Start Free", href: signUpHref("tender-connect") },
    { label: "View Pricing", href: "/pricing" },
  ],
};

const COMING_SOON_NOTE = (name: string, key: ProductKey): ProductPage["access"] => ({
  heading: "See it in a live demo",
  body: `Request a demo and a Bidcore team member will show you ${name} and share the pricing. The 7-day free trial is for Tender Connect (Starter Lite).`,
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
      "Connect General Contractors, Subcontractors and construction businesses through a common tendering workspace. Publish public or private tenders, invite contractors, discover construction opportunities, manage bid documents and receive quotations through a structured digital workflow.",
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
      tertiary: { label: "Start Free", href: signUpHref("tender-connect") },
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
        body: "Try Tender Connect free for 7 days with no credit card, then continue on a monthly or yearly plan. Browsing, drafts and past quotations never depend on a plan.",
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
        a: "Browsing is free. Each company gets a 7-day free trial, with no credit card, that starts when you first prepare a quotation or publish a tender. After that, a monthly or yearly plan applies. The current prices are always on the pricing page.",
      },
      {
        q: "Is the free trial per person?",
        a: "No. It is per company, so colleagues share one trial and creating another login does not start another.",
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

  // ────────────────────────────────────────────────────────────────────────────────────────── Tender Management
  {
    slug: "tender-management",
    key: "tender-management",
    name: "BidcoreAI Tender Management",
    availability: "coming-soon",
    metaTitle: "BidcoreAI Tender Management | Tender Preparation for Indian Contractors",
    metaDescription:
      "Prepare tenders, check eligibility, assess Go / No-Go and organise tender documents with BidcoreAI Tender Management for Indian contractors.",
    headline: "Manage Tender Preparation, Compliance and Bid Decisions in One Workspace",
    intro:
      "A workspace for General Contractors, EPC companies, infrastructure contractors and tendering teams to read tender documents, check eligibility, decide whether to bid, and prepare the bid.",
    atAGlance: [
      "Tender document analysis with page references",
      "Eligibility and Go / No-Go assessment",
      "Bid-pack preparation checklist",
      "Quantity takeoff, cost estimation and tender cost",
      "Tender schedule, WBS and productivity",
    ],
    ctas: {
      primary: explore("Explore Tender Management"),
      secondary: demoFor("tender-management"),
      tertiary: pricing,
    },
    valueProps: [
      {
        title: "Decide before you spend",
        body: "Check a tender against your company profile and its own requirements before committing your team's time to a bid.",
      },
      {
        title: "Nothing lost in a long document",
        body: "Tender findings keep the document and page they came from, so every requirement can be checked against the source.",
      },
      {
        title: "From documents to a priced bid",
        body: "Takeoff, estimating, scheduling and the bid pack sit in the same tender workspace.",
      },
    ],
    audiences: [
      {
        title: "General Contractors and EPC Companies",
        points: ["Assess large tenders against bid capacity and eligibility", "Prepare bid packs and track what is still missing", "Price and schedule the bid in one place"],
      },
      {
        title: "Infrastructure Contractors",
        points: ["Work through highway and infrastructure RFPs clause by clause", "Track corrigenda that change earlier values", "Calculate security and estimated project cost"],
      },
      {
        title: "Tendering and Estimating Teams",
        points: ["Share one source of truth for the tender", "Keep documents, rates and the schedule together", "Review the bidder's own prepared documents before submission"],
      },
    ],
    capabilitiesHeading: "Tender Management capabilities",
    capabilities: [
      {
        icon: FileSearch,
        title: "Tender Document Analysis",
        problem: "Key conditions are buried in hundreds of pages.",
        body: "Scan issued tender documents for clauses on bid security, insurance, damages, milestones and more. Each finding shows its document and page, and a topic that is not found is reported as not found, never as 'not required'.",
        status: "coming-soon",
      },
      {
        icon: ClipboardCheck,
        title: "Eligibility and Go / No-Go",
        problem: "Bidding on a tender you do not qualify for wastes effort.",
        body: "Assess a tender against your Company Intelligence (turnover, net worth, credentials, commitments). Results are pass, fail, review or conditional; missing data is a 'review', and a restriction is a red flag but never an automatic No-Go.",
        status: "coming-soon",
      },
      {
        icon: ListChecks,
        title: "Bid Pack Checklist",
        problem: "It is easy to miss a required form or annexure.",
        body: "A checklist for the bid pack, ticked from your documents, takeoff, estimate and schedule, currently built around MoRTH / NHIDCL highway EPC RFPs. Exports a draft .docx.",
        status: "coming-soon",
      },
      {
        icon: FileStack,
        title: "Tender Documentation and Amendments",
        problem: "Corrigenda change earlier values and are easy to overlook.",
        body: "A corrigendum tracker keeps both the earlier and the superseding value and flags it for review, and the Submission Review checks your prepared documents against the tender's figures. Signatures and seals are always left for you to confirm.",
        status: "coming-soon",
      },
      {
        icon: CalendarClock,
        title: "Submission Deadline Tracking",
        problem: "Missing a bidding-schedule date can disqualify a bid.",
        body: "The tender datasheet's bidding schedule is read into the workspace, and the project holds site visit and RFI due dates.",
        status: "coming-soon",
      },
      {
        icon: Ruler,
        title: "Takeoff, Cost Estimation and Tender Cost",
        problem: "Pricing a tender across drawings, rates and overheads is slow.",
        body: "Quantity takeoff, BOQ-based cost estimation with CPWD cost models, and a Tender Cost workspace with an estimated project cost calculation. Defaults not found in the tender are labelled as assumptions.",
        status: "coming-soon",
      },
      {
        icon: Gauge,
        title: "Tender Schedule, WBS and Productivity",
        problem: "A bid needs a credible programme, not a guess.",
        body: "Build a tender schedule from a Work Breakdown Structure and standard productivity rates, and view it as a Gantt chart.",
        status: "coming-soon",
      },
    ],
    workflows: [
      {
        audience: "From tender notice to bid decision",
        steps: ["Upload Tender Documents", "Review Analysis and Clauses", "Check Eligibility", "Make the Go / No-Go Decision", "Prepare Bid Pack and Price", "Review Before Submission"],
        note: "Tender invitations and opportunity discovery are part of Tender Connect.",
      },
    ],
    benefitsHeading: "Why tendering teams use a structured workspace",
    benefits: [
      "Every finding traces back to a document and page",
      "Eligibility gaps surface early, not at submission",
      "Estimating, schedule and bid pack stay connected",
      "Supports Indian cost models and tender structures",
    ],
    access: COMING_SOON_NOTE("BidcoreAI Tender Management", "tender-management"),
    faqs: [
      {
        q: "How do I get started?",
        a: "Request a demo and a Bidcore team member will show you the product and share the pricing. Only Tender Connect (Starter Lite) has a 7-day free trial.",
      },
      {
        q: "Does it guarantee that I will win a tender?",
        a: "No. It helps you read, check and prepare a bid. Eligibility results are decision support and missing information is always shown for your review.",
      },
      {
        q: "Which tender documents does the bid pack support?",
        a: "The bid-pack checklist is currently built around MoRTH / NHIDCL highway EPC RFPs. Other tender structures are not claimed.",
      },
      {
        q: "How is it different from Tender Connect?",
        a: "Tender Connect connects the party publishing a tender with the contractors responding to it. Tender Management is the preparation work a contractor does on a tender: analysis, eligibility, pricing and the bid pack.",
      },
    ],
    finalCta: {
      heading: "Prepare better bids, starting with Tender Connect",
      body: "Request a demo and a Bidcore team member will walk you through it.",
      ctas: [demoFor("tender-management"), tenderConnectLive],
    },
  },

  // ───────────────────────────────────────────────────────────────────────────────────────── Project Management
  {
    slug: "project-management",
    key: "project-management",
    name: "BidcoreAI Project Management",
    availability: "coming-soon",
    metaTitle: "BidcoreAI Project Management | BOQ, Estimating and Planning for India",
    metaDescription:
      "Connect BOQ, cost estimation, WBS, scheduling, daily progress reports and schedule risk with BidcoreAI Project Management for Indian contractors.",
    headline: "Connect Estimating, BOQ, Planning and Project Execution",
    intro:
      "A project workspace for Indian contractors that links the BOQ and cost estimate to the Work Breakdown Structure, schedule, budget and daily progress.",
    atAGlance: [
      "BOQ and resource-based cost estimation",
      "CPWD Civil, CPWD E&M and MoRTH cost models",
      "WBS, productivity-based durations and Gantt",
      "Budget, daily progress reports and schedule risk",
    ],
    ctas: {
      primary: explore("Explore Project Management"),
      secondary: demoFor("project-management"),
      tertiary: pricing,
    },
    valueProps: [
      {
        title: "One project, one set of numbers",
        body: "The estimate, schedule and budget are built on the same project, so a change in one is visible in the others.",
      },
      {
        title: "Built on Indian cost practice",
        body: "Work in rupees with CPWD and MoRTH cost models, rate analysis and Indian project and WBS templates.",
      },
      {
        title: "From plan to progress",
        body: "Daily progress reports and schedule forecasts keep the plan honest once work starts.",
      },
    ],
    audiences: [
      {
        title: "General Contractors and EPC Companies",
        points: ["Plan and cost projects from BOQ to schedule", "Track budget against plan", "Report progress consistently"],
      },
      {
        title: "Infrastructure and Civil Contractors",
        points: ["Use road and building WBS templates", "Plan with productivity-based durations", "Assess schedule risk"],
      },
      {
        title: "Subcontractors",
        points: ["Track job costing and progress billing for work received", "Log daily progress against the job"],
      },
    ],
    capabilitiesHeading: "Project Management capabilities",
    capabilities: [
      {
        icon: ClipboardList,
        title: "BOQ Management",
        problem: "BOQs live in spreadsheets that drift from the estimate.",
        body: "Build and maintain the project BOQ in the workspace, including item-rate BOQs for government tenders.",
        status: "coming-soon",
      },
      {
        icon: Calculator,
        title: "Cost Estimation and CPWD Cost Models",
        problem: "Rate analysis by hand is slow and hard to audit.",
        body: "Resource-based costing with CPWD Civil, CPWD E&M and MoRTH cost models, rate analysis, and market-rate and vendor-quote references.",
        status: "coming-soon",
      },
      {
        icon: Boxes,
        title: "Work Breakdown Structure",
        problem: "Different project types need different work scopes.",
        body: "Standard WBS templates for project types such as buildings and roads, which you can edit for your project and reset to standard.",
        status: "coming-soon",
      },
      {
        icon: Gauge,
        title: "Productivity-based Duration Planning",
        problem: "Durations guessed without crew productivity are unreliable.",
        body: "Standard Indian productivity rates seed durations. You can override any rate for your project or company, and the standard row is never edited.",
        status: "coming-soon",
      },
      {
        icon: CalendarClock,
        title: "Schedule and Gantt",
        problem: "Schedules built apart from cost cannot be reconciled with it.",
        body: "Generate a schedule from the WBS, view it as a Gantt chart and forecast the finish.",
        status: "coming-soon",
      },
      {
        icon: Banknote,
        title: "Budget and Cost Control",
        problem: "Overruns are noticed late.",
        body: "Track project cost against budget in rupees.",
        status: "coming-soon",
      },
      {
        icon: HardHat,
        title: "Daily Progress Reports",
        problem: "Site records arrive late and in different formats.",
        body: "Log manpower, work done, materials and issues each day, with photos and an Existing Conditions Survey.",
        status: "coming-soon",
      },
      {
        icon: ShieldAlert,
        title: "Schedule Risk Assessment and Reports",
        problem: "A single-date schedule hides uncertainty.",
        body: "Time and cost risk with P50 / P80 / P90 outcomes, a risk register and downloadable Excel and PDF reports.",
        status: "coming-soon",
      },
    ],
    workflows: [
      {
        audience: "From estimate to execution",
        steps: ["Set Up Project", "Build BOQ and Estimate", "Define WBS", "Plan Schedule with Productivity", "Track Budget and Daily Progress", "Report and Review Risk"],
        note: "We do not claim every cost model or automation is production-ready for your project; review results before relying on them.",
      },
    ],
    benefitsHeading: "What a connected project workflow gives you",
    benefits: [
      "Estimate, WBS, schedule and budget on one project record",
      "Rates and templates suited to Indian projects",
      "Overrides never edit the standard data",
      "Reports you can export and share",
    ],
    access: COMING_SOON_NOTE("BidcoreAI Project Management", "project-management"),
    faqs: [
      {
        q: "How do I get started?",
        a: "Request a demo and a Bidcore team member will show you the product and share the pricing. Only Tender Connect (Starter Lite) has a 7-day free trial.",
      },
      {
        q: "Which cost models are supported?",
        a: "The BidcoreAI application supports CPWD Civil, CPWD E&M and MoRTH cost models. Check the results against your own rates and tender conditions before relying on them.",
      },
      {
        q: "Can I use it for road projects?",
        a: "The workspace includes road and highway characteristics (length, lanes, terrain) and WBS templates. Fit for any particular project should be reviewed.",
      },
      {
        q: "Does it guarantee estimating accuracy?",
        a: "No. It speeds up and structures estimating; the figures depend on the inputs and rates you choose.",
      },
    ],
    finalCta: {
      heading: "Plan the project from the same numbers you bid with",
      body: "Request a demo and a Bidcore team member will walk you through it.",
      ctas: [demoFor("project-management"), tenderConnectLive],
    },
  },

  // ────────────────────────────────────────────────────────────────────────────────────── Procurement Management
  {
    slug: "procurement-management",
    key: "procurement",
    name: "BidcoreAI Procurement Management",
    availability: "coming-soon",
    metaTitle: "BidcoreAI Procurement Management | Construction Procurement in India",
    metaDescription:
      "Track purchase orders, suppliers, material lead times, deliveries and change orders around project requirements with BidcoreAI Procurement Management.",
    headline: "Organize Construction Procurement Around Project Requirements",
    intro:
      "Keep purchase orders, suppliers, material lead times and delivery status together inside the project.",
    atAGlance: ["Purchase orders from draft to closed", "Procurement log with supplier and lead time", "Change orders against the budget", "Vendor quote references"],
    ctas: {
      primary: explore("Explore Procurement Management"),
      secondary: demoFor("procurement"),
      tertiary: pricing,
    },
    valueProps: [
      {
        title: "Orders kept with project costs",
        body: "Purchase orders and change orders sit in the project's cost workspace, alongside its other costs.",
      },
      {
        title: "Know what is still due on site",
        body: "A procurement log shows supplier, lead time, quantity status and whether an item is on site.",
      },
      {
        title: "A clear record of orders",
        body: "Each order moves through a status and keeps its dates and notes.",
      },
    ],
    audiences: [
      {
        title: "General Contractors and EPC Companies",
        points: ["Raise and track purchase orders by vendor or subcontractor", "Record supplier lead times for long-lead items"],
      },
      {
        title: "Purchase and Site Teams",
        points: ["See which items are ordered, shipped or onsite", "Keep supplier and ball-in-court notes together"],
      },
      {
        title: "Subcontractors",
        points: ["Track materials and orders for the jobs you hold"],
      },
    ],
    capabilitiesHeading: "Procurement capabilities",
    capabilities: [
      {
        icon: ShoppingCart,
        title: "Purchase Orders",
        problem: "Orders tracked in chats and sheets lose their status.",
        body: "Raise purchase orders with PO number, vendor or subcontractor, issue and delivery dates, and a status from draft through issued, approved, received and closed.",
        status: "coming-soon",
      },
      {
        icon: Package,
        title: "Procurement Log",
        problem: "Nobody knows which long-lead items are late.",
        body: "A log of items with quantity, unit, supplier, lead time, quantity status, onsite and ball-in-court columns.",
        status: "coming-soon",
      },
      {
        icon: Receipt,
        title: "Change Orders",
        problem: "Changes to an order are hard to trace to cost.",
        body: "Record change orders against an order in the project's cost workspace.",
        status: "coming-soon",
      },
      {
        icon: Search,
        title: "Supplier Rates and Quotes",
        problem: "Rate decisions need a reference.",
        body: "Market-rate and vendor-quote references from the cost-intelligence workspace support pricing decisions.",
        status: "coming-soon",
      },
      {
        icon: Truck,
        title: "Material Requirements, RFQs and Delivery Tracking",
        problem: "Requirements, quotations and deliveries sit in separate places.",
        body: "Generating material requirements from the BOQ, inviting and comparing supplier quotations, and tracking deliveries as one linked workflow is not available yet.",
        status: "planned",
      },
    ],
    workflows: [
      {
        audience: "From requirement to delivery",
        steps: ["Identify Requirement", "Raise Purchase Order", "Track Lead Time", "Receive on Site", "Record Change Orders", "Close the Order"],
        note: "Planned, not yet available: automatic material requirements from the BOQ and comparing supplier quotations side by side.",
      },
    ],
    benefitsHeading: "Why link procurement to the project",
    benefits: ["Orders and change orders kept with the project", "Lead times and onsite status recorded per item", "A single history of each order and change"],
    access: COMING_SOON_NOTE("BidcoreAI Procurement Management", "procurement"),
    faqs: [
      {
        q: "How do I get started?",
        a: "Request a demo and a Bidcore team member will show you the product and share the pricing. Only Tender Connect (Starter Lite) has a 7-day free trial.",
      },
      {
        q: "Can I compare supplier quotations?",
        a: "Supplier quotation comparison is planned, not available yet. For tenders, quotations from contractors can already be compared in Tender Connect.",
      },
      {
        q: "Is it linked to my BOQ?",
        a: "Orders sit inside a project alongside its budget. Generating requirements automatically from the BOQ is planned and is not claimed as live.",
      },
    ],
    finalCta: {
      heading: "Start with Tender Connect and grow into procurement",
      body: "Request a demo and a Bidcore team member will walk you through it.",
      ctas: [demoFor("procurement"), tenderConnectLive],
    },
  },

  // ───────────────────────────────────────────────────────────────────────────────────────────── Site Operations
  {
    slug: "site-management",
    key: "site-management",
    name: "BidcoreAI Site Operations",
    availability: "coming-soon",
    metaTitle: "BidcoreAI Site Operations | Site Planning and Progress for India",
    metaDescription:
      "Plan crews and equipment, manage work packages and subcontractor capacity, and log daily site progress with BidcoreAI Site Operations.",
    headline: "Connect Site Progress, Resources and Project Planning",
    intro:
      "Plan crews and equipment, issue work packages and orders, and record daily progress, connected to the project's budget and schedule.",
    atAGlance: ["Day-level resource planning with conflicts", "Work packages and work orders", "Subcontractor capacity", "Daily progress reports"],
    ctas: {
      primary: explore("Explore Site Operations"),
      secondary: demoFor("site-management"),
      tertiary: pricing,
    },
    valueProps: [
      {
        title: "Spot double bookings early",
        body: "A day-level calendar flags a crew or machine assigned twice, or capacity exceeded, before work starts.",
      },
      {
        title: "Work orders with a clear lifecycle",
        body: "Work packages move from draft to approved to released with a work order number, and approved scope is locked.",
      },
      {
        title: "Figures with a source",
        body: "Dashboard figures show where they come from, and a figure with no data says so instead of guessing.",
      },
    ],
    audiences: [
      {
        title: "General Contractors",
        points: ["Plan resources and subcontractor capacity", "Issue and track work packages and orders"],
      },
      {
        title: "Subcontractors",
        points: ["Plan your own crews and equipment", "Track jobs and work orders received from contractors"],
      },
      {
        title: "Site Teams",
        points: ["Log daily progress, manpower and issues", "Record site visits and existing conditions with photos"],
      },
    ],
    capabilitiesHeading: "Site Operations capabilities",
    capabilities: [
      {
        icon: CalendarClock,
        title: "Resource Planning",
        problem: "Crews and machines get double-booked.",
        body: "A day-level calendar with conflict checks for double booking, over-allocation and unavailability such as leave, maintenance or breakdown.",
        status: "coming-soon",
      },
      {
        icon: Wrench,
        title: "Crews and Equipment",
        problem: "Resource lists scatter across sheets.",
        body: "Keep crews and equipment in one list with their unavailability windows.",
        status: "coming-soon",
      },
      {
        icon: ClipboardCheck,
        title: "Work Packages and Orders",
        problem: "Scope changes after approval cause disputes.",
        body: "Draft, submit, approve and release work packages with a work order number, hold or complete them, and lock the approved scope.",
        status: "coming-soon",
      },
      {
        icon: Users,
        title: "Subcontractor Capacity",
        problem: "Capacity is assumed, not known.",
        body: "See the capacity a subcontractor has declared and what is already committed, never inferred.",
        status: "coming-soon",
      },
      {
        icon: LayoutDashboard,
        title: "Operations Dashboard",
        problem: "Site and office numbers disagree.",
        body: "A dashboard reading the project budget and schedule forecast, with each figure's source shown.",
        status: "coming-soon",
      },
      {
        icon: HardHat,
        title: "Daily Progress and Site Records",
        problem: "Daily records are late or missing.",
        body: "Daily progress reports of manpower, work done, materials and issues, plus site visits and existing-conditions surveys with photos.",
        status: "coming-soon",
      },
      {
        icon: Boxes,
        title: "Productivity-based Crew Planning, Material Tracking and Billing",
        problem: "Plans and measured site output are not linked.",
        body: "Shift calendars, productivity-based crew planning, daily-progress and material integration, subcontractor measurement and billing, and variations and claims are on the roadmap and are not available yet.",
        status: "planned",
      },
    ],
    workflows: [
      {
        audience: "From plan to site record",
        steps: ["Add Crews and Equipment", "Plan on the Calendar", "Resolve Conflicts", "Release Work Packages", "Log Daily Progress", "Review the Dashboard"],
        note: "Planned, not yet available: multi-project deployment depth, subcontractor measurement and billing, and richer site-to-office reporting.",
      },
    ],
    benefitsHeading: "Why connect the site to the plan",
    benefits: ["Conflicts found before they cost a day", "Approved scope stays fixed", "Every figure shows its source", "Separate views for General Contractors and subcontractors"],
    access: COMING_SOON_NOTE("BidcoreAI Site Operations", "site-management"),
    faqs: [
      {
        q: "How do I get started?",
        a: "Request a demo and a Bidcore team member will show you the product and share the pricing. Only Tender Connect (Starter Lite) has a 7-day free trial.",
      },
      {
        q: "Can a subcontractor see my work packages?",
        a: "Not yet. A subcontractor workspace works on the subcontractor's own records; sharing work orders across companies is planned.",
      },
      {
        q: "Does it replace daily site reporting?",
        a: "It includes daily progress reports. Integration of daily progress with material tracking is planned and is not available yet.",
      },
    ],
    finalCta: {
      heading: "Run the site from the same plan",
      body: "Request a demo and a Bidcore team member will walk you through it.",
      ctas: [demoFor("site-management"), tenderConnectLive],
    },
  },
];

export const getProductPage = (slug: string): ProductPage | undefined => PRODUCT_PAGES.find((p) => p.slug === slug);
export const PRODUCT_SLUG_LIST = PRODUCT_PAGES.map((p) => p.slug);
