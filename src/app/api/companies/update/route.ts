import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/current-user";

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) || null : null);
const list = (v: unknown, maxItems: number, maxLen: number) =>
  Array.isArray(v)
    ? v
        .filter((x): x is string => typeof x === "string")
        .map((x) => x.trim().slice(0, maxLen))
        .filter(Boolean)
        .slice(0, maxItems)
    : [];

// Only the member who claimed a company can edit its profile. Website and
// email are not editable here — they are what proves the domain.
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  if (typeof body.state !== "string" || typeof body.slug !== "string") {
    return NextResponse.json({ error: "state and slug are required." }, { status: 400 });
  }

  const company = await db.company.findFirst({
    where: { slug: body.slug, active: true, state: { slug: body.state } },
    select: { id: true, claimedById: true },
  });
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });
  if (company.claimedById !== user.id) {
    return NextResponse.json({ error: "Only the member who claimed this company can edit it." }, { status: 403 });
  }

  await db.company.update({
    where: { id: company.id },
    data: {
      about: text(body.about, 2000),
      phone: text(body.phone, 40),
      address: text(body.address, 400),
      sizeRange: text(body.sizeRange, 60),
      specializations: list(body.specializations, 20, 60),
      operatingLocations: list(body.operatingLocations, 30, 60),
    },
  });
  return NextResponse.json({ ok: true });
}
