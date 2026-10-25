import ListingDetail, { listingMetadata } from "@/components/marketplace/ListingDetail";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return listingMetadata("service", (await params).slug);
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  return <ListingDetail kind="service" slug={(await params).slug} />;
}
