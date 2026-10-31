import "server-only";
import { db } from "@/lib/db";
import { CONTACTS_PER_MEMBER_PER_DAY, directoryTypeFor, normaliseWebsite, publicContact, slugify, type MaskedContact } from "@/lib/directory-core";
import { DIRECTORY_SCHEMA_SQL } from "@/lib/directory-schema";

// The Bidcore contractor directory lives in this site's own Postgres (Neon) database, in `directory_companies`, and is read straight from the pages on Vercel:
// no separate backend server. Created and filled by `npm run directory:import` (scripts/directory-import.ts; the SQL is in src/lib/directory-schema.ts).

export interface DirectoryCompany {
  slug: string;
  name: string;
  type: string | null;
  state: string | null;
  city: string | null;
  trades: string[];
  website: string | null;
  contact?: MaskedContact;
  verified_on?: string | null;
}

export interface DirectoryPage {
  items: DirectoryCompany[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

type Row = {
  id: number;
  slug: string;
  name: string;
  type: string;
  city: string;
  state: string | null;
  trades: string[] | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  verified_on: Date | null;
};

const toPublic = (r: Row): DirectoryCompany => {
  const contact = publicContact(r);
  return {
    slug: r.slug,
    name: r.name,
    type: r.type,
    state: r.state,
    city: r.city,
    trades: r.trades ?? [],
    website: r.website,
    ...(contact ? { contact, verified_on: r.verified_on ? r.verified_on.toISOString().slice(0, 10) : null } : {}),
  };
};

const COLUMNS = "id, slug, name, type, city, state, trades, website, email, phone, address, verified_on";

export async function listDirectory(f: { q?: string; city?: string; state?: string; type?: string; page?: number; page_size?: number }): Promise<{ ok: true; data: DirectoryPage } | { ok: false; status: number }> {
  const page = Math.max(1, f.page ?? 1);
  const size = Math.min(60, Math.max(1, f.page_size ?? 24));
  const where: string[] = ["listed = TRUE"];
  const params: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    params.push(value);
    where.push(sql.replace("?", `$${params.length}`));
  };
  if (f.q?.trim()) add("name ILIKE ?", `%${f.q.trim().slice(0, 100)}%`);
  if (f.city?.trim()) add("LOWER(city) = LOWER(?)", f.city.trim());
  if (f.state?.trim()) add("LOWER(state) = LOWER(?)", f.state.trim());
  if (f.type?.trim()) add("type ILIKE ?", `%${f.type.trim().slice(0, 60)}%`);
  const clause = where.join(" AND ");
  try {
    const total = Number((await db.$queryRawUnsafe<{ n: bigint }[]>(`SELECT COUNT(*) AS n FROM directory_companies WHERE ${clause}`, ...params))[0]?.n ?? 0);
    const rows = await db.$queryRawUnsafe<Row[]>(
      `SELECT ${COLUMNS} FROM directory_companies WHERE ${clause} ORDER BY name ASC LIMIT ${size} OFFSET ${(page - 1) * size}`,
      ...params,
    );
    return { ok: true, data: { items: rows.map(toPublic), total, page, page_size: size, pages: Math.max(1, Math.ceil(total / size)) } };
  } catch {
    return { ok: false, status: 0 }; // table not created yet, or the database is unreachable: the page shows its "temporarily unavailable" text
  }
}

export async function getDirectoryCompany(slug: string): Promise<{ ok: true; data: DirectoryCompany } | { ok: false; status: number }> {
  try {
    const rows = await db.$queryRawUnsafe<Row[]>(`SELECT ${COLUMNS} FROM directory_companies WHERE slug = $1 AND listed = TRUE LIMIT 1`, slug);
    return rows[0] ? { ok: true, data: toPublic(rows[0]) } : { ok: false, status: 404 };
  } catch {
    return { ok: false, status: 0 };
  }
}

export interface RevealedContact {
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
}

export type RevealResult = { ok: true; contact: RevealedContact } | { ok: false; status: 404 | 429 | 503; message: string };

/** The real contact of one company, for a signed-in member. Opening the same company again the same day is free; a member can open
 *  CONTACTS_PER_MEMBER_PER_DAY different companies a day. Every opening is recorded (member, company, day). */
export async function revealDirectoryContact(slug: string, memberId: string): Promise<RevealResult> {
  try {
    const rows = await db.$queryRawUnsafe<Row[]>(`SELECT ${COLUMNS} FROM directory_companies WHERE slug = $1 AND listed = TRUE LIMIT 1`, slug);
    const row = rows[0];
    if (!row || !(row.phone || row.email || row.address)) return { ok: false, status: 404, message: "No contact details are listed for this company." };
    const seen = await db.$queryRawUnsafe<{ company_id: number }[]>(`SELECT company_id FROM directory_contact_views WHERE member_id = $1 AND day = CURRENT_DATE`, memberId);
    if (!seen.some((s) => s.company_id === row.id) && seen.length >= CONTACTS_PER_MEMBER_PER_DAY) {
      return { ok: false, status: 429, message: "You have reached today's limit for viewing contact details. Please try again tomorrow." };
    }
    await db.$executeRawUnsafe(`INSERT INTO directory_contact_views (member_id, company_id, day) VALUES ($1, $2, CURRENT_DATE) ON CONFLICT DO NOTHING`, memberId, row.id);
    return { ok: true, contact: { phone: row.phone, email: row.email, address: row.address, website: row.website } };
  } catch {
    return { ok: false, status: 503, message: "Contact details are temporarily unavailable. Please try again in a few minutes." };
  }
}

let tablesReady = false;
async function ensureTables() {
  if (tablesReady) return;
  for (const sql of DIRECTORY_SCHEMA_SQL) await db.$executeRawUnsafe(sql);
  tablesReady = true;
}

/** A member's own company card -> the directory. Listed when the member chose to be listed AND the company type is a contractor type; otherwise any earlier
 *  listing is switched off. No phone, e-mail or address is stored for a member's company (the add-company form promises they are never shown). Returns whether it is listed. */
export async function syncMemberDirectory(
  userId: string,
  c: { companyName: string; companyType: string | null; city: string | null; state: string | null; trades: string[]; website: string | null; listed: boolean },
): Promise<boolean> {
  const type = directoryTypeFor(c.companyType);
  const key = `member:${userId}`;
  try {
    await ensureTables();
    if (!type || !c.listed) {
      await db.$executeRawUnsafe(`UPDATE directory_companies SET listed = FALSE, updated_at = now() WHERE key = $1`, key);
      return false;
    }
    const city = c.city || c.state || "India";
    const slug = `${slugify(c.companyName)}-${slugify(city)}-m${userId.slice(-6).toLowerCase()}`;
    await db.$executeRawUnsafe(
      `INSERT INTO directory_companies (key, slug, name, type, city, state, trades, website, verified_on)
       VALUES ($1, $2, $3, $4, $5, $6, $7::text[], $8, CURRENT_DATE)
       ON CONFLICT (key) DO UPDATE SET name = EXCLUDED.name, type = EXCLUDED.type, city = EXCLUDED.city, state = EXCLUDED.state, trades = EXCLUDED.trades,
         website = EXCLUDED.website, listed = TRUE, updated_at = now()`,
      key,
      slug,
      c.companyName,
      type,
      city,
      c.state,
      c.trades.slice(0, 12),
      normaliseWebsite(c.website),
    );
    return true;
  } catch {
    return false; // the company card itself is already saved; the directory copy is retried the next time the member saves
  }
}
