import { isBusinessEmail } from "@/lib/email-domain";

function hostOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

// Domains that prove a person works at the company: the website's host and
// the domain of a company-domain email.
export function companyDomains(company: { website: string | null; email: string | null }): string[] {
  const domains: string[] = [];
  const site = hostOf(company.website);
  if (site) domains.push(site);
  if (company.email && isBusinessEmail(company.email)) {
    const d = company.email.split("@")[1]?.toLowerCase();
    if (d) domains.push(d);
  }
  return domains;
}

const sameOrSub = (a: string, b: string) => a === b || a.endsWith(`.${b}`) || b.endsWith(`.${a}`);

// A member may claim a company when their email is on the company's domain.
export function emailMatchesCompany(
  userEmail: string,
  company: { website: string | null; email: string | null },
): boolean {
  const userDomain = userEmail.split("@")[1]?.toLowerCase();
  if (!userDomain) return false;
  return companyDomains(company).some((d) => sameOrSub(userDomain, d));
}
