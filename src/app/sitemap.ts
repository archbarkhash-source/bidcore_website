import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/bidcore-api";
import { getTenderSitemap } from "@/lib/site-tenders";
import { CONTRACTOR_CATEGORIES } from "@/lib/contractor-categories";
import { PRODUCT_PAGES } from "@/lib/product-pages";
import { SOLUTIONS } from "@/lib/solutions";
import { sitemapEntries } from "@/lib/marketplace/queries";
import { directorySitemap } from "@/lib/directory";
import { db } from "@/lib/db";

export const revalidate = 3600;

// Only approved public content that answers 200 itself: the landing page, products and solutions, every PUBLISHED public tender, the contractor directory (each LISTED
// company's page), listed professionals and equipment, and the published marketplace. Drafts, withdrawn / private tenders, unlisted profiles, forms, sign-in, the
// invitation portal, dashboards, the not-yet-public /software page and pages that only redirect elsewhere (/states, /cities ...) are never listed.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/tenders`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/products`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE_URL}/solutions`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    ...SOLUTIONS.map((x) => ({ url: `${SITE_URL}/solutions/${x.slug}`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/request-demo`, lastModified: now, changeFrequency: "yearly", priority: 0.5 },
    { url: `${SITE_URL}/live-demo`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/help`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/explore`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/professionals`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    { url: `${SITE_URL}/equipment`, lastModified: now, changeFrequency: "weekly", priority: 0.5 },
    ...PRODUCT_PAGES.map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: p.availability === "available" ? 0.8 : 0.5,
    })),
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/contractors`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    ...CONTRACTOR_CATEGORIES.map((c) => ({ url: `${SITE_URL}/contractors/${c.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.5 })),
    { url: `${SITE_URL}/supply`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/supply/companies`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/supply/products`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/supply/services`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
  ];
  // Contractor directory: one page per LISTED company (directory companies and members who chose to be listed).
  for (const c of await directorySitemap()) pages.push({ url: `${SITE_URL}/contractor/${c.slug}`, lastModified: c.updatedAt, changeFrequency: "weekly", priority: 0.6 });
  // Professionals and equipment owners who listed themselves (unlisted ones are left out).
  const listings = await db.memberListing.findMany({ where: { listed: true }, select: { slug: true, kind: true, updatedAt: true }, take: 45000 }).catch(() => []);
  for (const l of listings)
    if (l.kind === "professional" || l.kind === "equipment")
      pages.push({ url: `${SITE_URL}/${l.kind === "professional" ? "professionals" : "equipment"}/${l.slug}`, lastModified: l.updatedAt, changeFrequency: "weekly", priority: 0.4 });
  // Marketplace: only published companies / listings, and only categories that actually contain listings (no empty or duplicate pages).
  const mp = await sitemapEntries();
  for (const slug of mp.categories) pages.push({ url: `${SITE_URL}/supply/categories/${slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.6 });
  for (const c of mp.companies) if (c.marketplaceSlug) pages.push({ url: `${SITE_URL}/supply/companies/${c.marketplaceSlug}`, lastModified: c.updatedAt, changeFrequency: "weekly", priority: 0.6 });
  for (const l of mp.listings) pages.push({ url: `${SITE_URL}/supply/${l.kind === "product" ? "products" : "services"}/${l.slug}`, lastModified: l.updatedAt, changeFrequency: "weekly", priority: 0.5 });
  const res = await getTenderSitemap();
  if (res.ok) {
    for (const t of res.data.items) {
      pages.push({
        url: `${SITE_URL}/tenders/${t.slug}`,
        lastModified: t.lastmod ? new Date(t.lastmod) : now,
        changeFrequency: t.status === "open" ? "daily" : "monthly",
        priority: t.status === "open" ? 0.8 : 0.3,
      });
    }
  }
  return pages;
}
