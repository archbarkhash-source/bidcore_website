// Explore > Professionals and Equipment: people (site engineers, QA engineers, surveyors ...) and equipment owners who list themselves so general contractors and
// subcontractors can find them. Free to list; the contact details are shown to signed-in members (verified e-mail) only.

export type ListingKind = "professional" | "equipment";

export const PROFESSIONAL_ROLES = [
  "Site Engineer",
  "QA / QC Engineer",
  "Surveyor",
  "Quantity Surveyor",
  "Planning Engineer",
  "Billing Engineer",
  "Safety Officer",
  "Project Manager",
  "Foreman / Supervisor",
  "Draftsman",
  "Architect",
  "Interior Designer",
  "Other",
];

export const EQUIPMENT_TYPES = [
  "Excavator",
  "Backhoe Loader (JCB)",
  "Crane",
  "Concrete Mixer / Batching Plant",
  "Transit Mixer",
  "Roller / Compactor",
  "Tipper / Dumper",
  "Paver / Grader",
  "Scaffolding / Shuttering",
  "Generator",
  "Survey instruments (Total Station)",
  "Other",
];

export const AVAILABILITY = ["Available now", "Within 2 weeks", "Within a month", "Not available"];

export const KIND_META: Record<ListingKind, { plural: string; singular: string; path: string; roleLabel: string; roles: string[]; blurb: string }> = {
  professional: {
    plural: "Professionals",
    singular: "professional",
    path: "/professionals",
    roleLabel: "Role",
    roles: PROFESSIONAL_ROLES,
    blurb: "Site engineers, QA / QC engineers, surveyors and other construction professionals open to work.",
  },
  equipment: {
    plural: "Equipment",
    singular: "equipment listing",
    path: "/equipment",
    roleLabel: "Equipment type",
    roles: EQUIPMENT_TYPES,
    blurb: "Equipment owners and rental companies with excavators, cranes, mixers, survey instruments and more.",
  },
};

export const slugify = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "listing";
