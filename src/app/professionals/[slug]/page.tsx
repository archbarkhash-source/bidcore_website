import type { Metadata } from "next";
import ListingProfile from "@/components/ListingProfile";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const row = await db.memberListing.findUnique({ where: { slug }, select: { name: true, role: true, city: true, state: true, listed: true } }).catch(() => null);
  if (!row || !row.listed) return { title: "Profile not found", robots: { index: false, follow: false } };
  return { title: `${row.name}, ${row.role} | Bidcore`, description: `${row.role}${row.city ? ` in ${row.city}` : ""}${row.state ? `, ${row.state}` : ""} on Bidcore.`, alternates: { canonical: `/professionals/${slug}` } };
}

export default async function ProfessionalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ListingProfile kind="professional" slug={slug} />;
}
