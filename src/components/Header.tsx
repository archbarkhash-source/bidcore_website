"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Menu, Search, UserRound, X } from "lucide-react";
import { notifySessionChange, useSession } from "@/lib/use-session";
import { PRODUCTS, appLoginUrl, signUpHref } from "@/lib/app-links";
import { SOLUTIONS } from "@/lib/solutions";
import CountrySwitch from "@/components/CountrySwitch";

// Products are the primary navigation. Marketplace = shop for products, suppliers and equipment; Explore = find companies and services.
const PRODUCTS_LINKS = PRODUCTS.map((p) => ({ label: `BidcoreAI ${p.name}`, href: p.href }));

interface NavLink {
  label: string;
  href: string;
}
interface NavGroup {
  heading?: string;
  links: NavLink[];
}

// Solutions = who Bidcore is for: EPC, general and design-build contractors, and subcontractors.
const SOLUTIONS_LINKS: NavLink[] = [{ label: "All solutions", href: "/solutions" }, ...SOLUTIONS.map((x) => ({ label: x.name, href: `/solutions/${x.slug}` }))];
const SOLUTIONS_GROUPS: NavGroup[] = [{ heading: "Solutions for", links: SOLUTIONS_LINKS }];

const PRODUCTS_GROUPS: NavGroup[] = [
  { heading: "Construction software", links: [{ label: "All software products", href: "/products" }, ...PRODUCTS_LINKS] },
];

// Explore = find contractors, services, vendors, people and equipment, list your own company, and help. (There is no separate Marketplace tab any more: the
// Marketplace pages are reached from here and from the home page.)
const EXPLORE_GROUPS: NavGroup[] = [
  {
    heading: "Find",
    links: [
      { label: "Find Contractors", href: "/companies" },
      { label: "Find Services", href: "/marketplace/services" },
      { label: "Find Vendors", href: "/marketplace/companies?type=Supplier" },
      { label: "Site Engineers", href: "/professionals?role=Site+Engineer" },
      { label: "QA / QC Engineers", href: "/professionals?role=QA+%2F+QC+Engineer" },
      { label: "Surveyors", href: "/professionals?role=Surveyor" },
      { label: "All Professionals", href: "/professionals" },
      { label: "Equipment", href: "/equipment" },
    ],
  },
  {
    heading: "List your company",
    links: [
      { label: "List Your Business", href: "/marketplace/list-your-business" },
      // A separate step from the Marketplace listing: company details for Tender Connect, so EPC companies can find the company and invite it to tender.
      { label: "Add Your Company Info", href: "/add-company" },
    ],
  },
  {
    heading: "About & Support",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Help Center", href: "/help" },
      { label: "FAQ", href: "/faq" },
    ],
  },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const [menu, setMenu] = useState<{ name: string; path: string } | null>(null);
  // An open dropdown belongs to the page it was opened on: any navigation (link, back, forward) closes it.
  const openMenu = menu && menu.path === pathname ? menu.name : null;
  const setOpenMenu = useCallback((name: string | null) => setMenu(name ? { name, path: pathname } : null), [pathname]);
  const [query, setQuery] = useState("");
  const router = useRouter();
  const navRef = useRef<HTMLElement>(null);
  const session = useSession();

  async function signOut() {
    await fetch("/api/signout", { method: "POST" });
    notifySessionChange();
    router.push("/");
  }

  useEffect(() => {
    if (!openMenu) return;

    function handlePointerDown(e: PointerEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenMenu(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenu, setOpenMenu]);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    setMobileOpen(false);
    router.push(q ? `/tenders?q=${encodeURIComponent(q)}` : "/tenders");
  }

  return (
    <>
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-3.5 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-2xl font-bold tracking-tight text-brand-navy">
          {/* eslint-disable-next-line @next/next/no-img-element -- plain img avoids Next's image-optimization cache while this asset is still being iterated on */}
          <img src="/images/favicon.png" alt="Bidcore" className="h-8 w-8 rounded-lg" />
          Bidcore
        </Link>

        <form onSubmit={handleSearch} role="search" className="relative hidden max-w-xl flex-1 md:block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tenders, organisations, cities..."
            aria-label="Search tenders"
            className="w-full rounded-md border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-brand-navy focus:bg-white focus:ring-2 focus:ring-brand-navy/10"
          />
        </form>

        <div className="ml-auto flex items-center gap-3 lg:gap-4">
          {/* Country: IN is this site; choosing US goes to the BidcoreAI website. (The phone menu has its own switcher.) */}
          <CountrySwitch className="hidden sm:inline-flex" />
          <span aria-hidden className="hidden h-5 w-px bg-slate-300 sm:block" />
          {session === null && (
            <>
              <a
                href={appLoginUrl()}
                className="hidden items-center gap-1.5 whitespace-nowrap text-sm font-semibold text-slate-700 hover:text-brand-accent sm:inline-flex"
              >
                <UserRound className="h-4 w-4" />
                Sign In
              </a>
              <Link
                href={signUpHref("tender-connect", { intent: "publish" })}
                className="hidden whitespace-nowrap rounded-md border border-brand-navy px-4 py-2 text-sm font-semibold text-brand-navy transition hover:bg-brand-navy hover:text-white lg:inline-block"
              >
                Publish a tender
              </Link>
            </>
          )}
          {session && (
            <>
              <Link
                href="/my-company"
                className="hidden text-sm font-medium text-slate-700 hover:text-brand-accent sm:inline-block"
              >
                My Company
              </Link>
              <span className="hidden text-sm text-slate-500 md:inline-block">
                {session.name.split(" ")[0]}
              </span>
              <button
                onClick={signOut}
                className="hidden rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-brand-navy hover:text-brand-navy sm:inline-block"
              >
                Sign Out
              </button>
            </>
          )}
          <Link
            href="/request-demo"
            className="hidden whitespace-nowrap rounded-md bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-400 lg:inline-block"
          >
            Request a Demo
          </Link>
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Second tier (laptop and up): the main navigation under a hairline, like a two-row product header. Phones and tablets use the menu button. */}
      <div className="hidden border-t border-slate-200 lg:block">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <nav ref={navRef} className="flex items-center gap-8 py-2.5">
              <NavDropdown
                label="Products"
                groups={PRODUCTS_GROUPS}
                isOpen={openMenu === "Products"}
                onToggle={() => setOpenMenu(openMenu === "Products" ? null : "Products")}
                onClose={() => setOpenMenu(null)}
              />
              <NavDropdown
                label="Solutions"
                groups={SOLUTIONS_GROUPS}
                isOpen={openMenu === "Solutions"}
                onToggle={() => setOpenMenu(openMenu === "Solutions" ? null : "Solutions")}
                onClose={() => setOpenMenu(null)}
              />
              <Link href="/tenders" className="text-sm font-medium text-slate-700 hover:text-brand-accent">
                Public Tenders
              </Link>
              <Link href="/pricing" className="text-sm font-medium text-slate-700 hover:text-brand-accent">
                Pricing
              </Link>
              <NavDropdown
                label="Explore"
                groups={EXPLORE_GROUPS}
                isOpen={openMenu === "Explore"}
                onToggle={() => setOpenMenu(openMenu === "Explore" ? null : "Explore")}
                onClose={() => setOpenMenu(null)}
                muted
              />
                </nav>
        </div>
      </div>
    </header>

    {/* Outside the header on purpose: the header has a backdrop blur, which makes a fixed child size itself to the header instead of the screen. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-80 max-w-[85vw] flex-col bg-white">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <span className="text-sm font-bold text-brand-navy">Menu</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <form onSubmit={handleSearch} role="search" className="relative mb-5">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tenders, organisations, cities..."
                  aria-label="Search tenders"
                  className="w-full rounded-md border border-slate-300 bg-slate-50 py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-navy"
                />
              </form>
              <div className="mb-4 flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Country</span>
                <CountrySwitch />
              </div>

              <MobileGroup title="Products" links={PRODUCTS_LINKS} onNavigate={() => setMobileOpen(false)} />
              <MobileGroup title="Solutions" links={SOLUTIONS_LINKS} onNavigate={() => setMobileOpen(false)} />
              <MobileLink href="/tenders" onNavigate={() => setMobileOpen(false)}>
                Public Tenders
              </MobileLink>
              <MobileLink href="/pricing" onNavigate={() => setMobileOpen(false)}>
                Pricing
              </MobileLink>
              <MobileLink href={signUpHref("tender-connect", { intent: "publish" })} onNavigate={() => setMobileOpen(false)}>
                Publish a tender
              </MobileLink>
              {EXPLORE_GROUPS.map((g) => (
                <MobileGroup key={g.heading} title={`Explore · ${g.heading}`} links={g.links} onNavigate={() => setMobileOpen(false)} />
              ))}

              {session && (
                <div className="mt-4 space-y-0.5 border-t border-slate-100 pt-4">
                  <MobileLink href="/my-company" onNavigate={() => setMobileOpen(false)}>
                    My Company
                  </MobileLink>
                </div>
              )}
            </div>
            <div className="space-y-2 border-t border-slate-200 p-5">
              {session ? (
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    signOut();
                  }}
                  className="block w-full rounded-md border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-brand-navy hover:border-slate-400"
                >
                  Sign Out
                </button>
              ) : (
                <>
                  <a
                    href={appLoginUrl()}
                    className="block rounded-md border border-slate-300 px-4 py-2.5 text-center text-sm font-semibold text-brand-navy hover:border-slate-400"
                  >
                    Sign In
                  </a>
                </>
              )}
              <Link
                href="/request-demo"
                onClick={() => setMobileOpen(false)}
                className="block rounded-md bg-orange-500 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-orange-400"
              >
                Request a Demo
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NavDropdown({
  label,
  groups,
  isOpen,
  onToggle,
  onClose,
  muted = false,
}: {
  label: string;
  groups: NavGroup[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  muted?: boolean;
}) {
  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className={`flex items-center gap-1 text-sm font-medium hover:text-brand-accent ${muted ? "text-slate-500" : "text-slate-700"}`}
      >
        {label}
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`mt-px transition ${isOpen ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-3 max-h-[80vh] w-64 overflow-y-auto rounded-md border border-slate-200 bg-white py-2 shadow-lg">
          {groups.map((group, i) => (
            <div key={group.heading ?? i} className={i > 0 ? "mt-2 border-t border-slate-100 pt-2" : ""}>
              {group.heading && (
                <p className="px-4 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{group.heading}</p>
              )}
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className="block px-4 py-1.5 text-sm text-slate-600 hover:text-brand-accent"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MobileGroup({
  title,
  links,
  onNavigate,
}: {
  title: string;
  links: { label: string; href: string }[];
  onNavigate: () => void;
}) {
  return (
    <details className="group mb-1" open>
      <summary className="flex list-none items-center justify-between rounded-md px-1 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 [&::-webkit-details-marker]:hidden">
        {title}
      </summary>
      <div className="space-y-0.5 pb-2">
        {links.map((link) => (
          <MobileLink key={link.href} href={link.href} onNavigate={onNavigate}>
            {link.label}
          </MobileLink>
        ))}
      </div>
    </details>
  );
}

function MobileLink({
  href,
  onNavigate,
  children,
}: {
  href: string;
  onNavigate: () => void;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      {children}
    </Link>
  );
}
