import Link from "next/link";
import { PRODUCTS, signUpHref } from "@/lib/app-links";
import { SOLUTIONS } from "@/lib/solutions";

interface FooterLink {
  label: string;
  href: string;
}

const CONTACT_EMAIL_FALLBACK = "info@bidcore.in";

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
        { label: "Find Companies", href: "/marketplace/companies" },
        { label: "Find Services", href: "/marketplace/services" },
        { label: "Find Vendors", href: "/marketplace/companies?type=Supplier" },
        { label: "Professionals", href: "/professionals" },
        { label: "Equipment", href: "/equipment" },
      ],
    },
    {
      title: "Support",
      links: [
        { label: "Help Center", href: "/help" },
        { label: "Contact us", href: `mailto:${contactEmail}` },
      ],
    },
  ];

  const linkClass = "text-slate-700 hover:text-brand-accent hover:underline";

  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-3 xl:grid-cols-6">
        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h2 className="text-base font-bold text-brand-navy">{col.title}</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {col.links.map((l) => (
                <li key={l.label}>
                  {isExternal(l.href) ? (
                    <a href={l.href} className={linkClass}>
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
