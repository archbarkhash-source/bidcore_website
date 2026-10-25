import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { DEFAULT_CATEGORIES, SHOP_GROUPS, type AttributeDef, type ListingKind } from "./constants";

// Public read side of the marketplace. Every query here is restricted to rows that are publicly visible:
//   company  -> active && marketplaceStatus = "published"
//   listing  -> status = "published" && its company is visible && not past expiresAt
// Pages never invent data: when the database has nothing (or cannot be reached) they get empty results.

export const COMPANY_PAGE_SIZE = 18;
export const LISTING_PAGE_SIZE = 12;

export async function safe<T>(work: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await work();
  } catch (err) {
    console.warn("[marketplace] query failed:", (err as Error).message.trim().split(/\r?\n/).pop());
    return fallback;
  }
}

// ── categories ──────────────────────────────────────────────────────────────────────────────────────────────────────

export interface CategoryNode {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  kind: string;
  parentId: string | null;
  sortOrder: number;
  attributes: AttributeDef[];
  children: CategoryNode[];
  /** true when the row is the built-in default and has not been copied to the database yet */
  builtin: boolean;
}

const parseAttrs = (v: unknown): AttributeDef[] => (Array.isArray(v) ? (v as AttributeDef[]).filter((a) => a && typeof a.key === "string" && typeof a.label === "string") : []);

function defaultTree(): CategoryNode[] {
  return DEFAULT_CATEGORIES.map((c, i) => {
    const node: CategoryNode = {
      id: c.slug, slug: c.slug, name: c.name, description: c.description, kind: c.kind, parentId: null, sortOrder: i, attributes: c.attributes ?? [], children: [], builtin: true,
    };
    node.children = (c.children ?? []).map((ch, j) => ({
      id: ch.slug, slug: ch.slug, name: ch.name, description: null, kind: c.kind, parentId: c.slug, sortOrder: j, attributes: ch.attributes ?? c.attributes ?? [], children: [], builtin: true,
    }));
    return node;
  });
}

/** The active category tree (top level with `children`). Falls back to the built-in defaults until an admin has seeded the database. */
export async function getCategoryTree(): Promise<CategoryNode[]> {
  const rows = await safe(() => db.marketplaceCategory.findMany({ where: { active: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }), []);
  if (rows.length === 0) return defaultTree();
  const nodes = new Map<string, CategoryNode>(
    rows.map((r) => [r.id, { id: r.id, slug: r.slug, name: r.name, description: r.description, kind: r.kind, parentId: r.parentId, sortOrder: r.sortOrder, attributes: parseAttrs(r.attributes), children: [], builtin: false }]),
  );
  const roots: CategoryNode[] = [];
  for (const n of nodes.values()) {
    const parent = n.parentId ? nodes.get(n.parentId) : undefined;
    if (parent) {
      parent.children.push(n);
      if (n.attributes.length === 0) n.attributes = parent.attributes; // a subcategory inherits its parent's specification fields
    } else roots.push(n);
  }
  return roots;
}

export function flattenCategories(tree: CategoryNode[]): CategoryNode[] {
  return tree.flatMap((n) => [n, ...n.children]);
}

export async function getCategoryBySlug(slug: string) {
  const tree = await getCategoryTree();
  const flat = flattenCategories(tree);
  const node = flat.find((n) => n.slug === slug);
  if (!node) return null;
  const parent = node.parentId ? flat.find((n) => n.id === node.parentId) ?? null : null;
  return { node, parent };
}

/** Database ids of a category and its subcategories (empty for a built-in category that has not been seeded - nothing can be listed in it yet). */
export function categoryIds(node: CategoryNode): string[] {
  if (node.builtin) return [];
  return [node.id, ...node.children.map((c) => c.id)];
}

// ── public visibility ────────────────────────────────────────────────────────────────────────────────────────────────

export const visibleCompany: Prisma.CompanyWhereInput = { active: true, marketplaceStatus: "published" };

const visibleListing = (): Prisma.MarketplaceListingWhereInput => ({
  status: "published",
  company: visibleCompany,
  OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
});

// ── companies ───────────────────────────────────────────────────────────────────────────────────────────────────────

export interface CompanyFilters {
  q?: string;
  type?: string;
  category?: string; // category slug: companies with a published listing in it
  state?: string; // state slug
  city?: string;
  served?: string; // area served
  industry?: string;
  capability?: string;
  status?: "" | "claimed" | "verified";
  sort?: "relevance" | "name" | "recent";
  page?: number;
}

const companyCard = {
  id: true, name: true, displayName: true, marketplaceSlug: true, logoUrl: true, type: true, cityName: true, specializations: true, capabilities: true,
  claimed: true, verificationStatus: true, featured: true, sourceType: true, updatedAt: true, publishedAt: true, createdAt: true,
  state: { select: { slug: true, name: true } },
} satisfies Prisma.CompanySelect;
export type CompanyCardData = Prisma.CompanyGetPayload<{ select: typeof companyCard }>;

export async function searchCompanies(f: CompanyFilters) {
  const and: Prisma.CompanyWhereInput[] = [visibleCompany];
  if (f.q) {
    const contains = { contains: f.q, mode: "insensitive" as const };
    and.push({ OR: [{ name: contains }, { displayName: contains }, { cityName: contains }, { type: contains }, { specializations: { has: f.q } }, { capabilities: { has: f.q } }] });
  }
  if (f.type) and.push({ type: f.type });
  if (f.state) and.push({ state: { slug: f.state } });
  if (f.city) and.push({ cityName: { contains: f.city, mode: "insensitive" } });
  if (f.served) and.push({ OR: [{ operatingLocations: { has: f.served } }, { state: { name: f.served } }] });
  if (f.industry) and.push({ industries: { has: f.industry } });
  if (f.capability) and.push({ capabilities: { has: f.capability } });
  if (f.status === "claimed") and.push({ claimed: true });
  if (f.status === "verified") and.push({ verificationStatus: "verified" });
  if (f.category) {
    const cat = await getCategoryBySlug(f.category);
    const ids = cat ? categoryIds(cat.node) : [];
    and.push({ listings: { some: { ...visibleListing(), categoryId: { in: ids } } } });
  }
  const orderBy: Prisma.CompanyOrderByWithRelationInput[] =
    f.sort === "name" ? [{ name: "asc" }] : f.sort === "recent" ? [{ updatedAt: "desc" }] : [{ featured: "desc" }, { claimed: "desc" }, { updatedAt: "desc" }];
  const page = Math.max(1, f.page ?? 1);
  const where: Prisma.CompanyWhereInput = { AND: and };
  return safe(
    async () => {
      const [rows, total] = await Promise.all([
        db.company.findMany({ where, orderBy, select: companyCard, skip: (page - 1) * COMPANY_PAGE_SIZE, take: COMPANY_PAGE_SIZE }),
        db.company.count({ where }),
      ]);
      return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / COMPANY_PAGE_SIZE)) };
    },
    { rows: [] as CompanyCardData[], total: 0, page, pageCount: 1 },
  );
}

/** Option lists for the directory filters - only values that occur on visible companies. */
export async function companyFilterOptions() {
  return safe(
    async () => {
      const rows = await db.company.findMany({ where: visibleCompany, select: { type: true, industries: true, capabilities: true, operatingLocations: true, state: { select: { slug: true, name: true } } } });
      const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b));
      const states = new Map(rows.map((r) => [r.state.slug, r.state.name]));
      return {
        types: uniq(rows.map((r) => r.type)),
        industries: uniq(rows.flatMap((r) => r.industries)),
        capabilities: uniq(rows.flatMap((r) => r.capabilities)),
        served: uniq(rows.flatMap((r) => r.operatingLocations)),
        states: [...states.entries()].map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name)),
      };
    },
    { types: [] as string[], industries: [] as string[], capabilities: [] as string[], served: [] as string[], states: [] as { slug: string; name: string }[] },
  );
}

export function getPublicCompany(slug: string) {
  return safe(
    () => db.company.findFirst({ where: { marketplaceSlug: slug, ...visibleCompany }, include: { state: { select: { slug: true, name: true } } } }),
    null,
  );
}

// ── listings ────────────────────────────────────────────────────────────────────────────────────────────────────────

export interface ListingFilters {
  kind: ListingKind;
  q?: string;
  category?: string;
  state?: string; // state name (supply location / coverage)
  location?: string; // free text location
  companyType?: string;
  price?: "" | "on_request" | "indicative";
  availability?: string;
  projectType?: string; // services
  industry?: string; // services
  capability?: string; // services
  company?: string; // company id
  sort?: "relevance" | "recent" | "name";
  page?: number;
}

const listingCard = {
  id: true, slug: true, kind: true, title: true, brand: true, shortDescription: true, images: true, priceMode: true, priceText: true, availability: true, supplyLocations: true,
  projectTypes: true, industries: true, capabilities: true, updatedAt: true, publishedAt: true,
  category: { select: { slug: true, name: true } },
  company: { select: { id: true, name: true, displayName: true, marketplaceSlug: true, cityName: true, claimed: true, verificationStatus: true, sourceType: true, state: { select: { name: true } } } },
} satisfies Prisma.MarketplaceListingSelect;
export type ListingCardData = Prisma.MarketplaceListingGetPayload<{ select: typeof listingCard }>;

export async function searchListings(f: ListingFilters) {
  const and: Prisma.MarketplaceListingWhereInput[] = [visibleListing(), { kind: f.kind }];
  if (f.q) {
    const contains = { contains: f.q, mode: "insensitive" as const };
    and.push({ OR: [{ title: contains }, { brand: contains }, { shortDescription: contains }, { description: contains }, { company: { name: contains } }, { category: { name: contains } }] });
  }
  if (f.category) {
    const cat = await getCategoryBySlug(f.category);
    and.push({ categoryId: { in: cat ? categoryIds(cat.node) : [] } });
  }
  const place = f.state || f.location;
  if (place) {
    const contains = { contains: place, mode: "insensitive" as const };
    and.push({ OR: [{ supplyLocations: { has: place } }, { company: { cityName: contains } }, { company: { state: { name: contains } } }, { company: { operatingLocations: { has: place } } }] });
  }
  if (f.companyType) and.push({ company: { type: f.companyType } });
  if (f.price) and.push({ priceMode: f.price });
  if (f.availability) and.push({ availability: f.availability });
  if (f.projectType) and.push({ projectTypes: { has: f.projectType } });
  if (f.industry) and.push({ industries: { has: f.industry } });
  if (f.capability) and.push({ capabilities: { has: f.capability } });
  if (f.company) and.push({ companyId: f.company });
  const orderBy: Prisma.MarketplaceListingOrderByWithRelationInput[] =
    f.sort === "name" ? [{ title: "asc" }] : f.sort === "recent" ? [{ publishedAt: "desc" }] : [{ company: { featured: "desc" } }, { updatedAt: "desc" }];
  const page = Math.max(1, f.page ?? 1);
  const where: Prisma.MarketplaceListingWhereInput = { AND: and };
  return safe(
    async () => {
      const [rows, total] = await Promise.all([
        db.marketplaceListing.findMany({ where, orderBy, select: listingCard, skip: (page - 1) * LISTING_PAGE_SIZE, take: LISTING_PAGE_SIZE }),
        db.marketplaceListing.count({ where }),
      ]);
      return { rows, total, page, pageCount: Math.max(1, Math.ceil(total / LISTING_PAGE_SIZE)) };
    },
    { rows: [] as ListingCardData[], total: 0, page, pageCount: 1 },
  );
}

/** Facet values used by the service filters, taken from visible service listings. */
export async function serviceFilterOptions() {
  return safe(
    async () => {
      const rows = await db.marketplaceListing.findMany({ where: { ...visibleListing(), kind: "service" }, select: { projectTypes: true, industries: true, capabilities: true } });
      const uniq = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b));
      return { projectTypes: uniq(rows.flatMap((r) => r.projectTypes)), industries: uniq(rows.flatMap((r) => r.industries)), capabilities: uniq(rows.flatMap((r) => r.capabilities)) };
    },
    { projectTypes: [] as string[], industries: [] as string[], capabilities: [] as string[] },
  );
}

export function getPublicListing(kind: ListingKind, slug: string) {
  return safe(
    () =>
      db.marketplaceListing.findFirst({
        where: { slug, ...visibleListing(), kind },
        include: { category: { select: { slug: true, name: true, parentId: true } }, company: { include: { state: { select: { slug: true, name: true } } } } },
      }),
    null,
  );
}

export function companyListings(companyId: string, kind?: ListingKind) {
  return safe(
    () => db.marketplaceListing.findMany({ where: { ...visibleListing(), companyId, ...(kind ? { kind } : {}) }, orderBy: { updatedAt: "desc" }, select: listingCard, take: 30 }),
    [] as ListingCardData[],
  );
}

// ── home page sections (real rows only) ──────────────────────────────────────────────────────────────────────────────

export async function marketplaceHome() {
  const [featured, recent, newMembers, products, services, byState, catCounts] = await Promise.all([
    safe(() => db.company.findMany({ where: { ...visibleCompany, featured: true }, orderBy: { updatedAt: "desc" }, take: 6, select: companyCard }), []),
    safe(() => db.company.findMany({ where: visibleCompany, orderBy: { publishedAt: "desc" }, take: 6, select: companyCard }), []),
    safe(() => db.company.findMany({ where: { ...visibleCompany, sourceType: "member", claimed: true }, orderBy: { createdAt: "desc" }, take: 6, select: companyCard }), []),
    safe(() => db.marketplaceListing.findMany({ where: { ...visibleListing(), kind: "product" }, orderBy: { publishedAt: "desc" }, take: 8, select: listingCard }), []),
    safe(() => db.marketplaceListing.findMany({ where: { ...visibleListing(), kind: "service" }, orderBy: { publishedAt: "desc" }, take: 6, select: listingCard }), []),
    safe(async () => {
      const g = await db.company.groupBy({ by: ["stateId"], where: visibleCompany, _count: { _all: true }, orderBy: { _count: { stateId: "desc" } }, take: 8 });
      const states = await db.state.findMany({ where: { id: { in: g.map((x) => x.stateId) } }, select: { id: true, slug: true, name: true } });
      return g.flatMap((x) => {
        const s = states.find((st) => st.id === x.stateId);
        return s ? [{ slug: s.slug, name: s.name, count: x._count._all }] : [];
      });
    }, [] as { slug: string; name: string; count: number }[]),
    safe(async () => {
      const g = await db.marketplaceListing.groupBy({ by: ["categoryId"], where: { ...visibleListing(), categoryId: { not: null } }, _count: { _all: true } });
      return new Map(g.map((x) => [x.categoryId as string, x._count._all]));
    }, new Map<string, number>()),
  ]);
  return { featured, recent, newMembers, products, services, byState, catCounts };
}

/** Number of published listings per category slug (a parent includes its subcategories). */
export async function categoryListingCounts(tree: CategoryNode[]): Promise<Map<string, number>> {
  const { catCounts } = await marketplaceHome();
  const out = new Map<string, number>();
  for (const root of tree) {
    let n = catCounts.get(root.id) ?? 0;
    for (const c of root.children) {
      const cn = catCounts.get(c.id) ?? 0;
      out.set(c.slug, cn);
      n += cn;
    }
    out.set(root.slug, n);
  }
  return out;
}

// ── sitemap ───────────────────────────────────────────────────────────────────────────────────────────────────────────

export async function sitemapEntries() {
  return safe(
    async () => {
      const [companies, listings, catIds] = await Promise.all([
        db.company.findMany({ where: { ...visibleCompany, marketplaceSlug: { not: null } }, select: { marketplaceSlug: true, updatedAt: true } }),
        db.marketplaceListing.findMany({ where: visibleListing(), select: { slug: true, kind: true, updatedAt: true } }),
        db.marketplaceListing.groupBy({ by: ["categoryId"], where: { ...visibleListing(), categoryId: { not: null } } }),
      ]);
      const cats = await db.marketplaceCategory.findMany({ where: { active: true } });
      // A category page is only indexed when it has listings (itself or through a subcategory).
      const withListings = new Set(catIds.map((c) => c.categoryId as string));
      const indexable = cats.filter((c) => withListings.has(c.id) || cats.some((s) => s.parentId === c.id && withListings.has(s.id)));
      return { companies, listings, categories: indexable.map((c) => c.slug) };
    },
    { companies: [] as { marketplaceSlug: string | null; updatedAt: Date }[], listings: [] as { slug: string; kind: string; updatedAt: Date }[], categories: [] as string[] },
  );
}

// ── shop layout (marketplace home) ─────────────────────────────────────────────────────────────────────────────────────

export interface ShopGroup {
  key: string;
  title: string;
  blurb: string;
  href: string;
  categories: (CategoryNode & { cover: string | null; count: number })[];
  listings: ListingCardData[];
}

/** Each shop group with its categories (cover image = a real image from one of that category's published listings, never a stock photo) and its latest published listings. */
export async function shopGroups(tree: CategoryNode[]): Promise<ShopGroup[]> {
  const covers = await safe(
    async () => {
      const rows = await db.marketplaceListing.findMany({ where: { ...visibleListing(), categoryId: { not: null }, images: { isEmpty: false } }, orderBy: { publishedAt: "desc" }, take: 300, select: { categoryId: true, images: true } });
      const m = new Map<string, string>();
      for (const r of rows) if (r.categoryId && !m.has(r.categoryId)) m.set(r.categoryId, r.images[0]);
      return m;
    },
    new Map<string, string>(),
  );
  const counts = await categoryListingCounts(tree);
  const out: ShopGroup[] = [];
  for (const g of SHOP_GROUPS) {
    const nodes = g.slugs.map((s) => tree.find((n) => n.slug === s)).filter((n): n is CategoryNode => !!n);
    const ids = nodes.flatMap(categoryIds);
    const listings = ids.length
      ? await safe(() => db.marketplaceListing.findMany({ where: { ...visibleListing(), categoryId: { in: ids } }, orderBy: [{ company: { featured: "desc" } }, { publishedAt: "desc" }], take: 8, select: listingCard }), [] as ListingCardData[])
      : [];
    out.push({
      key: g.key, title: g.title, blurb: g.blurb, href: g.href, listings,
      categories: nodes.map((n) => ({ ...n, count: counts.get(n.slug) ?? 0, cover: covers.get(n.id) ?? n.children.map((c) => covers.get(c.id)).find(Boolean) ?? null })),
    });
  }
  return out;
}
