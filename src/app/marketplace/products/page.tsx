import ListingResults, { listingsMetadata } from "@/components/marketplace/ListingResults";

type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }) {
  return listingsMetadata("product", await searchParams);
}

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SP> }) {
  return <ListingResults kind="product" sp={await searchParams} />;
}
