import "server-only";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { MP } from "./constants";

// Admin = a signed-in member whose e-mail is in ADMIN_EMAILS (comma separated). No schema change and no second login system.
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

export function signInUrl(next: string): string {
  return `/sign-in?intent=company&next=${encodeURIComponent(next)}`;
}

export async function requireUser(next: string) {
  const user = await getCurrentUser();
  if (!user) redirect(signInUrl(next));
  return user;
}

/** Admin pages and actions. A signed-out visitor is sent to sign in; a signed-in non-admin sees a 404 (the area is not advertised). */
export async function requireAdmin(next = "/admin/marketplace") {
  const user = await requireUser(next);
  if (!isAdminEmail(user.email)) notFound();
  return user;
}

/** Companies the member manages (claimed by them). */
export function companiesOf(userId: string) {
  return db.company.findMany({ where: { claimedById: userId, active: true }, orderBy: { name: "asc" } });
}

/** The company a member may manage, or null. Admins may manage any company. */
export async function manageableCompany(userId: string, email: string, companyId: string) {
  const company = await db.company.findFirst({ where: { id: companyId, active: true } });
  if (!company) return null;
  if (company.claimedById === userId || isAdminEmail(email)) return company;
  return null;
}

export const dashboardUrl = (companyId?: string) => `${MP}/dashboard${companyId ? `?company=${companyId}` : ""}`;
