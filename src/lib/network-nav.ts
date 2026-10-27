import { Boxes, Building2, Cable, HardHat, Landmark, Truck, UserRoundCog, Wrench, type LucideIcon } from "lucide-react";

// Navigation and homepage shortcuts into the Marketplace (src/app/marketplace/*). Category slugs are the marketplace's own (DEFAULT_CATEGORIES in
// lib/marketplace/constants.ts) - no second taxonomy is defined here. Business types are the `type` filter of /marketplace/companies.
//
// Marketplace = shop for construction products, materials, equipment and suppliers.  Explore = find construction companies and services.

export interface NavEntry {
  label: string;
  href: string;
}

export const MARKETPLACE_LINKS: NavEntry[] = [
  { label: "Find Products", href: "/marketplace/products" },
  { label: "Find Suppliers & Manufacturers", href: "/marketplace/companies?type=Supplier" },
  { label: "Find Equipment Providers", href: "/marketplace/categories/equipment-rental" },
  { label: "Marketplace Overview", href: "/marketplace" },
  { label: "List Your Business", href: "/marketplace/list-your-business" },
  // A separate step from the Marketplace listing: company details for Tender Connect, so EPC companies can find the company and invite it to tender.
  { label: "Add Your Company Info", href: "/add-company" },
];

export interface NetworkCategory extends NavEntry {
  blurb: string;
  icon: LucideIcon;
}

/** Homepage "business network" shortcuts: who to find. */
export const COMPANY_SHORTCUTS: NetworkCategory[] = [
  { label: "Contractors", blurb: "General, civil, building and infrastructure contractors", href: "/marketplace/categories/construction-contractors", icon: HardHat },
  { label: "Suppliers", blurb: "Material and product suppliers", href: "/marketplace/companies?type=Supplier", icon: Truck },
  { label: "Manufacturers", blurb: "Manufacturers of construction products", href: "/marketplace/companies?type=Manufacturer", icon: Building2 },
  { label: "Equipment Providers", blurb: "Rental and equipment companies", href: "/marketplace/categories/equipment-rental", icon: Wrench },
  { label: "Service Providers", blurb: "Testing, inspection, surveying and other services", href: "/marketplace/services", icon: UserRoundCog },
];

/** Homepage marketplace shortcuts: what to find. */
export const PRODUCT_SHORTCUTS: NetworkCategory[] = [
  { label: "Construction Materials", blurb: "Cement, steel, aggregates, tiles and more", href: "/marketplace/categories/building-materials", icon: Boxes },
  { label: "Electrical & Mechanical Products", blurb: "Cables, switchgear, HVAC, pumps and lifts", href: "/marketplace/categories/electrical-mechanical-products", icon: Cable },
  { label: "Infrastructure Products", blurb: "Precast, structural steel, bearings, geosynthetics", href: "/marketplace/categories/infrastructure-products", icon: Landmark },
  { label: "Equipment Rental", blurb: "Excavators, cranes, mixers and more", href: "/marketplace/categories/equipment-rental", icon: Wrench },
];
