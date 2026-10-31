import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ContractorsList, { type SP } from "@/components/ContractorsList";
import { CONTRACTOR_CATEGORIES, categoryOf } from "@/lib/contractor-categories";

export const revalidate = 300;
export const dynamicParams = false; // only the listed categories exist; any other address is a 404

export const generateStaticParams = () => CONTRACTOR_CATEGORIES.map((c) => ({ filter: c.slug }));

export async function generateMetadata({ params }: { params: Promise<{ filter: string }> }): Promise<Metadata> {
  const c = categoryOf((await params).filter);
  if (!c) return { title: "Contractors on Bidcore", robots: { index: false, follow: false } };
  return { title: `${c.title} | Bidcore`, description: c.description, alternates: { canonical: `/contractors/${c.slug}` } };
}

export default async function ContractorCategoryPage({ params, searchParams }: { params: Promise<{ filter: string }>; searchParams: Promise<SP> }) {
  const c = categoryOf((await params).filter);
  if (!c) notFound();
  return <ContractorsList sp={await searchParams} basePath={`/contractors/${c.slug}`} preset={c.filter} heading={c.title} intro={c.description} />;
}
