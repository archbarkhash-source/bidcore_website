import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getTenders, formatDate, formatValue, type Tender } from "@/lib/bidcore-api";
import { sendMail } from "@/lib/mail";
import { SITE_URL } from "@/lib/bidcore-api";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Sends each saved alert a digest of public tenders published since it was
// last checked. Not reachable without the shared secret — point an external
// scheduler (e.g. a Vercel Cron entry, or any cron-as-a-service hitting this
// URL) at it with that header; nothing inside this app calls it on a timer.
export async function POST(req: NextRequest) {
  const secret = process.env.TENDER_ALERT_SECRET;
  if (!secret || req.headers.get("x-alert-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const alerts = await db.tenderAlert.findMany({ where: { active: true } });
  let emailsSent = 0;
  let errors = 0;

  for (const alert of alerts) {
    const since = alert.lastNotifiedAt ?? alert.createdAt;
    const res = await getTenders({
      keywords: alert.keywords ?? undefined,
      state: alert.state ?? undefined,
      city: alert.city ?? undefined,
      category: alert.category ?? undefined,
      status: "open",
      sort: "newest",
      page_size: "20",
    });
    if (!res.ok) continue;

    const matches = res.data.items.filter((t) => t.published_at && new Date(t.published_at) > since);
    if (matches.length > 0) {
      try {
        await sendMail(buildDigestEmail(alert.email, alert.token, matches));
        emailsSent++;
      } catch (err) {
        errors++;
        console.error("[tender-alerts] send failed:", (err as Error).message);
      }
    }
    await db.tenderAlert.update({ where: { id: alert.id }, data: { lastNotifiedAt: new Date() } });
  }

  return NextResponse.json({ ok: true, alertsChecked: alerts.length, emailsSent, errors });
}

function buildDigestEmail(to: string, token: string, tenders: Tender[]) {
  const unsubscribe = `${SITE_URL}/api/tender-alerts?token=${token}`;
  const rows = tenders
    .map((t) => {
      const href = `${SITE_URL}/tenders/${t.slug}`;
      const where = t.location ? `${t.organization ? ", " : ""}${t.location}` : "";
      const value = formatValue(t.value_inr);
      return `<li style="margin-bottom:12px"><a href="${href}" style="color:#171a20;font-weight:600;text-decoration:none">${t.title}</a><br><span style="color:#64748b;font-size:13px">${t.organization ?? ""}${where}${value ? ` · ${value}` : ""} · Closes ${formatDate(t.closing_date)}</span></li>`;
    })
    .join("");
  const textRows = tenders
    .map((t) => `- ${t.title} (${t.organization ?? "organisation not stated"}${t.location ? `, ${t.location}` : ""}): ${SITE_URL}/tenders/${t.slug}`)
    .join("\n");

  return {
    to,
    subject: `${tenders.length} new tender${tenders.length === 1 ? "" : "s"} match your Bidcore alert`,
    text: `New public tenders matching your saved search:\n\n${textRows}\n\nManage this alert: ${unsubscribe}`,
    html: `<p>New public tenders matching your saved search on Bidcore:</p><ul style="padding-left:18px">${rows}</ul><p style="color:#94a3b8;font-size:12px">You're receiving this because you set up a Bidcore tender alert. <a href="${unsubscribe}">Unsubscribe</a></p>`,
  };
}
