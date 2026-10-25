import { COMPANY_TYPES } from "@/lib/data";

// Shared (client + server) marketplace vocabulary. Nothing here touches the database.

export const MP = "/marketplace";

export type ListingKind = "product" | "service";

export interface AttributeDef {
  key: string;
  label: string;
  type: "text" | "number" | "select";
  unit?: string;
  options?: string[];
}

export interface DefaultCategory {
  slug: string;
  name: string;
  kind: "product" | "service" | "both";
  description: string;
  children?: { slug: string; name: string; attributes?: AttributeDef[] }[];
  attributes?: AttributeDef[];
}

const dia = (unit = "mm"): AttributeDef => ({ key: "diameter", label: "Diameter / size", type: "text", unit });

// The 12 top-level marketplace categories. They are copied into the database by `npm run db:seed:marketplace` (or the admin "Add default categories" button), after which an
// admin owns them: names, order, subcategories and the specification fields of each category are edited in the database, not here.
export const DEFAULT_CATEGORIES: DefaultCategory[] = [
  {
    slug: "building-materials",
    name: "Building Materials",
    kind: "product",
    description: "Cement, steel, aggregates, blocks, concrete, tiles, paints and other materials for building works.",
    children: [
      { slug: "cement", name: "Cement", attributes: [
        { key: "grade", label: "Grade", type: "select", options: ["OPC 43", "OPC 53", "PPC", "PSC", "Other"] },
        { key: "pack", label: "Pack size", type: "text", unit: "kg" },
        { key: "standard", label: "Standard (IS code)", type: "text" },
      ] },
      { slug: "steel-tmt", name: "Steel and TMT Bars", attributes: [
        { key: "grade", label: "Grade", type: "select", options: ["Fe 415", "Fe 500", "Fe 500D", "Fe 550", "Fe 550D", "Fe 600", "Other"] },
        dia(),
        { key: "standard", label: "Standard (IS code)", type: "text" },
      ] },
      { slug: "aggregates-sand", name: "Aggregates and Sand" },
      { slug: "bricks-blocks", name: "Bricks and Blocks" },
      { slug: "ready-mix-concrete", name: "Ready-Mix Concrete", attributes: [
        { key: "grades", label: "Grades offered", type: "text", unit: "M-grade" },
        { key: "plant_capacity", label: "Plant capacity", type: "text", unit: "m³/h" },
      ] },
      { slug: "tiles-flooring", name: "Tiles and Flooring" },
      { slug: "paints-coatings", name: "Paints and Coatings" },
      { slug: "waterproofing-chemicals", name: "Waterproofing and Construction Chemicals" },
      { slug: "timber-plywood", name: "Timber, Plywood and Doors" },
    ],
  },
  {
    slug: "construction-equipment",
    name: "Construction Equipment",
    kind: "product",
    description: "Earthmoving, lifting, concrete, compaction and paving machinery, scaffolding and tools.",
    attributes: [
      { key: "make_model", label: "Make and model", type: "text" },
      { key: "capacity", label: "Capacity / rating", type: "text" },
      { key: "condition", label: "Condition", type: "select", options: ["New", "Used", "Refurbished"] },
      { key: "year", label: "Year of manufacture", type: "number" },
    ],
    children: [
      { slug: "earthmoving", name: "Earthmoving Machinery" },
      { slug: "cranes-lifting", name: "Cranes and Lifting Equipment" },
      { slug: "concrete-equipment", name: "Concrete Equipment" },
      { slug: "compaction-paving", name: "Compaction and Paving Equipment" },
      { slug: "scaffolding-formwork", name: "Scaffolding and Formwork" },
    ],
  },
  {
    slug: "tools-safety-site-products",
    name: "Tools, Safety and Site Products",
    kind: "product",
    description: "Surveying instruments, safety products, power tools and everyday site equipment.",
    children: [
      { slug: "surveying-instruments", name: "Surveying and Measuring Instruments" },
      { slug: "safety-ppe", name: "Safety Equipment and PPE" },
      { slug: "power-tools", name: "Power Tools and Hand Tools" },
      { slug: "site-equipment", name: "Site Equipment and Consumables" },
    ],
  },
  {
    slug: "electrical-mechanical-products",
    name: "Electrical and Mechanical Products",
    kind: "product",
    description: "Cables, switchgear, transformers, lighting, HVAC, pumps, motors and generators.",
    children: [
      { slug: "cables-wires", name: "Cables and Wires", attributes: [
        { key: "voltage", label: "Voltage grade", type: "select", options: ["Up to 1.1 kV", "3.3 – 11 kV", "22 – 33 kV", "66 kV and above"] },
        { key: "core", label: "Cores / conductor", type: "text" },
        { key: "insulation", label: "Insulation", type: "select", options: ["PVC", "XLPE", "FRLS", "Rubber", "Other"] },
        { key: "standard", label: "Standard (IS code)", type: "text" },
      ] },
      { slug: "transformers-switchgear", name: "Transformers and Switchgear", attributes: [
        { key: "rating", label: "Rating", type: "text", unit: "kVA / kV" },
        { key: "standard", label: "Standard", type: "text" },
      ] },
      { slug: "lighting", name: "Lighting" },
      { slug: "hvac", name: "HVAC and Ventilation" },
      { slug: "pumps-motors", name: "Pumps and Motors" },
      { slug: "generators", name: "Generators and DG Sets", attributes: [
        { key: "rating", label: "Rating", type: "text", unit: "kVA" },
        { key: "fuel", label: "Fuel", type: "select", options: ["Diesel", "Gas", "Dual fuel", "Other"] },
      ] },
      { slug: "lifts-elevators", name: "Lifts and Elevators" },
    ],
  },
  {
    slug: "infrastructure-products",
    name: "Infrastructure Products",
    kind: "product",
    description: "Precast elements, structural steel, bearings, expansion joints and geosynthetics.",
    children: [
      { slug: "precast", name: "Precast Concrete" },
      { slug: "structural-steel", name: "Structural Steel and Fabrication" },
      { slug: "bearings-joints", name: "Bridge Bearings and Expansion Joints" },
      { slug: "geosynthetics", name: "Geosynthetics" },
    ],
  },
  {
    slug: "roads-highway-products",
    name: "Roads and Highway Products",
    kind: "product",
    description: "Crash barriers, signage, road marking, bitumen and street lighting.",
    children: [
      { slug: "crash-barriers", name: "Crash Barriers", attributes: [
        { key: "type", label: "Barrier type", type: "select", options: ["W-beam", "Thrie-beam", "Concrete", "Wire rope", "Other"] },
        { key: "material", label: "Material / coating", type: "text" },
        { key: "standard", label: "Standard (IRC / IS)", type: "text" },
      ] },
      { slug: "road-signage", name: "Road Signage" },
      { slug: "road-marking", name: "Road Marking Materials" },
      { slug: "bitumen", name: "Bitumen and Emulsions" },
      { slug: "street-lighting", name: "Street Lighting" },
    ],
  },
  {
    slug: "water-pipeline-systems",
    name: "Water and Pipeline Systems",
    kind: "product",
    description: "Pipes, valves, fittings and water treatment equipment.",
    children: [
      { slug: "pipes", name: "Pipes", attributes: [
        { key: "material", label: "Material", type: "select", options: ["DI", "HDPE", "uPVC", "CPVC", "MS", "GRP", "RCC", "Other"] },
        dia(),
        { key: "pressure", label: "Pressure class", type: "text" },
        { key: "standard", label: "Standard (IS code)", type: "text" },
      ] },
      { slug: "valves-fittings", name: "Valves and Fittings" },
      { slug: "water-treatment", name: "Water Treatment Equipment" },
    ],
  },
  {
    slug: "industrial-epc-equipment",
    name: "Industrial and EPC Equipment",
    kind: "product",
    description: "Process and plant equipment, boilers, tanks, conveyors and packages for EPC projects.",
    attributes: [
      { key: "make_model", label: "Make and model", type: "text" },
      { key: "capacity", label: "Capacity / rating", type: "text" },
      { key: "standard", label: "Standard / code", type: "text" },
    ],
  },
  {
    slug: "equipment-rental",
    name: "Equipment Rental",
    kind: "service",
    description: "Hire of construction machinery, cranes, vehicles and survey instruments, with or without operator.",
  },
  {
    slug: "engineering-consultancy",
    name: "Engineering and Consultancy",
    kind: "service",
    description: "Structural and infrastructure design, project management consultancy and technical advisory.",
  },
  {
    slug: "testing-inspection-services",
    name: "Testing and Inspection Services",
    kind: "service",
    description: "Material testing, NDT, quality audits and third-party inspection.",
  },
  {
    slug: "surveying-geotechnical-services",
    name: "Surveying and Geotechnical Services",
    kind: "service",
    description: "Land and topographic surveys, geotechnical investigation and soil testing.",
  },
  {
    slug: "construction-contractors",
    name: "Construction Contractors and Service Providers",
    kind: "service",
    description: "Civil, electrical, mechanical and specialist contractors, installation and commissioning.",
  },
];

/** The shopping sections of /marketplace. A group lists listings (products and services alike) from its categories and their subcategories. */
export const SHOP_GROUPS: { key: string; title: string; blurb: string; slugs: string[]; href: string }[] = [
  { key: "materials", title: "Construction Materials", blurb: "Steel, cement, aggregates, pipes and other materials.", slugs: ["building-materials", "roads-highway-products", "water-pipeline-systems", "infrastructure-products"], href: "/marketplace/products?category=building-materials" },
  { key: "equipment", title: "Equipment and Machinery", blurb: "Construction machinery, equipment and rental providers.", slugs: ["construction-equipment", "equipment-rental", "industrial-epc-equipment", "electrical-mechanical-products"], href: "/marketplace/categories/construction-equipment" },
  { key: "tools", title: "Tools, Safety and Site Products", blurb: "Surveying tools, safety products and site equipment.", slugs: ["tools-safety-site-products"], href: "/marketplace/categories/tools-safety-site-products" },
  { key: "services", title: "Professional Services", blurb: "Engineering, surveying, testing and specialist services.", slugs: ["engineering-consultancy", "testing-inspection-services", "surveying-geotechnical-services", "construction-contractors"], href: "/marketplace/services" },
];

export const BUSINESS_TYPES: string[] = [
  ...COMPANY_TYPES,
  "Manufacturer",
  "Distributor / Dealer",
  "Equipment Rental Provider",
  "Testing and Inspection Laboratory",
  "Engineering Consultant",
  "Surveying and Geotechnical Firm",
  "Other",
];

/** Free plan: active (non-archived) listings per company. */
export const FREE_LISTING_LIMIT = 10;

export const UNITS = ["piece", "kg", "tonne", "metre", "sq.m", "cu.m", "litre", "bag", "set", "lot", "day", "month"];
export const AVAILABILITY_OPTIONS = ["In stock", "Made to order", "Available on request"];

// ── Statuses ──────────────────────────────────────────────────────────────────────────────────────────────────────────

export const ENQUIRY_STATUSES = [
  { value: "new", label: "New" },
  { value: "responded", label: "Responded" },
  { value: "in_discussion", label: "In discussion" },
  { value: "converted", label: "Converted" },
  { value: "closed", label: "Closed" },
] as const;
export const enquiryStatusLabel = (v: string) => ENQUIRY_STATUSES.find((s) => s.value === v)?.label ?? (v === "spam" ? "Marked as spam" : v);

export const LISTING_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  pending: "Awaiting review",
  published: "Published",
  rejected: "Not approved",
  archived: "Archived",
};
export const COMPANY_STATUS_LABEL: Record<string, string> = {
  unlisted: "Not listed",
  pending: "Awaiting review",
  published: "Published",
  rejected: "Not approved",
  suspended: "Suspended",
};

// Distinct definitions - shown to visitors on the profile and in the dashboard. None may be used in place of another.
export const TRUST_DEFINITIONS = [
  { key: "imported", label: "Listed from public sources", text: "Basic business details were added by Bidcore from public or licensed sources. The company has not confirmed them." },
  { key: "claimed", label: "Claimed", text: "A representative proved they act for the company (a company-domain e-mail, or a reviewed request). Details may now be maintained by the company." },
  { key: "verified", label: "Verified by Bidcore", text: "Bidcore reviewed supporting evidence for the company. This is only shown after that review is complete." },
  { key: "featured", label: "Featured", text: "Placed in a featured section by the Bidcore team. It is not a verification and not a paid placement." },
] as const;

export const REPORT_REASONS = [
  { value: "incorrect_info", label: "Information is incorrect" },
  { value: "removal_request", label: "Request removal of this listing" },
  { value: "spam", label: "Spam or misleading" },
  { value: "abuse", label: "Abusive or fraudulent" },
  { value: "other", label: "Something else" },
] as const;

export const slugifyText = (text: string, max = 60): string =>
  text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max)
    .replace(/-+$/, "");

/** Split a comma / newline separated form field into trimmed, de-duplicated items. */
export function splitList(value: string | null | undefined, maxItems = 30, maxLen = 80): string[] {
  if (!value) return [];
  const out: string[] = [];
  for (const raw of value.split(/[,\n;]/)) {
    const v = raw.trim().slice(0, maxLen);
    if (v && !out.some((x) => x.toLowerCase() === v.toLowerCase())) out.push(v);
    if (out.length >= maxItems) break;
  }
  return out;
}
