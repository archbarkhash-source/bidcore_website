import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductLanding from "@/components/product/ProductLanding";
import { SITE_URL } from "@/lib/bidcore-api";
import { PRODUCT_PAGES, getProductPage } from "@/lib/product-pages";

// One statically generated landing page per BidcoreAI product (/products/tender-connect, /products/tender-management, ...). Content: lib/product-pages.ts.
export const dynamicParams = false;

export function generateStaticParams() {
  return PRODUCT_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = getProductPage(slug);
  if (!page) return {};
  const path = `/products/${page.slug}`;
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: path },
    openGraph: { title: page.metaTitle, description: page.metaDescription, url: `${SITE_URL}${path}`, type: "website", siteName: "Bidcore", locale: "en_IN" },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = getProductPage(slug);
  if (!page) notFound();
  return <ProductLanding page={page} />;
}
