import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { COMPANY_TYPES, STATES } from "@/lib/data";
import { SESSION_COOKIE, readSessionUserId } from "@/lib/session";
import { payloadFor, pushContractor } from "@/lib/contractor-sync";
import { syncMemberDirectory } from "@/lib/directory";

export const dynamic = "force-dynamic";

async function currentUser() {
  const userId = readSessionUserId((await cookies()).get(SESSION_COOKIE)?.value);
  return userId ? db.user.findUnique({ where: { id: userId } }) : null;
}

// The signed-in member's company card (what they added, else what they gave when they signed up).
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const saved = await db.memberCompany.findUnique({ where: { userId: user.id } }).catch(() => null);
  return NextResponse.json({
    company: saved ?? {
      companyName: user.companyName,
      companyType: null,
      state: null,
      city: user.city,
      trades: [],
      website: null,
      about: null,
      listed: true,
    },
    saved: !!saved,
  });
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// Save the card in this site's database, list it in the contractor directory (when it is a contractor type), and copy it to BidcoreAI only when a backend is configured.
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const companyName = clean(body.companyName, 300);
  const companyType = clean(body.companyType, 100) || null;
  const state = clean(body.state, 100) || null;
  const city = clean(body.city, 120) || null;
  const about = clean(body.about, 4000) || null;
  let website = clean(body.website, 300) || null;
  const trades = (Array.isArray(body.trades) ? body.trades : [])
    .map((t) => clean(t, 60))
    .filter(Boolean)
    .slice(0, 15);
  const listed = body.listed !== false;
  // The point of contact for tender invites. Their e-mail and mobile are the member's own, verified by one-time codes.
  const contactName = clean(body.contactName, 120) || null;
  const designation = clean(body.designation, 100) || null;

  if (!companyName) return NextResponse.json({ error: "Enter your company name.", field: "companyName" }, { status: 400 });
  if (companyType && !COMPANY_TYPES.includes(companyType as (typeof COMPANY_TYPES)[number]))
    return NextResponse.json({ error: "Choose a company type from the list.", field: "companyType" }, { status: 400 });
  if (state && !STATES.some((s) => s.name === state)) return NextResponse.json({ error: "Choose a state from the list.", field: "state" }, { status: 400 });
  if (website) {
    if (!/^https?:\/\//i.test(website)) website = `https://${website}`;
    try {
      new URL(website);
    } catch {
      return NextResponse.json({ error: "Enter a valid website address.", field: "website" }, { status: 400 });
    }
  }

  let saved;
  try {
    saved = await db.memberCompany.upsert({
      where: { userId: user.id },
      create: { userId: user.id, companyName, companyType, state, city, trades, website, about, listed },
      update: { companyName, companyType, state, city, trades, website, about, listed },
    });
  } catch {
    return NextResponse.json({ error: "Your company details could not be saved right now. Please try again shortly." }, { status: 503 });
  }

  const listedInDirectory = await syncMemberDirectory(user.id, { companyName, companyType, city, state, trades, website, listed });
  const synced = await pushContractor({
    ...payloadFor({ id: user.id, email: user.email, companyName, role: companyType ?? user.role, city, name: contactName ?? user.name, phone: user.phone }),
    contact_designation: designation,
    state,
    trades,
    website,
    about,
    listed,
  });
  return NextResponse.json({ ok: true, synced, listedInDirectory, company: saved });
}
