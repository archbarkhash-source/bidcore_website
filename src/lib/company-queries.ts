import "server-only";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { Company, CompanyType } from "@/lib/types";

export const PAGE_SIZE = 20;

// Counts are decoration on browse pages; if the database is unreachable the
// page should still render, just without numbers.
async function orFallback<T>(work: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await work();
  } catch (err) {
    console.warn("[company-queries] counts unavailable:", (err as Error).message.trim().split(/\r?\n/).pop());
    return fallback;
  }
}

const include = { state: { select: { slug: true } }, city: { select: { slug: true, name: true } } };
type Row = Prisma.CompanyGetPayload<{ include: typeof include }>;

function toCompany(r: Row): Company {
  return {
    slug: r.slug,
    name: r.name,
    stateSlug: r.state.slug,
    citySlug: r.city?.slug ?? "",
    cityName: r.cityName ?? r.city?.name ?? undefined,
    type: r.type as CompanyType,
    specializations: r.specializations,
    sizeRange: r.sizeRange ?? undefined,
    operatingLocations: r.operatingLocations,
    about: r.about ?? undefined,
    founded: r.founded ?? undefined,
    projectCount: r.projectCount ?? undefined,
    verified: r.verified,
    claimed: r.claimed,
    registry: r.cin
      ? {
          cin: r.cin,
          status: r.companyStatus,
          listedStatus: r.listedStatus,
          roc: r.roc,
          registrationNumber: r.registrationNumber,
          category: r.companyCategory,
          subCategory: r.companySubCategory,
          companyClass: r.companyClass,
          incorporationDate: r.incorporationDate?.toISOString() ?? null,
        }
      : undefined,
  };
}

export interface DirectoryFilters {
  q?: string;
  type?: string;
  types?: string[];
  state?: string;
  city?: string;
  verifiedOnly?: boolean;
  activeOnly?: boolean;
  sort?: string;
  page?: number;
}

type Params = Record<string, string | string[] | undefined>;

export function parseFilters(sp: Params, lock: Partial<DirectoryFilters> = {}): DirectoryFilters {
  const one = (k: string) => {
    const v = sp[k];
    return (Array.isArray(v) ? v[0] : v) ?? "";
  };
  const page = Math.max(1, parseInt(one("page"), 10) || 1);
  return {
    q: one("q").trim(),
    type: one("type"),
    state: one("state"),
    city: one("city"),
    verifiedOnly: one("verified") === "1",
    activeOnly: one("active") === "1",
    sort: one("sort") || "name",
    page,
    ...lock,
  };
}

function buildWhere(f: DirectoryFilters): Prisma.CompanyWhereInput {
  const and: Prisma.CompanyWhereInput[] = [{ active: true }];
  if (f.types?.length) {
    and.push(f.type && f.types.includes(f.type) ? { type: f.type } : { type: { in: f.types } });
  } else if (f.type) and.push({ type: f.type });
  if (f.state) and.push({ state: { slug: f.state } });
  if (f.city) and.push({ city: { slug: f.city } });
  if (f.verifiedOnly) and.push({ verified: true });
  if (f.activeOnly) and.push({ companyStatus: "Active" });
  if (f.q) {
    const contains = { contains: f.q, mode: "insensitive" as const };
    and.push({
      OR: [
        { name: contains },
        { cityName: contains },
        { type: contains },
        { cin: contains },
        { specializations: { has: f.q } },
      ],
    });
  }
  return { AND: and };
}

export function countCompanies(f: DirectoryFilters): Promise<number> {
  return db.company.count({ where: buildWhere(f) });
}

export async function listCompanies(f: DirectoryFilters) {
  const where = buildWhere(f);
  const page = f.page ?? 1;
  const orderBy: Prisma.CompanyOrderByWithRelationInput[] =
    f.sort === "verified" ? [{ verified: "desc" }, { name: "asc" }] : [{ name: "asc" }];

  const [rows, total] = await Promise.all([
    db.company.findMany({ where, orderBy, include, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    db.company.count({ where }),
  ]);
  return { companies: rows.map(toCompany), total, page, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getCompanyBySlug(stateSlug: string, slug: string): Promise<Company | null> {
  const row = await db.company.findFirst({ where: { slug, active: true, state: { slug: stateSlug } }, include });
  return row ? toCompany(row) : null;
}

export async function findCompaniesBySlugs(slugs: string[]): Promise<Company[]> {
  if (slugs.length === 0) return [];
  const rows = await db.company.findMany({ where: { slug: { in: slugs.slice(0, 200) }, active: true }, include });
  return rows.map(toCompany);
}

export function countByState(): Promise<Record<string, number>> {
  return orFallback(countByStateRaw, {});
}

async function countByStateRaw(): Promise<Record<string, number>> {
  const groups = await db.company.groupBy({
    by: ["stateId"],
    where: { active: true },
    _count: { _all: true },
  });
  const states = await db.state.findMany({ select: { id: true, slug: true } });
  const slugById = new Map(states.map((s) => [s.id, s.slug]));
  return Object.fromEntries(groups.map((g) => [slugById.get(g.stateId) ?? g.stateId, g._count._all]));
}

export function countByCity(): Promise<Record<string, number>> {
  return orFallback(countByCityRaw, {});
}

async function countByCityRaw(): Promise<Record<string, number>> {
  const groups = await db.company.groupBy({
    by: ["cityId"],
    where: { cityId: { not: null }, active: true },
    _count: { _all: true },
  });
  const cities = await db.city.findMany({ select: { id: true, slug: true } });
  const slugById = new Map(cities.map((c) => [c.id, c.slug]));
  return Object.fromEntries(groups.map((g) => [slugById.get(g.cityId!) ?? g.cityId!, g._count._all]));
}

export function countByType(): Promise<Record<string, number>> {
  return orFallback(countByTypeRaw, {});
}

async function countByTypeRaw(): Promise<Record<string, number>> {
  const groups = await db.company.groupBy({
    by: ["type"],
    where: { active: true },
    _count: { _all: true },
  });
  return Object.fromEntries(groups.map((g) => [g.type, g._count._all]));
}

export function countBySpecialization(): Promise<[string, number][]> {
  return orFallback(countBySpecializationRaw, []);
}

async function countBySpecializationRaw(): Promise<[string, number][]> {
  const rows = await db.company.findMany({
    where: { active: true, NOT: { specializations: { isEmpty: true } } },
    select: { specializations: true },
  });
  const counts = new Map<string, number>();
  for (const r of rows) for (const s of r.specializations) counts.set(s, (counts.get(s) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]));
}

export async function totalCompanies(): Promise<number> {
  return db.company.count({ where: { active: true } });
}
