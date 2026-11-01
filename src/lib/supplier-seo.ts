// Search wording for the suppliers and vendors pages (/supply/companies ...). Pure functions, no database: the words people in India search for
// (construction material suppliers, TMT steel, RMC, cement dealers, building material vendors, equipment rental) in the page title, heading and description.
import { DEFAULT_CATEGORIES } from "@/lib/marketplace/constants";

export interface SupplierFilters {
  q?: string;
  type?: string;
  category?: string;
  state?: string;
  city?: string;
  served?: string;
  industry?: string;
  capability?: string;
  status?: string;
  sort?: string;
  page?: number;
}

/** The material and equipment groups shown as shortcuts. Slugs are the marketplace's own categories (constants.ts). */
export const SUPPLY_SHORTCUTS: { slug: string; label: string; seo: string }[] = [
  { slug: "cement", label: "Cement", seo: "Cement" },
  { slug: "steel-tmt", label: "Steel and TMT bars", seo: "Steel and TMT Bar" },
  { slug: "ready-mix-concrete", label: "Ready-mix concrete (RMC)", seo: "Ready-Mix Concrete (RMC)" },
  { slug: "aggregates-sand", label: "Aggregates and sand", seo: "Aggregates and Sand" },
  { slug: "bricks-blocks", label: "Bricks and blocks", seo: "Bricks and Blocks" },
  { slug: "tiles-flooring", label: "Tiles and flooring", seo: "Tiles and Flooring" },
  { slug: "paints-coatings", label: "Paints and coatings", seo: "Paints and Coatings" },
  { slug: "waterproofing-chemicals", label: "Waterproofing", seo: "Waterproofing and Construction Chemicals" },
  { slug: "timber-plywood", label: "Timber and plywood", seo: "Timber and Plywood" },
  { slug: "construction-equipment", label: "Equipment", seo: "Construction Equipment" },
];

const TYPE_PLURAL: Record<string, string> = {
  Supplier: "Construction Material Suppliers",
  Manufacturer: "Construction Material Manufacturers",
  "Distributor / Dealer": "Construction Material Dealers and Distributors",
  "Equipment Rental Provider": "Construction Equipment Rental Providers",
  "Testing and Inspection Laboratory": "Construction Testing and Inspection Laboratories",
  "Surveying and Geotechnical Firm": "Surveying and Geotechnical Firms",
};

const titleCase = (s: string) => s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function categoryLabel(slug: string): string {
  const known = SUPPLY_SHORTCUTS.find((c) => c.slug === slug);
  if (known) return known.seo;
  for (const c of DEFAULT_CATEGORIES) {
    if (c.slug === slug) return c.name;
    const child = c.children?.find((x) => x.slug === slug);
    if (child) return child.name;
  }
  return titleCase(slug);
}

/** Heading of the page for the current filters, e.g. "Cement Suppliers in Mumbai". Null = no filter (the default heading is used). */
export function filterHeading(f: SupplierFilters, stateName?: string): string | null {
  const place = f.city?.trim() || stateName || (f.state ? titleCase(f.state) : "");
  let what = "";
  if (f.category) what = `${categoryLabel(f.category)} Suppliers`;
  else if (f.type) what = TYPE_PLURAL[f.type] ?? `${f.type} Companies`;
  if (!what && !place) return null;
  return `${what || "Construction Suppliers and Vendors"}${place ? ` in ${place}` : ""}`;
}

/** Filters that may be indexed by search engines: one product group or company type, plus at most one place. Everything else (search words, sorting, profile status,
 *  industry / capability / areas served) is noindex so the site does not publish thousands of near-duplicate pages. */
export function indexableFilters(f: SupplierFilters): boolean {
  if (f.q || f.served || f.industry || f.capability || f.status || f.sort) return false;
  if (f.type && f.category) return false;
  if (f.state && f.city) return false;
  return true;
}

/** The address of a filtered page in a fixed parameter order (the canonical address). */
export function canonicalQuery(f: SupplierFilters): string {
  const q = new URLSearchParams();
  for (const k of ["type", "category", "state", "city"] as const) if (f[k]) q.set(k, f[k] as string);
  if (f.page && f.page > 1) q.set("page", String(f.page));
  const s = q.toString();
  return s ? `?${s}` : "";
}

export function supplierMeta(f: SupplierFilters, total: number, stateName?: string): { title: string; description: string; heading: string | null; index: boolean } {
  const heading = filterHeading(f, stateName);
  const index = indexableFilters(f) && (heading === null || total > 0);
  if (!heading) {
    return {
      title: "Construction Suppliers and Vendors in India | Bidcore",
      description: "Find construction material suppliers, manufacturers, dealers and equipment vendors in India: cement, TMT steel, RMC, tiles, paints. List yours to get found by contractors.",
      heading: null,
      index,
    };
  }
  return {
    title: `${heading} | Bidcore`,
    description: `Find ${heading} on Bidcore. View company profiles, products and services, and send an enquiry to ask for a quote.`,
    heading,
    index,
  };
}
