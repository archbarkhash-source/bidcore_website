import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MP } from "@/lib/marketplace/constants";
import { one } from "@/components/marketplace/ui";

export const metadata: Metadata = { robots: { index: false, follow: true } };

// The universal search bar submits here; the visitor is sent to the results page for the chosen type.
// "All" opens the products results first, with the query kept, because most marketplace searches are for something to buy.
export default async function SearchRedirect({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const type = one(sp.type);
  const qs = new URLSearchParams();
  const q = one(sp.q);
  const location = one(sp.location);
  if (q) qs.set("q", q);
  if (location) qs.set("location", location);
  const target = type === "companies" ? "companies" : type === "services" ? "services" : "products";
  if (type === "all" || !type) qs.set("scope", "all");
  const s = qs.toString();
  redirect(`${MP}/${target}${s ? `?${s}` : ""}`);
}
