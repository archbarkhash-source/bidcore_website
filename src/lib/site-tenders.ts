import "server-only";
import { db } from "@/lib/db";
import type { ApiResult, Page, Tender } from "@/lib/bidcore-api";

// Public tenders shown on bidcore.in. They are published from the BidcoreAI software running on a local machine, which writes each one straight into this site's
// own Postgres (Neon) table `site_tenders` (backend/website_publish.py) - there is no backend server for the website to call. Same function names and result shapes
// as the old public API client, so the pages did not have to change how they use them.

interface Row {
  id: number;
  slug: string;
  title: string;
  reference_no: string | null;
  organization: string | null;
  category: string | null;
  state: string | null;
  city: string | null;
  value_inr: number | null;
  summary: string | null;
  closing_date: Date | null;
  published_at: Date | null;
  amended_at: Date | null;
  amendment_count: number;
  submission_mode: string | null;
  is_open: boolean;
  detail: Record<string, unknown> | null;
}

const day = (d: Date | null): string | null => (d ? d.toISOString().slice(0, 10) : null);
const iso = (d: Date | null): string | null => (d ? d.toISOString() : null);

function toTender(r: Row, detail: boolean): Tender {
  const base: Tender = {
    id: r.id,
    slug: r.slug,
    title: r.title,
    reference_no: r.reference_no,
    organization: r.organization,
    category: r.category,
    state: r.state,
    city: r.city,
    location: [r.city, r.state].filter(Boolean).join(", ") || null,
    value_inr: r.value_inr,
    summary: detail ? r.summary : (r.summary ?? "").slice(0, 400) || null,
    published_at: iso(r.published_at),
    closing_date: day(r.closing_date),
    status: r.is_open ? "open" : "closed",
    submission_mode: r.submission_mode === "external" ? "external" : "bidcore",
    amended_at: iso(r.amended_at),
    amendment_count: r.amendment_count,
  };
  if (!detail) return base;
  const d = (r.detail ?? {}) as Record<string, unknown>;
  return {
    ...base,
    eligibility: (d.eligibility as string) ?? null,
    clarification_deadline: (d.clarification_deadline as string) ?? null,
    site_visit_date: (d.site_visit_date as string) ?? null,
    official_url: (d.official_url as string) ?? null,
    required_documents: Array.isArray(d.required_documents) ? (d.required_documents as string[]) : [],
    documents: [], // files are not hosted by the website; see backend/website_publish.py
    bid_form: (d.bid_form as Tender["bid_form"]) ?? null,
  };
}

const COLUMNS = `id, slug, title, reference_no, organization, category, state, city, value_inr, summary, closing_date, published_at, amended_at, amendment_count, submission_mode,
  (NOT closed AND (closing_date IS NULL OR closing_date >= CURRENT_DATE)) AS is_open, detail`;

const keywordList = (raw?: string): string[] => {
  const out: string[] = [];
  for (const part of (raw ?? "").split(/[,;\n]+/)) {
    const k = part.trim().slice(0, 40);
    if (k && !out.some((x) => x.toLowerCase() === k.toLowerCase())) out.push(k);
  }
  return out.slice(0, 10);
};

export async function getTenders(params?: Record<string, string | undefined>): Promise<ApiResult<Page<Tender>>> {
  const p = params ?? {};
  const page = Math.max(1, Number(p.page) || 1);
  const size = Math.min(50, Math.max(1, Number(p.page_size) || 20));
  const where: string[] = ["status = 'published'"];
  const args: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    args.push(value);
    where.push(sql.replaceAll("?", `$${args.length}`));
  };
  const open = "(NOT closed AND (closing_date IS NULL OR closing_date >= CURRENT_DATE))";
  const status = p.status ?? "open";
  if (status === "open") where.push(open);
  else if (status === "closed") where.push(`NOT ${open}`);
  if (p.state) add("LOWER(state) = LOWER(?)", p.state);
  if (p.city) add("LOWER(city) = LOWER(?)", p.city);
  if (p.organization) add("organization ILIKE ?", `%${p.organization.slice(0, 100)}%`);
  if (p.category) add("LOWER(category) = LOWER(?)", p.category);
  if (p.value_min && !Number.isNaN(Number(p.value_min))) add("value_inr >= ?", Number(p.value_min));
  if (p.value_max && !Number.isNaN(Number(p.value_max))) add("value_inr <= ?", Number(p.value_max));
  if (p.closing_within_days && !Number.isNaN(Number(p.closing_within_days))) {
    where.push(`closing_date >= CURRENT_DATE AND closing_date <= CURRENT_DATE + ${Math.min(365, Math.max(0, Math.floor(Number(p.closing_within_days))))}::int`);
  }
  for (const term of (p.q ?? "").trim().slice(0, 100).split(/\s+/).filter(Boolean)) {
    args.push(`%${term}%`);
    const n = `$${args.length}`;
    where.push(`(title ILIKE ${n} OR reference_no ILIKE ${n} OR organization ILIKE ${n} OR category ILIKE ${n} OR summary ILIKE ${n} OR city ILIKE ${n} OR state ILIKE ${n})`);
  }
  const kws = keywordList(p.keywords);
  if (kws.length) {
    const ors = kws.map((k) => {
      args.push(`%${k}%`);
      const n = `$${args.length}`;
      return `(title ILIKE ${n} OR summary ILIKE ${n} OR category ILIKE ${n} OR organization ILIKE ${n} OR detail->>'eligibility' ILIKE ${n})`;
    });
    where.push(`(${ors.join(" OR ")})`);
  }
  const order = p.sort === "closing_soon" ? "closing_date IS NULL, closing_date ASC, id DESC" : "published_at DESC NULLS LAST, id DESC";
  const clause = where.join(" AND ");
  try {
    const total = Number((await db.$queryRawUnsafe<{ n: bigint }[]>(`SELECT COUNT(*) AS n FROM site_tenders WHERE ${clause}`, ...args))[0]?.n ?? 0);
    const rows = await db.$queryRawUnsafe<Row[]>(`SELECT ${COLUMNS} FROM site_tenders WHERE ${clause} ORDER BY ${order} LIMIT ${size} OFFSET ${(page - 1) * size}`, ...args);
    return { ok: true, data: { items: rows.map((r) => toTender(r, false)), total, page, page_size: size, pages: Math.max(1, Math.ceil(total / size)) } };
  } catch {
    return { ok: false, status: 0 }; // nothing has been published yet (no table), or the database is unreachable
  }
}

export async function getTender(slug: string): Promise<ApiResult<Tender & { canonical_slug: string }>> {
  try {
    const rows = await db.$queryRawUnsafe<Row[]>(`SELECT ${COLUMNS} FROM site_tenders WHERE slug = $1 AND status = 'published' LIMIT 1`, slug);
    return rows[0] ? { ok: true, data: { ...toTender(rows[0], true), canonical_slug: rows[0].slug } } : { ok: false, status: 404 };
  } catch {
    return { ok: false, status: 0 };
  }
}

export async function getTenderSitemap(): Promise<ApiResult<{ items: { slug: string; lastmod: string | null; status: string }[] }>> {
  try {
    const rows = await db.$queryRawUnsafe<Row[]>(`SELECT ${COLUMNS} FROM site_tenders WHERE status = 'published' ORDER BY id DESC LIMIT 5000`);
    return { ok: true, data: { items: rows.map((r) => ({ slug: r.slug, lastmod: iso(r.amended_at ?? r.published_at), status: r.is_open ? "open" : "closed" })) } };
  } catch {
    return { ok: false, status: 0 };
  }
}
