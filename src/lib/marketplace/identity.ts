// Normalisation + validation of the identifiers used to recognise "the same company": registered name, domain, GSTIN, CIN, e-mail, phone.
// Pure functions, safe on client and server.

const SUFFIXES = /\b(private|pvt|public|limited|ltd|llp|llc|inc|incorporated|corporation|corp|company|co|india|opc|and|the)\b/g;

/** "ABC Constructions Pvt. Ltd." and "A.B.C. Constructions Private Limited" both become "abcconstructions". */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\./g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(SUFFIXES, " ")
    .replace(/\s+/g, "")
    .trim();
}

export function domainOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(/^https?:\/\//i.test(url.trim()) ? url.trim() : `https://${url.trim()}`).hostname.toLowerCase().replace(/^www\./, "");
    return host.includes(".") ? host : null;
  } catch {
    return null;
  }
}

export function normalizeWebsite(url: string | null | undefined): string | null {
  const v = url?.trim();
  if (!v) return null;
  const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
  try {
    const u = new URL(withProto);
    if (!u.hostname.includes(".")) return null;
    return u.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export const normalizeEmail = (e: string | null | undefined): string | null => {
  const v = e?.trim().toLowerCase();
  return v && EMAIL_RE.test(v) ? v : null;
};
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizePhone(p: string | null | undefined): string | null {
  const digits = (p ?? "").replace(/[^\d+]/g, "");
  const only = digits.replace(/\D/g, "");
  return only.length >= 10 && only.length <= 15 ? digits : null;
}

export const GSTIN_RE = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
export const CIN_RE = /^[LU]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/;
export const PIN_RE = /^[1-9]\d{5}$/;

export const normalizeGstin = (g: string | null | undefined): string | null => {
  const v = g?.trim().toUpperCase().replace(/\s+/g, "");
  return v && GSTIN_RE.test(v) ? v : null;
};
export const normalizeCin = (c: string | null | undefined): string | null => {
  const v = c?.trim().toUpperCase().replace(/\s+/g, "");
  return v && CIN_RE.test(v) ? v : null;
};

/** Only http(s) URLs may be stored for images / documents / links. */
export function safeUrl(v: unknown, max = 500): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim().slice(0, max);
  try {
    const u = new URL(t);
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : null;
  } catch {
    return null;
  }
}
