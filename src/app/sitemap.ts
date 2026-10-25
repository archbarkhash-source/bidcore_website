import type { MetadataRoute } from "next";
import { SITE_URL, getTenderSitemap } from "@/lib/bidcore-api";
import { PRODUCT_PAGES } from "@/lib/product-pages";
import { SOLUTIONS } from "@/lib/solutions";
import { sitemapEntries } from "@/lib/marketplace/queries";

export const revalidate = 3600;

// Only approved public content: the landing page, the product landing pages, the tender directory, and every PUBLISHED public tender. Drafts, withdrawn and private tenders are not
// in the feed the website receives, so they can never be listed here.
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
    ...PRODUCT_PAGES.map((p) => ({
      url: `${SITE_URL}/products/${p.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: p.availability === "available" ? 0.8 : 0.5,
    })),
    { url: `${SITE_URL}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/companies`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },
    { url: `${SITE_URL}/marketplace`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/marketplace/companies`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/marketplace/products`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/marketplace/services`, lastModified: now, changeFrequency: "daily", priority: 0.7 },
  ];
  // Marketplace: only published companies / listings, and only categories that actually contain listings (no empty or duplicate pages).
  const mp = await sitemapEntries();
  for (const slug of mp.categories) pages.push({ url: `${SITE_URL}/marketplace/categories/${slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.6 });
  for (const c of mp.companies) if (c.marketplaceSlug) pages.push({ url: `${SITE_URL}/marketplace/companies/${c.marketplaceSlug}`, lastModified: c.updatedAt, changeFrequency: "weekly", priority: 0.6 });
  for (const l of mp.listings) pages.push({ url: `${SITE_URL}/marketplace/${l.kind === "product" ? "products" : "services"}/${l.slug}`, lastModified: l.updatedAt, changeFrequency: "weekly", priority: 0.5 });
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
