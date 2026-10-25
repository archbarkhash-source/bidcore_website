import { NextRequest, NextResponse } from "next/server";
import { isValidEmail } from "@/lib/email-domain";
import { sendMail } from "@/lib/mail";
import { DEMO_INTERESTS, DEMO_ROLES, formatSlotIst, isDemoDate, isDemoTime, istTodayIso } from "@/lib/demo";
import { COUNTRIES } from "@/lib/roles";
import { allow } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const clean = (v: unknown, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

// "Request a Demo": the details go by e-mail to the demo inbox (DEMO_TO_EMAIL, default barkha@bidcoreai.com, the same address the BidcoreAI website uses). The mail names
// the visitor's country as they chose it on the form and the demo slot in IST. Nothing is stored here and no confirmation is sent to the requester, so the form cannot
// be used to mail third parties.
const DEMO_INBOX = "barkha@bidcoreai.com";
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: real visitors never see or fill this field. Pretend success so a bot learns nothing.
  if (clean(body.website)) return NextResponse.json({ ok: true });

  const caller = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!allow(`demo:${caller}`, 5)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  const name = clean(body.name, 120);
  const email = clean(body.email, 200).toLowerCase();
  const phone = clean(body.phone, 40);
  const company = clean(body.company, 160);
  const role = clean(body.role, 80);
  const interest = clean(body.interest, 80);
  const message = clean(body.message, 2000);
  const challenge = clean(body.challenge, 1000);
  const preferredDate = clean(body.preferredDate, 10);
  const preferredTime = clean(body.preferredTime, 5);
  const country = clean(body.country, 80);

  if (!name || !email || !phone || !company || !country) {
    return NextResponse.json({ error: "Name, work email, phone, company and country are required." }, { status: 400 });
  }
  if (!COUNTRIES.some((c) => c.label === country)) return NextResponse.json({ error: "Choose your country from the list.", field: "country" }, { status: 400 });
  if (!isValidEmail(email)) return NextResponse.json({ error: "Enter a valid email address.", field: "email" }, { status: 400 });
  if (phone.replace(/\D/g, "").length < 10) return NextResponse.json({ error: "Enter a valid phone number.", field: "phone" }, { status: 400 });
  if (role && !DEMO_ROLES.includes(role)) return NextResponse.json({ error: "Choose who you are from the list.", field: "role" }, { status: 400 });
  if (interest && !DEMO_INTERESTS.includes(interest)) return NextResponse.json({ error: "Choose a product from the list.", field: "interest" }, { status: 400 });

  // The slot is a date (any day from tomorrow, by India's calendar) and a start time in IST.
  if (!preferredDate || !isDemoDate(preferredDate, istTodayIso())) {
    return NextResponse.json({ error: "Choose a demo date from tomorrow, within the next 90 days.", field: "preferredDate" }, { status: 400 });
  }
  if (!isDemoTime(preferredTime)) {
    return NextResponse.json({ error: "Choose a demo time between 10:00 AM and 5:30 PM IST, on the hour or half hour.", field: "preferredTime" }, { status: 400 });
  }
  const slotLabel = formatSlotIst(preferredDate, preferredTime);

  const to = process.env.DEMO_TO_EMAIL || DEMO_INBOX;

  const rows: [string, string][] = [
    ["Name", name],
    ["Country", `${country} (chosen by the visitor on the form)`],
    ["Work email", email],
    ["Phone", phone],
    ["Company", company],
    ["I am a", role || "-"],
    ["Interested in", interest || "-"],
    ["Biggest challenge", challenge || "-"],
    ["Demo slot (IST)", slotLabel],
    ["Message", message || "-"],
  ];
  try {
    await sendMail({
      to,
      replyTo: email,
      subject: `Demo request from ${country}: ${company} (${interest || "not specified"})`,
      text: rows.map(([k, v]) => `${k}: ${v}`).join("\n"),
      html: `<h2>Demo request</h2><table cellpadding="6">${rows.map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v).replace(/\n/g, "<br>")}</td></tr>`).join("")}</table>`,
    });
  } catch (err) {
    const e = err as { code?: string; message?: string };
    console.error("[demo-request] e-mail failed:", e.code, e.message);
    return NextResponse.json({ error: "We couldn't send your request right now. Please email us instead." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
