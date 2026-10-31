// Bidcore contractor directory: the pure rules (no database, no network) so they can be unit-tested. EPC contractors, subcontractors and design-build contractors
// listed from public business information. The public pages only ever get the MASKED contact; the real values are released by src/lib/directory.ts to a signed-in member.

export const DIRECTORY_TYPES = ["EPC Contractor", "Subcontractor", "Design-Build Contractor"] as const;
export const DIRECTORY_CITIES = ["Mumbai", "Delhi"] as const;
export const CONTACTS_PER_MEMBER_PER_DAY = 40; // different companies one member may open in a day (stops a member from copying the whole directory)

/** Which directory type a member's company type belongs to, or null when it is not a contractor (suppliers, architects, developers ... are not in this list). */
export function directoryTypeFor(companyType: string | null | undefined): (typeof DIRECTORY_TYPES)[number] | null {
  const t = (companyType ?? "").toLowerCase();
  if (!t) return null;
  if (t.includes("design") && t.includes("build")) return "Design-Build Contractor";
  if (/subcontractor|specialty|mep|electrical|plumbing|interior|hvac|fire/.test(t)) return "Subcontractor";
  if (/contractor|epc/.test(t)) return "EPC Contractor";
  return null;
}

const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export function cleanPhone(raw: string | null | undefined): string | null {
  let digits = (raw ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  if (digits.length > 10 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length > 10 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits.length === 10 ? `+91 ${digits}` : (raw ?? "").trim().slice(0, 40) || null;
}

export function cleanEmail(raw: string | null | undefined): string | null {
  const e = (raw ?? "").trim().toLowerCase();
  return EMAIL.test(e) ? e : null;
}

export function hostOf(url: string | null | undefined): string {
  const u = (url ?? "").trim();
  if (!u) return "";
  try {
    const host = new URL(u.includes("//") ? u : `https://${u}`).hostname.toLowerCase();
    return host.startsWith("www.") ? host.slice(4) : host;
  } catch {
    return "";
  }
}

export const normaliseWebsite = (url: string | null | undefined): string | null => {
  const h = hostOf(url);
  return h ? `https://${h}` : null;
};

export const slugify = (text: string, max = 70): string =>
  text
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max) || "company";

/** One company is one row: the website's host when it has one, else name + city. */
export const keyOf = (name: string, website: string | null | undefined, city: string): string => hostOf(website) || `${slugify(name)}-${slugify(city)}`;

export function maskPhone(phone: string | null | undefined): string | null {
  const digits = (phone ?? "").replace(/\D/g, "");
  if (digits.length < 8) return null;
  const n = digits.slice(-10);
  return `+91 ${n.slice(0, 2)}******${n.slice(-2)}`;
}

export function maskEmail(email: string | null | undefined): string | null {
  if (!email || !email.includes("@")) return null;
  const [local, domain] = [email.slice(0, email.indexOf("@")), email.slice(email.indexOf("@") + 1)];
  const dot = domain.lastIndexOf(".");
  const host = dot > 0 ? domain.slice(0, dot) : domain;
  const tld = dot > 0 ? domain.slice(dot + 1) : "";
  return `${local.slice(0, 1)}***@${host.slice(0, 1)}***.${tld}`;
}

export const maskAddress = (address: string | null | undefined, city: string | null | undefined): string | null =>
  address ? (city ? `**** **** ****, ${city}` : "**** **** ****") : null;

export interface MaskedContact {
  available: true;
  phone: string | null;
  email: string | null;
  address: string | null;
}

/** What the public pages may show: null when the company has no contact details at all. */
export function publicContact(row: { phone: string | null; email: string | null; address: string | null; city: string | null }): MaskedContact | null {
  const out = { phone: maskPhone(row.phone), email: maskEmail(row.email), address: maskAddress(row.address, row.city) };
  return out.phone || out.email || out.address ? { available: true, ...out } : null;
}
