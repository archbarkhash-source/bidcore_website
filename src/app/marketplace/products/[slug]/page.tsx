import ListingDetail, { listingMetadata } from "@/components/marketplace/ListingDetail";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return listingMetadata("product", (await params).slug);
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  return <ListingDetail kind="product" slug={(await params).slug} />;
}
