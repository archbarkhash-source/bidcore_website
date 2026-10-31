import "server-only";
import { db } from "@/lib/db";
import { REQUESTS_SQL } from "@/lib/software-requests-schema";

// Requests for the yearly subscription of an installable program. Saved in this site's own database (table software_requests, created on first use) and e-mailed to the
// owner, who issues the signed licence file with desktop/license-generator and sends it back (npm run requests). The payment columns are there for the day an online
// payment provider is connected: it only has to set payment_status = 'paid' (and, later, issue the licence itself).
let ready = false;
export async function ensureRequestsTable() {
  if (ready) return;
  for (const sql of REQUESTS_SQL) await db.$executeRawUnsafe(sql);
  ready = true;
}

export interface NewRequest {
  product: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  country: string;
  machineCode: string | null;
  message: string | null;
}

export async function saveRequest(r: NewRequest): Promise<number> {
  await ensureRequestsTable();
  const rows = await db.$queryRawUnsafe<{ id: number }[]>(
    `INSERT INTO software_requests (product, years, name, email, phone, company, country, machine_code, message) VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
    r.product,
    r.name,
    r.email,
    r.phone,
    r.company,
    r.country,
    r.machineCode,
    r.message,
  );
  return rows[0].id;
}
