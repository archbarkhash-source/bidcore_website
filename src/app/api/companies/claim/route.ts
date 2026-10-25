import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { emailMatchesCompany } from "@/lib/company-domain";
import { getCurrentUser } from "@/lib/current-user";

// Claiming proves ownership by email domain: the member's company email must
// be on the same domain as the company's website / company email. A successful
// claim marks the profile claimed and verified.
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  let body: { state?: unknown; slug?: unknown };
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
    select: { id: true, claimedById: true, website: true, email: true },
  });
  if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

  if (company.claimedById === user.id) return NextResponse.json({ ok: true, alreadyYours: true });
  if (company.claimedById) {
    return NextResponse.json({ error: "This company has already been claimed." }, { status: 409 });
  }
  if (!emailMatchesCompany(user.email, company)) {
    return NextResponse.json(
      {
        error:
          "To claim this company, sign in with an email address on the company's own domain (the same domain as its website or company email).",
      },
      { status: 403 },
    );
  }

  await db.company.update({
    where: { id: company.id },
    data: { claimed: true, verified: true, claimedById: user.id, claimedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
