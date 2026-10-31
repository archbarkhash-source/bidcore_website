// The category pages of the contractor directory: /contractors/<slug>. Each is the directory filtered by one contractor type or one city.
export interface ContractorCategory {
  slug: string;
  title: string; // the page heading
  description: string;
  filter: { type?: string; city?: string };
}

export const CONTRACTOR_CATEGORIES: ContractorCategory[] = [
  { slug: "epc-contractors", title: "EPC Contractors", description: "EPC contractors listed on Bidcore: engineering, procurement and construction companies for buildings and infrastructure.", filter: { type: "EPC Contractor" } },
  { slug: "subcontractors", title: "Subcontractors", description: "Subcontractors and specialty contractors listed on Bidcore: steel, MEP, formwork, waterproofing, piling and more.", filter: { type: "Subcontractor" } },
  { slug: "design-build-contractors", title: "Design-Build Contractors", description: "Design-build and turnkey contractors listed on Bidcore.", filter: { type: "Design-Build Contractor" } },
  { slug: "mumbai", title: "Contractors in Mumbai", description: "EPC contractors, subcontractors and design-build contractors in Mumbai, listed on Bidcore.", filter: { city: "Mumbai" } },
  { slug: "delhi", title: "Contractors in Delhi", description: "EPC contractors, subcontractors and design-build contractors in Delhi, listed on Bidcore.", filter: { city: "Delhi" } },
];

export const categoryOf = (slug: string) => CONTRACTOR_CATEGORIES.find((c) => c.slug === slug);
