// The contact person a member names on the Add company form (who receives tender invites): name and designation. Their e-mail and mobile are the member's own,
// verified by one-time codes at sign-up, so they are not stored again here. Kept outside prisma/schema.prisma on purpose (like the directory tables), so the table is
// created on first use and no `prisma db push` is needed before a deploy.
import { db } from "@/lib/db";

const SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS member_company_contacts (
  user_id      TEXT PRIMARY KEY,
  contact_name TEXT,
  designation  TEXT,
  country      TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

let ready = false;
async function ensureTable() {
  if (ready) return;
  await db.$executeRawUnsafe(SCHEMA_SQL);
  await db.$executeRawUnsafe(`ALTER TABLE member_company_contacts ADD COLUMN IF NOT EXISTS country TEXT`); // tables made before the Country field existed
  ready = true;
}

export interface MemberContact {
  contactName: string | null;
  designation: string | null;
  country: string | null; // ISO 3166-1 alpha-2
}

export async function saveMemberContact(userId: string, c: MemberContact): Promise<boolean> {
  try {
    await ensureTable();
    await db.$executeRawUnsafe(
      `INSERT INTO member_company_contacts (user_id, contact_name, designation, country) VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id) DO UPDATE SET contact_name = EXCLUDED.contact_name, designation = EXCLUDED.designation, country = EXCLUDED.country, updated_at = now()`,
      userId,
      c.contactName,
      c.designation,
      c.country,
    );
    return true;
  } catch {
    return false;
  }
}

export async function readMemberContact(userId: string): Promise<MemberContact | null> {
  try {
    await ensureTable();
    const rows = await db.$queryRawUnsafe<{ contact_name: string | null; designation: string | null; country: string | null }[]>(
      `SELECT contact_name, designation, country FROM member_company_contacts WHERE user_id = $1`,
      userId,
    );
    return rows[0] ? { contactName: rows[0].contact_name, designation: rows[0].designation, country: rows[0].country } : null;
  } catch {
    return null;
  }
}
