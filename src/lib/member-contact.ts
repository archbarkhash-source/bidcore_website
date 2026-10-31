// The contact person a member names on the Add company form (who receives tender invites): name and designation. Their e-mail and mobile are the member's own,
// verified by one-time codes at sign-up, so they are not stored again here. Kept outside prisma/schema.prisma on purpose (like the directory tables), so the table is
// created on first use and no `prisma db push` is needed before a deploy.
import { db } from "@/lib/db";

const SCHEMA_SQL = `CREATE TABLE IF NOT EXISTS member_company_contacts (
  user_id      TEXT PRIMARY KEY,
  contact_name TEXT,
  designation  TEXT,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

let ready = false;
async function ensureTable() {
  if (ready) return;
  await db.$executeRawUnsafe(SCHEMA_SQL);
  ready = true;
}

export interface MemberContact {
  contactName: string | null;
  designation: string | null;
}

export async function saveMemberContact(userId: string, c: MemberContact): Promise<boolean> {
  try {
    await ensureTable();
    await db.$executeRawUnsafe(
      `INSERT INTO member_company_contacts (user_id, contact_name, designation) VALUES ($1, $2, $3)
       ON CONFLICT (user_id) DO UPDATE SET contact_name = EXCLUDED.contact_name, designation = EXCLUDED.designation, updated_at = now()`,
      userId,
      c.contactName,
      c.designation,
    );
    return true;
  } catch {
    return false;
  }
}

export async function readMemberContact(userId: string): Promise<MemberContact | null> {
  try {
    await ensureTable();
    const rows = await db.$queryRawUnsafe<{ contact_name: string | null; designation: string | null }[]>(
      `SELECT contact_name, designation FROM member_company_contacts WHERE user_id = $1`,
      userId,
    );
    return rows[0] ? { contactName: rows[0].contact_name, designation: rows[0].designation } : null;
  } catch {
    return null;
  }
}
