import type { Metadata } from "next";
import ListingBrowse from "@/components/ListingBrowse";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Construction Equipment on Bidcore — Owners and Rental Companies",
  description: "Find excavators, cranes, mixers, survey instruments and other construction equipment from owners and rental companies across India.",
  alternates: { canonical: "/equipment" },
};

export default async function EquipmentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ListingBrowse kind="equipment" searchParams={await searchParams} />;
}
