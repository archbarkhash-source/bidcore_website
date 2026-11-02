// Search-focused guide pages (/software/<slug>) for the words people type: construction bidding software, tender management software, estimation software, AI tender search,
// bid proposal software, AI and agentic software, and comparisons. Truthfulness rules: say only what the BidcoreAI application does today; India is the live market (CPWD, CPWD E&M
// and MoRTH cost models, tender-document analysis, Tender Connect); other Asian countries are "on request", never described as supported. Competitor facts come from their own public
// pages (as of November 2026) and are labelled as such. No prices, counts, ratings or testimonials.

export interface GuideSection {
  h2: string;
  paras?: string[];
  bullets?: string[];
}

export interface GuidePage {
  slug: string;
  metaTitle: string;
  metaDescription: string;
  eyebrow: string;
  h1: string;
  lead: string;
  highlights: string[];
  sections: GuideSection[];
  table?: { heading: string; cols: string[]; rows: string[][]; note: string };
  faqs: { q: string; a: string }[];
  related: { label: string; href: string }[];
  cta: { heading: string; body: string };
}

const COMPETITOR_NOTE =
  "Competitor information comes from each vendor's public website and from software review sites, as of November 2026, and may be out of date. Product names belong to their owners; BidcoreAI is not affiliated with them. If something here is wrong, tell us and we will correct it.";

export const GUIDE_PAGES: GuidePage[] = [
  {
    slug: "construction-bidding-software",
    metaTitle: "Construction Bidding Software for Contractors in India | Bidcore",
    metaDescription: "Construction bidding software for EPC and general contractors: invite subcontractors, compare their quotations item by item, check eligibility and draft the proposal.",
    eyebrow: "Bidding",
    h1: "Construction Bidding Software for EPC and General Contractors",
    lead: "Bidding is where a good estimate gets lost: scope that nobody quoted, quotations that cannot be compared, and a deadline that arrives before the answers do. Bidcore Tender Connect puts the package, the invitations and the comparison in one place.",
    highlights: ["Tender packages from your estimate", "Invite from the Bidcore contractor directory", "Item-wise quotation comparison", "Eligibility checked before you invest time"],
    sections: [
      {
        h2: "What a bidding workspace should do",
        paras: [
          "A contractor bidding a package needs to know who has been invited, who has answered Bidding, Not bidding or Not sure, and which quotations cover the whole scope. Tracking that in e-mail and spreadsheets is where things are missed.",
          "Tender Connect keeps a tender package with its documents, its bid form and its due dates, sends invitations, records every answer and brings the quotations into one comparison.",
        ],
      },
      {
        h2: "How it works in Bidcore",
        bullets: [
          "Create a tender package with its documents and a bid form (questions, BOQ line items, alternates).",
          "Invite subcontractors you already know, or search the Bidcore contractor directory by trade and city. Bidcore sends the invitation, so contractors respond on bidcore.in.",
          "Contractors answer Bidding, Not bidding or Not sure, upload their quotation and message you through Bidcore.",
          "Compare quotations item by item against one BOQ, and share a contractor's contact details only when they approve.",
          "Publish a public tender when you want more quotations than your own network gives you.",
        ],
      },
      {
        h2: "Before you bid: eligibility",
        paras: ["Go / No-Go checks a tender's requirements against your Company Intelligence (turnover, net worth, similar works, surety cover). Missing data is shown as REVIEW and is never counted as a pass."],
      },
    ],
    faqs: [
      { q: "What is construction bidding software?", a: "Software that helps a contractor manage the bidding of a project: packaging the scope, inviting subcontractors, tracking their answers, comparing quotations and preparing the proposal." },
      { q: "Can I invite contractors I do not know yet?", a: "Yes. The Bidcore contractor directory lists EPC contractors, subcontractors and design-build contractors, starting with Mumbai and Delhi. Bidcore sends the invitation, so you do not need their e-mail address." },
      { q: "Do contractors need to install anything to respond?", a: "No. They open the invitation link, confirm their e-mail address with a code, and answer on bidcore.in." },
      { q: "Is my contact information shared with contractors?", a: "Contractors' e-mail and phone are not shared with you unless they choose to approve it, and yours are not shared unless you choose to." },
      { q: "Does it work outside India?", a: "India is the live market today. For other Asian countries, see our page on construction software for Asia." },
    ],
    related: [
      { label: "Tender Connect", href: "/products/tender-connect" },
      { label: "Tender management software", href: "/software/tender-management-software" },
      { label: "AI tender search", href: "/software/ai-tender-search" },
      { label: "Find contractors", href: "/contractors" },
    ],
    cta: { heading: "Run your next package through Tender Connect", body: "Bring a package you are about to bid. We will set up the invitations and the comparison with you." },
  },
  {
    slug: "tender-management-software",
    metaTitle: "Tender Management Software for Contractors in India | Bidcore",
    metaDescription: "Tender management software: analyse tender documents with page references, take off quantities, estimate with CPWD and MoRTH cost models and build the tender cost.",
    eyebrow: "Tender management",
    h1: "Tender Management Software: From Tender Documents to the Bid Price",
    lead: "A tender is won or lost in the weeks before submission. Bidcore Tender Management reads the tender documents, measures the drawings, prices the work and builds the tender cost in one workspace, with every finding pointing to the page it came from.",
    highlights: ["Tender documents analysed with page references", "Takeoff, BOQ and cost estimation", "CPWD, CPWD E&M and MoRTH cost models", "Tender cost, EMD and securities calculators"],
    sections: [
      {
        h2: "Read the tender before you price it",
        paras: ["Tender Documents analysis reads the issued documents (RFP, datasheet, schedules and corrigenda) and lists the bid security, performance security, dates and requirements, each with its document and page. A figure is never invented: where a document does not say, it says so."],
      },
      {
        h2: "Measure, estimate and cost the tender",
        bullets: [
          "Digital quantity takeoff from PDF drawings, with AI-assisted counting.",
          "Cost estimation against CPWD Civil, CPWD E&M and MoRTH cost models, or your own company cost model.",
          "Item-rate BOQ for service contracts and lease auctions, with the tender's own terms.",
          "Tender Cost: overheads, GST, profit and the bid cost estimate, with EMD and security calculators.",
          "Tender schedule, WBS and productivity from the BOQ.",
        ],
      },
      {
        h2: "Qualify and decide",
        paras: ["Go / No-Go compares the tender's eligibility requirements with your company's figures: turnover, net worth, similar works and bid capacity. A mandatory failure is NO-GO; missing data is REVIEW."],
      },
    ],
    faqs: [
      { q: "What is tender management software?", a: "It supports the whole tender effort: reading the documents, qualifying the tender, measuring and pricing, building the bid price and tracking the schedule to submission." },
      { q: "Which cost models are included?", a: "CPWD Civil, CPWD E&M and MoRTH, plus company cost models you create from them." },
      { q: "Does the AI make up figures?", a: "No. Findings come from the documents with their page numbers, and a figure the documents do not state is shown as missing for you to enter." },
      { q: "Can I use it for highway EPC tenders?", a: "Yes. Tender Documents supports MoRTH / NHIDCL highway EPC bid packs, including security rules and bid capacity." },
    ],
    related: [
      { label: "Tender Management", href: "/products/tender-management" },
      { label: "Construction estimation software", href: "/software/construction-estimation-software" },
      { label: "Construction bidding software", href: "/software/construction-bidding-software" },
      { label: "Bid proposal software", href: "/software/bid-proposal-software" },
    ],
    cta: { heading: "See a tender read, priced and costed", body: "Bring a tender you are bidding. We will take it from the documents to the bid cost estimate with you." },
  },
  {
    slug: "construction-estimation-software",
    metaTitle: "Construction Estimation Software with CPWD and MoRTH Cost Models | Bidcore",
    metaDescription: "Construction estimation software for India: digital takeoff, BOQ and cost estimation with CPWD, CPWD E&M and MoRTH cost models and your own company rates.",
    eyebrow: "Estimation",
    h1: "Construction Estimation Software with CPWD, CPWD E&M and MoRTH Cost Models",
    lead: "Estimating for Indian public works starts with the schedule of rates. Bidcore brings the CPWD and MoRTH cost models into the estimate, so a BOQ line can be priced from a rate analysis instead of a guess.",
    highlights: ["CPWD Civil, CPWD E&M and MoRTH models", "Auto Assign of rate analyses to BOQ lines", "Your own company cost model", "BOQ, schedule and budget from one estimate"],
    sections: [
      {
        h2: "From drawing to priced BOQ",
        bullets: [
          "Take off quantities from PDF drawings and group them under Sub Heads or Chapters.",
          "Auto Assign matches each BOQ line to an assembly (rate analysis) in the cost model; lines it cannot price are left empty rather than guessed, and say so.",
          "Copy items from CPWD, CPWD E&M or MoRTH into your own Company cost model and set your own rates.",
          "Add Project Factors: overheads, profit, GST and general conditions.",
        ],
      },
      {
        h2: "One estimate, many uses",
        paras: ["The same estimate feeds tender packages for subcontractors, the budget and the project schedule, so a change is made once."],
      },
    ],
    faqs: [
      { q: "Does it include CPWD rate analysis?", a: "Yes: CPWD Civil and CPWD E&M cost models, with Sub Heads and Chapters, and the MoRTH model for highway works." },
      { q: "Can I use my own rates?", a: "Yes. A Company cost model holds your own assemblies and rates, and you can copy items from the government models into it." },
      { q: "Does it price a line it cannot match?", a: "No. An unmatched line stays unpriced and is reported, with a hint, so you can decide." },
      { q: "Is there estimating for other Asian countries?", a: "Not yet. Cost databases differ by country; see our page on construction software for Asia." },
    ],
    related: [
      { label: "Tender management software", href: "/software/tender-management-software" },
      { label: "Compare estimating software", href: "/software/compare-estimating-software" },
      { label: "Tender Management", href: "/products/tender-management" },
      { label: "Project Management", href: "/products/project-management" },
    ],
    cta: { heading: "Price a BOQ against the cost models", body: "Bring a BOQ and drawings. We will price it and show which lines still need a decision." },
  },
  {
    slug: "ai-tender-search",
    metaTitle: "AI Tender Search for Contractors in India | Bidcore",
    metaDescription: "AI tender search: find public construction tenders, check your eligibility with Go / No-Go, read the tender documents and bring a tender into your estimate.",
    eyebrow: "Finding tenders",
    h1: "AI Tender Search: Find, Qualify and Decide on Construction Tenders",
    lead: "Finding a tender is only the start. Bidcore helps you find tenders, check them against your company with Go / No-Go, and read the documents so you can decide quickly whether to bid.",
    highlights: ["Public tenders on bidcore.in", "Go / No-Go against your company", "Documents read with page references", "Straight into takeoff and estimate"],
    sections: [
      {
        h2: "Where tenders come from",
        bullets: [
          "Public tenders: EPC companies and general contractors publish tenders openly on Bidcore to receive more quotations. These are not government tenders; they are listed on the Public Tenders page.",
          "Private invitations: tenders sent to you by contractors appear on your Tender Board.",
          "Government tenders: in the software, enter a Central Public Procurement Portal tender number, type the CAPTCHA yourself and Bidcore pulls the particulars into a project with a quick Go / No-Go.",
        ],
      },
      {
        h2: "Decide before you spend estimating time",
        paras: ["Go / No-Go compares the requirements with your Company Intelligence: turnover, net worth, similar works, bid capacity and surety cover. Missing data is REVIEW, never a pass, and the AI reads the tender documents with the page for each finding."],
      },
    ],
    faqs: [
      { q: "What is AI tender search?", a: "Search plus qualification: finding tenders and then using AI to read them and test them against your company, so you can decide quickly whether to bid." },
      { q: "Are the public tenders on bidcore.in government tenders?", a: "No. They are tenders that EPC companies and general contractors publish on Bidcore to receive more quotations." },
      { q: "Can it find tenders on the government portal?", a: "In the software you can fetch a tender from its CPPP tender number, after typing the CAPTCHA yourself." },
      { q: "Is it free to browse tenders?", a: "Browsing public tenders on bidcore.in is free." },
    ],
    related: [
      { label: "Browse public tenders", href: "/tenders" },
      { label: "Tender Connect", href: "/products/tender-connect" },
      { label: "Tender management software", href: "/software/tender-management-software" },
      { label: "Construction bidding software", href: "/software/construction-bidding-software" },
    ],
    cta: { heading: "Check a tender against your company", body: "Bring a tender you are considering. We will run the Go / No-Go and read its documents with you." },
  },
  {
    slug: "bid-proposal-software",
    metaTitle: "Bid Proposal Software for Contractors | Bidcore",
    metaDescription: "Bid proposal software for contractors: draft the technical approach and the price schedule from the bid you priced, then edit and export it.",
    eyebrow: "Proposals",
    h1: "Bid Proposal Software: Draft the Proposal from the Bid You Priced",
    lead: "A proposal should say what the estimate says. Bidcore drafts the technical proposal from your tender documents and your priced bid, so you edit instead of starting from a blank page.",
    highlights: ["Drafted from your tender and estimate", "Edit before you send", "AI drafts, a person reviews", "Same numbers as the bid"],
    sections: [
      {
        h2: "What goes in a tender proposal",
        paras: ["A technical proposal normally covers your understanding of the work, methodology, programme, team, quality and safety plans and your experience, alongside the price. Most of the time goes into rewriting the same sections and keeping them consistent with the price."],
      },
      {
        h2: "How Bidcore helps",
        bullets: [
          "AI Tender Proposal drafts sections from the tender documents and the project.",
          "The figures come from the bid cost estimate you carried, not retyped.",
          "A person reviews and edits every section; nothing is sent automatically.",
        ],
      },
    ],
    faqs: [
      { q: "What is bid proposal software?", a: "Software that helps produce the written proposal that goes with a price, drafting sections from the tender and the estimate for you to edit." },
      { q: "Does it write the whole proposal?", a: "It drafts for review. A person reads and edits every section before it goes out." },
      { q: "Will the proposal match my price?", a: "The numbers come from the estimate you carried, so a change in the bid is a change in the draft." },
    ],
    related: [
      { label: "Tender management software", href: "/software/tender-management-software" },
      { label: "Construction estimation software", href: "/software/construction-estimation-software" },
      { label: "Construction bidding software", href: "/software/construction-bidding-software" },
    ],
    cta: { heading: "Draft a proposal from a bid you priced", body: "Bring a past tender. Seeing the draft written from your own numbers is the quickest way to judge it." },
  },
  {
    slug: "ai-agentic-construction-software",
    metaTitle: "Agentic AI Construction Software That Runs Locally | Bidcore",
    metaDescription: "AI and agentic construction software that runs on your own Windows computer or server: takeoff, estimating and tenders with local AI and your approval on every change.",
    eyebrow: "AI that runs where your data is",
    h1: "AI and Agentic Construction Software on Your Own Computer or Server",
    lead: "BidcoreAI installs on your Windows computer or your own Windows server. The software, its AI services and its assistants run there, with your projects in a private local database and your approval on every change an AI proposes.",
    highlights: ["Runs on your computer or server", "AI services on the same machine", "Outside AI is off until you switch it on", "You approve every change"],
    sections: [
      {
        h2: "On your computer, or your server",
        bullets: [
          "A Windows program with its own private database; the core features work with the internet disconnected.",
          "Install it once on a Windows server and each person who signs in through Remote Desktop works on the same local database.",
          "Your drawings, estimates and tenders stay in a data folder you control.",
        ],
      },
      {
        h2: "AI and agents, under your control",
        bullets: [
          "Local AI services read drawings and documents on the same machine; optional local language models can run beside them.",
          "Agent X answers questions about your tender documents, estimate and schedule, citing where each answer comes from.",
          "Connect your own AI agent (Claude, ChatGPT or any compatible or local model) with your own key and consent. It can propose takeoff items and assemblies; you approve them.",
          "Permissions are set per key and can be revoked, and a log shows anything sent outside.",
        ],
      },
      {
        h2: "What agentic means here",
        paras: ["The AI does more than answer a question: within the limits you set it can read your measured conditions, draft what a BOQ line is missing and hand it to you. A person approves it; nothing changes silently."],
      },
    ],
    faqs: [
      { q: "Does the AI run on my computer?", a: "The AI services that read drawings and documents run on the machine where the software is installed. Outside AI engines stay off unless you connect your own account." },
      { q: "Do I need internet?", a: "Not for the core features. You need a connection to connect an outside AI engine, to receive updates, or to use Tender Connect on bidcore.in." },
      { q: "Can several people use it?", a: "Yes, on a Windows server: install it once and sign in through Remote Desktop." },
      { q: "Can an AI agent change my estimate without asking?", a: "An assistant proposes and a person approves. A connected agent can only do what the key you create allows, and you can revoke it at any time." },
      { q: "Is it a web app?", a: "No. It installs on Windows. Ask for a demo to see it running." },
    ],
    related: [
      { label: "Tender management software", href: "/software/tender-management-software" },
      { label: "Construction estimation software", href: "/software/construction-estimation-software" },
      { label: "Compare estimating software", href: "/software/compare-estimating-software" },
      { label: "Request a demo", href: "/request-demo" },
    ],
    cta: { heading: "See AI and agents work on a real tender", body: "Ask for a demo and bring a tender. We run it on a local machine, the way it will run for you." },
  },
  {
    slug: "construction-software-asia",
    metaTitle: "Construction Software for India, UAE, Singapore and Asia | Bidcore",
    metaDescription: "Construction tender, estimating and project software for Asia: live in India today, with the UAE, Singapore and other Asian markets available on request.",
    eyebrow: "Asia",
    h1: "Construction Tender and Estimating Software for India and Asia",
    lead: "Bidcore is live in India today. Contractors in the UAE, Singapore and other Asian countries can ask for it: what has to be adapted for a country is clear, and we prioritise the markets that ask.",
    highlights: ["Live in India", "UAE, Singapore and others on request", "Country-aware sign-up and phone numbers", "One platform from tender to project"],
    sections: [
      {
        h2: "What is available today",
        paras: ["India is the live market: CPWD, CPWD E&M and MoRTH cost models, tender-document analysis, Tender Connect for bidding and the contractor directory, in rupees with GST."],
      },
      {
        h2: "What changes from country to country",
        bullets: [
          "Cost data: each country has its own schedule of rates or cost database, which a contractor can set up as a Company cost model.",
          "Currency, tax and number formats.",
          "Contract forms and tender procedures.",
          "Languages and local standards.",
        ],
      },
      {
        h2: "If you are in the UAE, Singapore or another Asian country",
        paras: ["List your company on bidcore.in with your country, and request a demo telling us where you work and what you bid. The takeoff, bidding and AI features do not depend on a particular country, and your own cost data can be set up as a Company cost model."],
      },
    ],
    faqs: [
      { q: "Does Bidcore support the UAE and Singapore?", a: "India is the live market. Other Asian countries are available on request, and we prioritise those that ask. The platform is not limited to one country's cost data." },
      { q: "Can I list my company from another country?", a: "Yes. The company form has a Country field and accepts phone numbers from every country." },
      { q: "Can I use my own rates?", a: "Yes. A Company cost model holds your own assemblies and rates for any country." },
      { q: "Where does the software run?", a: "On your Windows computer or server, with local AI services." },
    ],
    related: [
      { label: "List your company", href: "/add-company" },
      { label: "Request a demo", href: "/request-demo" },
      { label: "Construction estimation software", href: "/software/construction-estimation-software" },
      { label: "Find contractors", href: "/contractors" },
    ],
    cta: { heading: "Tell us where you work", body: "Request a demo and tell us your country and what you bid. We use it to decide which markets to adapt next." },
  },
  {
    slug: "compare-estimating-software",
    metaTitle: "Togal.AI, CostX and Trimble Alternative: Bidcore Compared",
    metaDescription: "Bidcore compared with Togal.AI, CostX and Trimble estimating: takeoff, estimating, tenders and proposals, where it runs, India cost models and where each is the better fit.",
    eyebrow: "Compare",
    h1: "Bidcore Compared with Togal.AI, CostX and Trimble",
    lead: "Togal.AI, CostX and Trimble's estimating products are established ways to measure drawings and price work. Bidcore takes a wider view, from the tender documents to the submitted proposal, and adds the CPWD and MoRTH cost models that Indian public works need.",
    highlights: ["Tender to proposal in one program", "CPWD, CPWD E&M and MoRTH models", "Runs on your computer or server", "Cited AI; your own agent, with approval"],
    table: {
      heading: "At a glance",
      cols: ["", "Bidcore", "Togal.AI", "CostX", "Trimble estimating"],
      rows: [
        ["Main focus", "Tender to proposal, plus project tools", "AI takeoff", "2D and 3D/BIM takeoff and estimating", "Estimating products by trade"],
        ["Takeoff", "PDF drawings, AI-assisted counting", "Automatic detection of spaces, walls and objects", "2D plus 3D/BIM models", "Graphical takeoff in each product"],
        ["CPWD / MoRTH cost models", "Built in", "No", "No", "No"],
        ["Tender documents read with page references", "Built in", "Chat over project documents", "No", "No"],
        ["Subcontractor invitations and quotation comparison", "Built in", "Not a focus of its public material", "Not a focus of its public material", "Separate products"],
        ["Proposal drafting", "Built in", "No", "No", "No"],
        ["Where it runs", "Your Windows computer or server", "Cloud web application", "Installed software", "Cloud and installed"],
        ["Your own AI agent, with approval", "Yes", "No", "No", "No"],
      ],
      note: COMPETITOR_NOTE,
    },
    sections: [
      {
        h2: "Where Bidcore is different",
        bullets: [
          "One flow from tender documents to takeoff, estimate, subcontractor invitations and the proposal, so numbers are not retyped between tools.",
          "AI that shows the page behind every finding.",
          "India-specific cost models: CPWD Civil, CPWD E&M and MoRTH, with BOQ and tender cost.",
          "Runs on your own Windows computer or server, with local AI, so your data stays with you.",
          "Connect your own AI agent; it proposes and you approve.",
        ],
      },
      {
        h2: "Where another tool may fit better",
        bullets: [
          "Togal.AI: all you need is very fast automatic area takeoff in the cloud.",
          "CostX: your takeoff comes from 3D/BIM models (Revit, Archicad, IFC), where Bidcore works from PDF drawings.",
          "Trimble: you are a specialist electrical or heavy-civil estimator who needs deep trade databases and the wider Trimble ecosystem.",
        ],
      },
    ],
    faqs: [
      { q: "Is Bidcore an alternative to CostX?", a: "For PDF-based takeoff and estimating and the tender work around it, yes. CostX also measures 3D/BIM models, which Bidcore does not." },
      { q: "Is Bidcore an alternative to Togal.AI?", a: "For the whole tender, yes. If you only need automatic area takeoff in the cloud, Togal.AI is a focused choice." },
      { q: "Is Bidcore an alternative to Trimble Accubid or Quest?", a: "For contractors bidding across trades, yes. Specialist MEP or heavy-civil estimators who need Trimble's trade databases may prefer Trimble." },
      { q: "Do you list competitor prices?", a: "No. Prices change and public sources disagree. Ask each vendor for a current quote." },
    ],
    related: [
      { label: "Construction estimation software", href: "/software/construction-estimation-software" },
      { label: "Tender management software", href: "/software/tender-management-software" },
      { label: "AI and agentic software", href: "/software/ai-agentic-construction-software" },
      { label: "Request a demo", href: "/request-demo" },
    ],
    cta: { heading: "Compare them on one of your own tenders", body: "Bring a tender you have priced. We will run it from the documents to the bid so you can judge the whole job." },
  },
];

// Short names for the footer.
export const GUIDE_NAV: Record<string, string> = {
  "construction-bidding-software": "Construction bidding software",
  "tender-management-software": "Tender management software",
  "construction-estimation-software": "Construction estimation software",
  "ai-tender-search": "AI tender search",
  "bid-proposal-software": "Bid proposal software",
  "ai-agentic-construction-software": "AI and agentic software",
  "construction-software-asia": "Software for India and Asia",
  "compare-estimating-software": "Compare estimating software",
};

export const getGuidePage = (slug: string): GuidePage | undefined => GUIDE_PAGES.find((g) => g.slug === slug);
