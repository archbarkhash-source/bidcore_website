import type { Metadata } from "next";
import Link from "next/link";
import { Briefcase, Building2, Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Explore Bidcore — Companies, Professionals and Equipment",
  description: "Find construction companies, site engineers, QA engineers, surveyors and equipment owners across India.",
  alternates: { canonical: "/explore" },
};

const CARDS = [
  {
    icon: Building2,
    title: "Companies",
    body: "General contractors, subcontractors, builders, architects and suppliers with an active Bidcore subscription.",
    href: "/companies",
    add: { label: "Add your company info", href: "/add-company" },
  },
  {
    icon: Briefcase,
    title: "Professionals",
    body: "Site engineers, QA / QC engineers, surveyors and other construction professionals open to work.",
    href: "/professionals",
    add: { label: "Add your profile", href: "/add-listing?kind=professional" },
  },
  {
    icon: Wrench,
    title: "Equipment",
    body: "Excavators, cranes, mixers, survey instruments — from owners and rental companies.",
    href: "/equipment",
    add: { label: "Add your equipment", href: "/add-listing?kind=equipment" },
  },
];

export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-brand-navy sm:text-4xl">Explore Bidcore</h1>
      <p className="mt-2 max-w-2xl text-slate-600">
        Find the companies, people and equipment you need for a package, or list yourself so general contractors and subcontractors can find you.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-3">
        {CARDS.map((c) => (
          <div key={c.title} className="flex flex-col rounded-lg border border-slate-200 bg-white p-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-brand-navy text-amber-400">
              <c.icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">{c.title}</h2>
            <p className="mt-1.5 flex-1 text-sm text-slate-600">{c.body}</p>
            <div className="mt-5 flex items-center gap-4 text-sm font-semibold">
              <Link href={c.href} className="text-brand-navy hover:text-brand-accent">
                Browse
              </Link>
              <Link href={c.add.href} className="text-brand-accent hover:underline">
                {c.add.label}
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
