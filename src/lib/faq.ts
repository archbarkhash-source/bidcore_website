// Questions and answers for /faq. The page shows these and the FAQ structured data is built from the very same text, so the two cannot drift apart.
// Every answer restates something the site already says (product pages, Tender Connect, Marketplace); nothing here states prices or results.

export interface FaqItem {
  q: string;
  a: string;
  link?: { label: string; href: string };
}

export const FAQ: FaqItem[] = [
  {
    q: "What is Bidcore?",
    a: "Bidcore brings BidcoreAI construction software, public tenders, a company directory and a marketplace for products and services together in one platform for construction businesses in India.",
    link: { label: "Explore the platform", href: "/products" },
  },
  {
    q: "What are public tenders on Bidcore?",
    a: "General contractors and EPC companies publish tenders publicly to get more quotes for their tender packages. These are not government tenders. If you are a subcontractor or supplier, you can search them by state, city, category and keywords, check your eligibility, prepare item-wise quotations against the tender's BOQ and submit them.",
    link: { label: "Browse public tenders", href: "/tenders" },
  },
  {
    q: "Does Bidcore have government tenders?",
    a: "No. The public tenders on Bidcore are published by EPC companies and general contractors for their own packages, not by government bodies. If you are preparing a bid on a government tender yourself, BidcoreAI Tender Management helps you read the tender documents, check eligibility and prepare the bid.",
    link: { label: "About Tender Management", href: "/products/tender-management" },
  },
  {
    q: "Can I use BidcoreAI for private tenders?",
    a: "Yes. A general contractor can send a work package privately to the companies it invites; a private tender goes only to those companies and never appears on Bidcore.in. The same package can also be published as a public tender to reach more contractors. A tender package must belong to a project before it can be published or sent.",
    link: { label: "About Tender Connect", href: "/products/tender-connect" },
  },
  {
    q: "Does BidcoreAI help with the project itself after I win?",
    a: "Yes. BidcoreAI Project Management covers the WBS, productivity-based scheduling, budget and cost control, daily progress reports and schedule risk. Procurement Management covers purchase orders, a procurement log and change orders. Site Operations covers resource planning, work packages and subcontractor capacity. Each product page lists what is available and what is still planned.",
    link: { label: "See all software products", href: "/products" },
  },
  {
    q: "Who is Bidcore for?",
    a: "EPC contractors, general contractors, design-build contractors and subcontractors, and the suppliers and manufacturers who work with them. Companies that already use other software can also talk to us about a custom solution that integrates it with BidcoreAI.",
    link: { label: "Solutions for your business", href: "/solutions" },
  },
  {
    q: "How do I find suppliers or subcontractors for a package?",
    a: "Publish the package on Tender Connect to invite subcontractors privately or openly, and compare their item-wise quotations side by side. To look for companies, suppliers and manufacturers, or for construction products and services, use the Marketplace.",
    link: { label: "Find companies", href: "/marketplace/companies" },
  },
  {
    q: "What is the Bidcore Marketplace?",
    a: "The Marketplace is where construction businesses promote their products and services and where buyers find them: suppliers, manufacturers, equipment providers and other service companies. It is separate from the BidcoreAI software, which you use to estimate, tender and manage projects.",
    link: { label: "Open the Marketplace", href: "/marketplace" },
  },
  {
    q: "How do I find products on the Marketplace?",
    a: "Open the Marketplace menu and choose Find Products. Search by name, or browse by category such as construction materials, electrical and mechanical products, infrastructure products and equipment rental. Open a listing and use Request a quote to send the supplier an enquiry.",
    link: { label: "Find products", href: "/marketplace/products" },
  },
  {
    q: "How do I find services or service providers?",
    a: "Open the Explore menu and choose Find Services for testing and inspection, surveying and other construction services, or Find Companies to search businesses directly. Open a listing and use Send enquiry to contact the provider.",
    link: { label: "Find services", href: "/marketplace/services" },
  },
  {
    q: "How do I add my products or services to the Marketplace?",
    a: "Choose List Your Business and sign in with your company email (personal addresses such as Gmail are not accepted). Find your company to claim it, or add it, then fill in your business details and add your products and services. Listings move from Draft to Awaiting review and appear once they are approved and published. Joining is free, and the free plan allows up to 10 active listings per company.",
    link: { label: "List your business", href: "/marketplace/list-your-business" },
  },
  {
    q: "How do I receive enquiries from buyers?",
    a: "When a buyer sends an enquiry about one of your listings, it arrives in the Enquiries section of your Marketplace dashboard, and we use your company email to send it to you as well. You can mark each enquiry as responded, in discussion, converted or closed.",
    link: { label: "Go to your dashboard", href: "/marketplace/dashboard" },
  },
  {
    q: "Is browsing free, and what does it cost to use the software?",
    a: "Browsing tenders and companies is free. Starter Lite (Tender Connect) starts with a 7-day free trial and needs no credit card. You can see plan details on the Plans page, and request a demo to see the pricing of Starter and Pro.",
    link: { label: "View plans", href: "/pricing" },
  },
  {
    q: "Is the free trial per person?",
    a: "No. It is per company, not per browser or login, so colleagues share one trial and creating another login does not start a new one.",
  },
  {
    q: "How do I list my business or claim my company profile?",
    a: "Use List Your Business and search for your company. If your email is on the company's own domain you can claim the profile straight away; otherwise the Bidcore team reviews your request before you can manage it. If it is not listed yet you can add it. A profile is marked claimed or verified only after the business claims it and Bidcore verifies it, never automatically.",
    link: { label: "List your business", href: "/marketplace/list-your-business" },
  },
  {
    q: "How do I request a demo?",
    a: "Use the Request a Demo form and pick a date and time (IST). A Bidcore team member is ready to give you a live demo.",
    link: { label: "Request a demo", href: "/request-demo" },
  },
  {
    q: "Is there a version of BidcoreAI for the United States?",
    a: "Yes. BidcoreAI software is used in both India and the United States. This site, Bidcore.in, serves India. Use the country selector in the top bar and choose US to go to the BidcoreAI website for the United States.",
  },
];
