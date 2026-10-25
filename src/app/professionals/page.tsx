import type { Metadata } from "next";
import ListingBrowse from "@/components/ListingBrowse";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Professionals on Bidcore — Site Engineers, QA Engineers, Surveyors",
  description: "Find site engineers, QA / QC engineers, surveyors and other construction professionals open to work across India.",
  alternates: { canonical: "/professionals" },
};

export default async function ProfessionalsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <ListingBrowse kind="professional" searchParams={await searchParams} />;
}
