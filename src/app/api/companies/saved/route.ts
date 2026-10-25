import { NextRequest, NextResponse } from "next/server";
import { findCompaniesBySlugs } from "@/lib/company-queries";

export const dynamic = "force-dynamic";

// Public listing fields only — no contact details.
export async function GET(req: NextRequest) {
  const slugs = (new URL(req.url).searchParams.get("slugs") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return NextResponse.json({ companies: await findCompaniesBySlugs(slugs) });
}
