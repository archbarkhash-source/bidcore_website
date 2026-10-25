import ListingResults, { listingsMetadata } from "@/components/marketplace/ListingResults";

type SP = Record<string, string | string[] | undefined>;

export async function generateMetadata({ searchParams }: { searchParams: Promise<SP> }) {
  return listingsMetadata("service", await searchParams);
}

export default async function ServicesPage({ searchParams }: { searchParams: Promise<SP> }) {
  return <ListingResults kind="service" sp={await searchParams} />;
}
