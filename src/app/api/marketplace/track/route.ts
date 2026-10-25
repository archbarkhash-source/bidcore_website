import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { visibleCompany } from "@/lib/marketplace/queries";

export const dynamic = "force-dynamic";

// Page-view beacon. Records only company_view / listing_view for public, published records; anything else is ignored.
export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  if (/bot|crawl|spider|slurp|preview|headless/i.test(ua)) return new NextResponse(null, { status: 204 });
  try {
    const b = (await req.json()) as { type?: string; id?: string };
    if (typeof b.id !== "string" || b.id.length > 40) return new NextResponse(null, { status: 204 });
    if (b.type === "company_view") {
      const c = await db.company.findFirst({ where: { id: b.id, ...visibleCompany }, select: { id: true } });
      if (c) await db.marketplaceEvent.create({ data: { type: "company_view", companyId: c.id } });
    } else if (b.type === "listing_view") {
      const l = await db.marketplaceListing.findFirst({ where: { id: b.id, status: "published", company: visibleCompany }, select: { id: true, companyId: true } });
      if (l) await db.marketplaceEvent.create({ data: { type: "listing_view", companyId: l.companyId, listingId: l.id } });
    }
  } catch {
    // analytics must never surface an error to a visitor
  }
  return new NextResponse(null, { status: 204 });
}
