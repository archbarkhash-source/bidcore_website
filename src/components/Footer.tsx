import Link from "next/link";
import { PRODUCTS, signUpHref } from "@/lib/app-links";
import { SOLUTIONS } from "@/lib/solutions";

interface FooterLink {
  label: string;
  href: string;
}

const CONTACT_EMAIL_FALLBACK = "info@bidcore.in";

// BidcoreAI's own profiles (the same ones the BidcoreAI website links to).
const SOCIALS = [
  {
    label: "BidcoreAI on YouTube",
    href: "https://www.youtube.com/@bidcoreai",
    path: "M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1c.5-1.9.5-5.8.5-5.8s0-3.9-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z",
  },
  {
    label: "BidcoreAI on LinkedIn",
    href: "https://www.linkedin.com/company/bidcoreai",
    path: "M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.45-2.14 2.94v5.66H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z",
  },
  {
    label: "BidcoreAI on X",
    href: "https://x.com/BidcoreAI",
    path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  },
];

// Every link is a page that exists. There are no Privacy / Terms pages or social profiles on this site yet, so none is linked.
// Links that leave the site (the BidcoreAI sign-up, mailto) are plain anchors; the rest are client-side links.
const isExternal = (href: string) => href.startsWith("mailto:") || /^https?:\/\//.test(href);

export default function Footer() {
  const contactEmail = process.env.NEXT_PUBLIC_CONTACT_EMAIL || CONTACT_EMAIL_FALLBACK;

  const columns: { title: string; links: FooterLink[] }[] = [
    {
      title: "Software",
      links: [{ label: "All products", href: "/products" }, ...PRODUCTS.map((p) => ({ label: `BidcoreAI ${p.name}`, href: p.href }))],
    },
    {
      title: "Solutions",
      links: SOLUTIONS.map((x) => ({ label: x.name, href: `/solutions/${x.slug}` })),
    },
    {
      title: "How to buy",
      links: [
        { label: "View all products", href: "/products" },
        { label: "Pricing", href: "/pricing" },
        { label: "Start Free Trial", href: signUpHref("tender-connect") },
        { label: "Request a Demo", href: "/request-demo" },
        { label: "Watch Live Demo", href: "/live-demo" },
        { label: "Contact sales", href: `mailto:${contactEmail}?subject=${encodeURIComponent("Sales enquiry")}` },
      ],
    },
    {
      title: "Marketplace",
      links: [
        { label: "Marketplace overview", href: "/marketplace" },
        { label: "Find Products", href: "/marketplace/products" },
        { label: "Find Suppliers & Manufacturers", href: "/marketplace/companies?type=Supplier" },
        { label: "Find Equipment Providers", href: "/marketplace/categories/equipment-rental" },
        { label: "List Your Business", href: "/marketplace/list-your-business" },
      ],
    },
    {
      title: "Explore",
      links: [
        { label: "Public Tenders", href: "/tenders" },
        { label: "Find Contractors", href: "/companies" },
        { label: "Find Services", href: "/marketplace/services" },
        { label: "Find Vendors", href: "/marketplace/companies?type=Supplier" },
        { label: "Professionals", href: "/professionals" },
        { label: "Equipment", href: "/equipment" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "About Us", href: "/about" },
        { label: "Help Center", href: "/help" },
        { label: "Contact us", href: `mailto:${contactEmail}` },
        { label: "FAQ", href: "/faq" },
        // The BidcoreAI (India) Training Videos playlist on YouTube.
        { label: "Indian Training Videos", href: "https://www.youtube.com/playlist?list=PLNOjSgwlR1aM" },
      ],
    },
  ];

  const linkClass = "text-slate-700 hover:text-brand-accent hover:underline";

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 pt-10 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-5 border-b border-slate-200 pb-8">
          <div>
            <Link href="/" aria-label="BidcoreAI home" className="inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element -- plain img, matching the header logo */}
              <img src="/images/bidcoreai-logo.png" alt="BidcoreAI" width={395} height={100} className="h-9 w-auto rounded-md" />
            </Link>
            <p className="mt-3 max-w-md text-sm text-slate-600">AI-powered end-to-end construction solutions on one integrated platform.</p>
          </div>
          <ul className="flex items-center gap-3" aria-label="BidcoreAI on social media">
            {SOCIALS.map((so) => (
              <li key={so.label}>
                <a
                  href={so.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={so.label}
                  title={so.label}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-600 transition hover:border-brand-navy hover:text-brand-navy"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-[18px] w-[18px]" aria-hidden="true">
                    <path d={so.path} />
                  </svg>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 xl:grid-cols-6">
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-base font-bold text-brand-navy">{col.title}</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  {isExternal(l.href) ? (
                    <a href={l.href} className={linkClass} {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className={linkClass}>
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="bg-slate-200">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-slate-600 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} Bidcore. All rights reserved.</span>
          <a href={`mailto:${contactEmail}`} className="hover:text-brand-accent hover:underline">
            {contactEmail}
          </a>
        </div>
      </div>
    </footer>
  );
}
