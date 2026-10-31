import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, MapPin } from "lucide-react";
import DirectoryContact from "@/components/DirectoryContact";
import { getDirectoryCompany } from "@/lib/directory";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const res = await getDirectoryCompany(slug);
  if (!res.ok) return { title: "Company not found", robots: { index: false, follow: false } };
  return { title: `${res.data.name} | Bidcore`, description: `${res.data.name}: ${[res.data.type, res.data.city].filter(Boolean).join(", ")} on Bidcore`, alternates: { canonical: `/company/${slug}` } };
}

// A Bidcore directory company. The public card never carries real contact details: the contact arrives masked and is opened by a signed-in member (DirectoryContact).
export default async function CompanyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await getDirectoryCompany(slug);
  if (!res.ok) notFound();
  const c = res.data;
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <nav className="text-sm text-slate-500">
        <Link href="/companies" className="hover:text-brand-accent">
          Companies
        </Link>{" "}
        / <span>{c.name}</span>
      </nav>
      <h1 className="mt-3 text-2xl font-bold text-brand-navy sm:text-3xl">{c.name}</h1>
      {c.type && <p className="mt-1 text-slate-500">{c.type}</p>}
      <div className="mt-4 space-y-2 text-sm text-slate-600">
        {(c.city || c.state) && (
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400" />
            {[c.city, c.state].filter(Boolean).join(", ")}
          </p>
        )}
        {c.website && (
          <p className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-slate-400" />
            <a href={c.website} target="_blank" rel="noopener noreferrer nofollow" className="text-brand-accent hover:underline">
              {c.website.replace(/^https?:\/\//, "")}
            </a>
          </p>
        )}
      </div>
      {c.trades.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {c.trades.map((t) => (
            <span key={t} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              {t}
            </span>
          ))}
        </div>
      )}
      {c.contact?.available && (
        <div className="mt-8">
          <DirectoryContact slug={slug} masked={{ phone: c.contact.phone, email: c.contact.email, address: c.contact.address }} />
        </div>
      )}
    </div>
  );
}
