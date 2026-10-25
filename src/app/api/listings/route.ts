import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { STATES } from "@/lib/data";
import { AVAILABILITY, KIND_META, slugify, type ListingKind } from "@/lib/listings";
import { SESSION_COOKIE, readSessionUserId } from "@/lib/session";
import { pushListing } from "@/lib/contractor-sync";

export const dynamic = "force-dynamic";

async function currentUser() {
  const userId = readSessionUserId((await cookies()).get(SESSION_COOKIE)?.value);
  return userId ? db.user.findUnique({ where: { id: userId } }) : null;
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

// The signed-in member's own listings (one per kind).
export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const listings = await db.memberListing.findMany({ where: { userId: user.id } }).catch(() => []);
  return NextResponse.json({ listings, member: { name: user.name, email: user.email, phone: user.phone, city: user.city } });
}

// Save (create or update) a listing here first, then copy it - signed - to BidcoreAI. A failed copy is queued and retried.
export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const kind = body.kind === "equipment" ? "equipment" : body.kind === "professional" ? "professional" : null;
  if (!kind) return NextResponse.json({ error: "Choose Professional or Equipment.", field: "kind" }, { status: 400 });
  const meta = KIND_META[kind as ListingKind];

  const role = clean(body.role, 120);
  const name = clean(body.name, 200);
  const headline = clean(body.headline, 200) || null;
  const about = clean(body.about, 4000) || null;
  const state = clean(body.state, 100) || null;
  const city = clean(body.city, 120) || null;
  const availability = clean(body.availability, 100) || null;
  const equipmentDetails = clean(body.equipmentDetails, 300) || null;
  const phone = clean(body.phone, 40) || null;
  const email = clean(body.email, 200).toLowerCase() || null;
  const listed = body.listed !== false;
  const skills = (Array.isArray(body.skills) ? body.skills : [])
    .map((s) => clean(s, 60))
    .filter(Boolean)
    .slice(0, 15);
  const expRaw = body.experienceYears === "" || body.experienceYears == null ? null : Number(body.experienceYears);

  if (!name) return NextResponse.json({ error: kind === "equipment" ? "Enter your business name." : "Enter your name.", field: "name" }, { status: 400 });
  if (!meta.roles.includes(role)) return NextResponse.json({ error: `Choose a ${meta.roleLabel.toLowerCase()} from the list.`, field: "role" }, { status: 400 });
  if (state && !STATES.some((s) => s.name === state)) return NextResponse.json({ error: "Choose a state from the list.", field: "state" }, { status: 400 });
  if (availability && !AVAILABILITY.includes(availability)) return NextResponse.json({ error: "Choose availability from the list.", field: "availability" }, { status: 400 });
  if (expRaw !== null && (!Number.isInteger(expRaw) || expRaw < 0 || expRaw > 70)) return NextResponse.json({ error: "Experience must be 0 to 70 years.", field: "experienceYears" }, { status: 400 });
  if (!phone && !email) return NextResponse.json({ error: "Add a phone number or an email so people can contact you.", field: "phone" }, { status: 400 });
  if (phone && phone.replace(/\D/g, "").length < 10) return NextResponse.json({ error: "Enter a valid phone number.", field: "phone" }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address.", field: "email" }, { status: 400 });

  const data = { kind, role, name, headline, about, state, city, skills, experienceYears: expRaw, availability, equipmentDetails, phone, email, listed };
  let saved;
  try {
    saved = await db.memberListing.upsert({
      where: { userId_kind: { userId: user.id, kind } },
      create: { ...data, userId: user.id, slug: `${slugify(`${name}-${role}`)}-${randomBytes(3).toString("hex")}` },
      update: data,
    });
  } catch {
    return NextResponse.json({ error: "Your listing could not be saved right now. Please try again shortly." }, { status: 503 });
  }

  const synced = await pushListing({
    website_listing_id: saved.id,
    website_user_id: user.id,
    email_account: user.email,
    kind,
    role,
    name,
    headline,
    about,
    state,
    city,
    skills,
    experience_years: expRaw,
    availability,
    equipment_details: equipmentDetails,
    phone,
    email,
    listed,
  });
  return NextResponse.json({ ok: true, synced, listing: saved });
}

// Remove one of the member's listings (?kind=professional|equipment); the BidcoreAI copy is removed too.
export async function DELETE(req: NextRequest) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  const kind = new URL(req.url).searchParams.get("kind");
  if (kind !== "professional" && kind !== "equipment") return NextResponse.json({ error: "Choose which listing to remove." }, { status: 400 });
  const row = await db.memberListing.findUnique({ where: { userId_kind: { userId: user.id, kind } } }).catch(() => null);
  if (!row) return NextResponse.json({ ok: true, removed: false });
  await db.memberListing.delete({ where: { id: row.id } });
  const synced = await pushListing({
    website_listing_id: row.id,
    website_user_id: user.id,
    email_account: user.email,
    kind,
    name: row.name,
    listed: false,
    removed: true,
  });
  return NextResponse.json({ ok: true, removed: true, synced });
}
