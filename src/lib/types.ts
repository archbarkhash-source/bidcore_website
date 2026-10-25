export type CompanyType =
  | "General Contractor"
  | "Civil Contractor"
  | "Building Contractor"
  | "Infrastructure Contractor"
  | "Real Estate Developer"
  | "EPC Contractor"
  | "MEP Contractor"
  | "Electrical Contractor"
  | "Plumbing Contractor"
  | "Structural Contractor"
  | "Interior Contractor"
  | "Construction Consultant"
  | "Architect"
  | "PMC"
  | "Supplier"
  | "Electrical Supplier"
  | "Building Material Supplier"
  | "Steel & Cement Supplier"
  | "Plumbing & Sanitary Supplier"
  | "Tiles & Flooring Supplier"
  | "Paints & Coatings Supplier"
  | "HVAC Supplier"
  | "Ready-Mix Concrete Supplier";

export interface StateInfo {
  slug: string;
  name: string;
}

export interface CityInfo {
  slug: string;
  name: string;
  stateSlug: string;
}

// Official Ministry of Corporate Affairs company-register details.
export interface RegistryInfo {
  cin: string | null;
  status: string | null;
  listedStatus: string | null;
  roc: string | null;
  registrationNumber: string | null;
  category: string | null;
  subCategory: string | null;
  companyClass: string | null;
  incorporationDate: string | null;
}

export interface Company {
  slug: string;
  name: string;
  stateSlug: string;
  citySlug: string;
  cityName?: string;
  type: CompanyType;
  specializations: string[];
  registry?: RegistryInfo;
  sizeRange?: string;
  operatingLocations?: string[];
  website?: string;
  phone?: string;
  email?: string;
  about?: string;
  founded?: number;
  projectCount?: number;
  verified: boolean;
  claimed: boolean;
}
