// Content for the Solutions pages (/solutions, /solutions/<slug>): how Bidcore helps each kind of contractor. Every capability named here is one that the product pages
// (lib/product-pages.ts) already describe; the pages link to those product pages. Nothing here states prices, customer counts, savings or results.

export interface SolutionItem {
  title: string;
  body: string;
  /** Where to read more: an existing page of the site. */
  link: { label: string; href: string };
}

export interface Solution {
  slug: string;
  /** Short name for menus and cards, e.g. "EPC Contractors". */
  name: string;
  summary: string;
  metaTitle: string;
  metaDescription: string;
  headline: string;
  intro: string;
  items: SolutionItem[];
  /** An honest limit worth stating (what Bidcore is not). */
  note?: string;
  /** Set for entries that are not an audience (Custom Solutions): wording and the main action differ. */
  custom?: { eyebrow: string; itemsHeading: string; cta: { label: string; href: string }; examples: { title: string; body: string }[] };
}

const TM = "/products/tender-management";
const TC = "/products/tender-connect";
const PM = "/products/project-management";
const PROC = "/products/procurement-management";
const SITE = "/products/site-management";

export const SOLUTIONS: Solution[] = [
  {
    slug: "epc-contractors",
    name: "EPC Contractors",
    summary: "Read tenders, price bids, source subcontractors and run the project.",
    metaTitle: "Construction Software for EPC Contractors | Bidcore",
    metaDescription: "Bidcore for EPC contractors in India: tender analysis and Go / No-Go, estimating, subcontractor sourcing, project planning, procurement and site operations.",
    headline: "Bid, source and deliver EPC projects on one platform",
    intro:
      "EPC work runs from a tender notice through estimating, subcontractor packages, procurement and site execution. Bidcore connects those steps for Indian EPC contractors, so the numbers and documents do not have to be rebuilt at each stage.",
    items: [
      {
        title: "Read the tender and decide whether to bid",
        body: "Scan tender documents for key conditions with document and page references, check eligibility against your company profile, and run a Go / No-Go assessment.",
        link: { label: "Tender Management", href: TM },
      },
      {
        title: "Prepare the bid",
        body: "Digital quantity takeoff using PDFs, cost estimation with CPWD, E&M and MoRTH cost models, tender cost and schedule, and a bid-pack checklist built around MoRTH / NHIDCL highway EPC RFPs.",
        link: { label: "Tender Management", href: TM },
      },
      {
        title: "Source and compare subcontractors",
        body: "Publish a package as a public tender or invite your own network, qualify bidders with questionnaires, and compare item-wise quotations side by side against one BOQ.",
        link: { label: "Tender Connect", href: TC },
      },
      {
        title: "Plan and control the project",
        body: "WBS templates, productivity-based scheduling and Gantt, budget and cost control, schedule risk assessment and reports.",
        link: { label: "Project Management", href: PM },
      },
      {
        title: "Buy and run the site",
        body: "Purchase orders, a procurement log and change orders; resource planning, work packages and subcontractor capacity; daily progress reports.",
        link: { label: "Procurement and Site Operations", href: SITE },
      },
      {
        title: "Find suppliers, manufacturers and consultants",
        body: "Search the marketplace for companies, products and services across India.",
        link: { label: "Marketplace", href: "/marketplace" },
      },
    ],
  },
  {
    slug: "general-contractors",
    name: "General Contractors",
    summary: "Source subcontractors, price work and keep projects on track.",
    metaTitle: "Construction Software for General Contractors | Bidcore",
    metaDescription: "Bidcore for general contractors in India: publish tender packages, compare subcontractor quotations, estimate, schedule and manage projects.",
    headline: "Source subcontractors, price work and run projects in one place",
    intro:
      "General contractors spend their time on packages: scoping them, finding the right subcontractors, comparing quotations and then tracking the work. Bidcore puts those steps in one workflow.",
    items: [
      {
        title: "Publish work packages",
        body: "Send a package to your own network privately, or publish it as a public tender on Bidcore.in. Share the BOQ and documents, with visibility set per document.",
        link: { label: "Tender Connect", href: TC },
      },
      {
        title: "Qualify bidders and compare quotations",
        body: "Screen with qualification questionnaires, then compare item-wise rates from every bidder against the same BOQ, and export the comparison.",
        link: { label: "Tender Connect", href: TC },
      },
      {
        title: "Estimate and price",
        body: "Digital quantity takeoff using PDFs and BOQ-based cost estimation with CPWD, E&M and MoRTH cost models.",
        link: { label: "Tender Management", href: TM },
      },
      {
        title: "Schedule and budget",
        body: "Generate a schedule from a WBS using standard productivity rates, track cost against budget, and review schedule risk.",
        link: { label: "Project Management", href: PM },
      },
      {
        title: "Record site progress",
        body: "Daily progress reports with manpower, work done, materials and issues, plus site visits and existing-conditions surveys.",
        link: { label: "Project Management", href: PM },
      },
      {
        title: "Order materials and manage changes",
        body: "Purchase orders, a procurement log and change orders kept with the project.",
        link: { label: "Procurement Management", href: PROC },
      },
    ],
  },
  {
    slug: "design-build-contractors",
    name: "Design-Build Contractors",
    summary: "Estimate and plan early, and source specialists for the whole package.",
    metaTitle: "Construction Software for Design-Build Contractors | Bidcore",
    metaDescription: "Bidcore for design-build contractors in India: early estimating, WBS and scheduling, sourcing specialist subcontractors and consultants, and cost control.",
    headline: "Estimate, plan and source from concept to construction",
    intro:
      "Design-build work asks you to price and plan early, then bring in specialist trades and consultants. Bidcore supports the estimating, sourcing, planning and delivery side of that work.",
    items: [
      {
        title: "Price early",
        body: "Digital quantity takeoff using PDFs, BOQ-based cost estimation with CPWD, E&M and MoRTH cost models, and a tender cost workspace.",
        link: { label: "Tender Management", href: TM },
      },
      {
        title: "Plan the work",
        body: "WBS templates by project type, productivity-based durations, and a schedule you can view as a Gantt chart.",
        link: { label: "Project Management", href: PM },
      },
      {
        title: "Bring in specialist trades",
        body: "Publish packages to the subcontractors you choose, or openly, and compare their item-wise quotations.",
        link: { label: "Tender Connect", href: TC },
      },
      {
        title: "Find consultants and suppliers",
        body: "Search the marketplace for consultants, architects, suppliers and manufacturers.",
        link: { label: "Marketplace", href: "/marketplace" },
      },
      {
        title: "Control cost through delivery",
        body: "Budget and cost control, purchase orders and change orders.",
        link: { label: "Project Management", href: PM },
      },
      {
        title: "Report and review risk",
        body: "Daily progress reports and schedule risk assessment with exportable reports.",
        link: { label: "Project Management", href: PM },
      },
    ],
    note: "Bidcore supports the estimating, sourcing, planning and delivery side of design-build. It is not design or modelling software.",
  },
  {
    slug: "subcontractors",
    name: "Subcontractors",
    summary: "Find work, quote with confidence and run your jobs.",
    metaTitle: "Construction Software for Subcontractors | Bidcore",
    metaDescription: "Bidcore for subcontractors in India: discover public tenders, receive invitations, check eligibility, submit quotations and plan crews and jobs.",
    headline: "Find work, win bids and run your jobs",
    intro:
      "Subcontractors need a steady flow of relevant tenders, a quick way to quote, and a clear view of their own crews and jobs. Bidcore covers each of those.",
    items: [
      {
        title: "Discover tenders",
        body: "Search public tenders by state, city, category and keywords, and receive private invitations from contractors.",
        link: { label: "Public Tenders", href: "/tenders" },
      },
      {
        title: "Check eligibility before you quote",
        body: "Run a Go / No-Go check against the tender's requirements and your company profile. Missing information is shown for review, never as a pass.",
        link: { label: "Tender Connect", href: TC },
      },
      {
        title: "Prepare and submit quotations",
        body: "Price item by item against the tender's BOQ, attach supporting documents, and track your opportunities and closing dates.",
        link: { label: "Tender Connect", href: TC },
      },
      {
        title: "Be found by contractors",
        body: "Build a company profile and list your business so general contractors and procurement teams can discover you.",
        link: { label: "List Your Business", href: "/marketplace/list-your-business" },
      },
      {
        title: "Plan crews and equipment",
        body: "A subcontractor workspace for crew and resource planning, with jobs and work orders you receive from contractors.",
        link: { label: "Site Operations", href: SITE },
      },
      {
        title: "Track job cost and billing",
        body: "Job costing and progress billing for the work you take on.",
        link: { label: "Project Management", href: PM },
      },
    ],
  },
  {
    slug: "custom-solutions",
    name: "Custom Solutions",
    summary: "Integrate your existing products and systems with BidcoreAI.",
    metaTitle: "Custom Solutions: Integrate Your Existing Products with BidcoreAI | Bidcore",
    metaDescription: "Already use other software or build your own construction product? Talk to Bidcore about a custom solution that integrates it with BidcoreAI.",
    headline: "Connect your existing products with BidcoreAI",
    intro:
      "If you already run other software, or build a product of your own for construction, we can discuss a custom solution that integrates it with BidcoreAI, so your teams are not working in separate silos.",
    items: [
      {
        title: "Start from what you use today",
        body: "Estimating, scheduling, accounting, ERP, site or field tools, or spreadsheets: we start from your current workflow and what you want to connect.",
        link: { label: "Explore BidcoreAI products", href: "/products" },
      },
      {
        title: "Agree what data moves, and in which direction",
        body: "For example BOQs and estimates, schedules, tenders and quotations, or daily progress reports, flowing between your system and BidcoreAI.",
        link: { label: "Tender Management", href: TM },
      },
      {
        title: "Workflows that fit how you work",
        body: "Tailor how tendering, project management, procurement and site operations work alongside the systems you already depend on.",
        link: { label: "Project Management", href: PM },
      },
      {
        title: "Own a construction product or service?",
        body: "List your business on the marketplace so contractors and procurement teams can find your products and services.",
        link: { label: "List Your Business", href: "/marketplace/list-your-business" },
      },
    ],
    note: "Custom solutions are scoped case by case. They are not a catalogue of ready-made connectors, so tell us what you need and we will discuss what is possible.",
    custom: {
      eyebrow: "Custom Solutions",
      itemsHeading: "What a custom solution can cover",
      cta: { label: "Discuss a Custom Solution", href: `/request-demo?product=${encodeURIComponent("Custom solutions / integration")}` },
      examples: [
        {
          title: "Quantity Takeoff Solutions for Global Service Provider Companies",
          body: "Digital quantity takeoff from PDF drawings, shaped around how a service provider produces takeoffs for clients in different markets and keeps the work consistent across projects and teams.",
        },
        {
          title: "Document Analysis using BidcoreAI",
          body: "BidcoreAI reads tender documents and reports findings with the document and page they came from. A custom solution can apply that kind of analysis to your own document sets and review workflow.",
        },
        {
          title: "API Integration",
          body: "Connect your systems and BidcoreAI so that data such as BOQs, estimates, schedules or reports moves between them without re-keying. Scoped for your systems and your workflow.",
        },
        {
          title: "AI Integration on your Existing Product",
          body: "Bring BidcoreAI's AI capabilities, such as takeoff and document analysis, into a product you already offer, so your users get them inside the tools they already use.",
        },
      ],
    },
  },
];

export const getSolution = (slug: string): Solution | undefined => SOLUTIONS.find((s) => s.slug === slug);
