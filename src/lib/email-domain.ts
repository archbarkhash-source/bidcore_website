// Personal / free mailbox providers are not accepted at signup — only
// company-domain emails. Matched on the domain after "@".
const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "hotmail.com",
  "live.com",
  "msn.com",
  "yahoo.com",
  "ymail.com",
  "rocketmail.com",
  "zoho.com",
  "zohomail.com",
  "titan.email",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "pm.me",
  "gmx.com",
  "gmx.net",
  "mail.com",
  "rediffmail.com",
  "yandex.com",
  "inbox.com",
  "fastmail.com",
  "tutanota.com",
  "hey.com",
]);

// Providers that run per-country domains (yahoo.co.in, outlook.in, ...).
const FREE_EMAIL_PREFIXES = ["yahoo.", "outlook.", "hotmail.", "live.", "zoho.", "gmail.", "rediffmail."];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

export function emailDomain(email: string): string {
  return email.trim().toLowerCase().split("@")[1] ?? "";
}

export function isBusinessEmail(email: string): boolean {
  if (!EMAIL_RE.test(email.trim())) return false;
  const domain = emailDomain(email);
  if (FREE_EMAIL_DOMAINS.has(domain)) return false;
  return !FREE_EMAIL_PREFIXES.some((p) => domain.startsWith(p));
}

export const BUSINESS_EMAIL_MESSAGE =
  "Please use your company email address. Personal email providers (Gmail, Outlook, Yahoo, Zoho, Titan, etc.) can't be used to sign up.";
