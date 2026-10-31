import type { Metadata } from "next";
import ContractorsList, { type SP } from "@/components/ContractorsList";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Contractors on Bidcore",
  description: "EPC contractors, subcontractors and design-build contractors listed on Bidcore, starting with Mumbai and Delhi.",
  alternates: { canonical: "/contractors" },
};

export default async function ContractorsPage({ searchParams }: { searchParams: Promise<SP> }) {
  return <ContractorsList sp={await searchParams} />;
}
