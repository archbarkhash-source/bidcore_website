import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";
import { visibleCompany } from "@/lib/marketplace/queries";

export const dynamic = "force-dynamic";

// Contact details of a marketplace company, for signed-in members only (the same rule as the rest of the site). Companies that chose to publish their contact
// details show them to everyone on the profile page itself, so this route is not needed for them.
export async function GET(req: NextRequest) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) return NextResponse.json({ error: "Sign in to view contact details." }, { status: 401 });
  const slug = new URL(req.url).searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug is required." }, { status: 400 });
  const c = await db.company.findFirst({ where: { marketplaceSlug: slug, ...visibleCompany }, select: { phone: true, email: true, address: true, pinCode: true } });
  if (!c) return NextResponse.json({ error: "Company not found." }, { status: 404 });
  return NextResponse.json({ contact: c });
}
