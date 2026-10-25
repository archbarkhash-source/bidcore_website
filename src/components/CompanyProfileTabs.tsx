"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ClipboardList, Globe, Lock, Mail, MapPin, Phone, FolderKanban } from "lucide-react";
import { Company } from "@/lib/types";
import { useSession } from "@/lib/use-session";
import { formatDate } from "@/lib/registry";
import StatusBadge from "@/components/StatusBadge";

const TABS = [
  "Overview",
  "Projects",
  "Services",
  "Locations",
  "Contacts",
  "Company Information",
] as const;

interface ContactInfo {
  address: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
}

function ContactsPanel({ company }: { company: Company }) {
  const session = useSession();
  const [contact, setContact] = useState<ContactInfo | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!session) return;
    fetch(`/api/companies/contact?state=${company.stateSlug}&slug=${company.slug}`)
      .then(async (r) => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error ?? "Couldn't load contact details.");
        setContact(d.contact);
      })
      .catch((e: Error) => setError(e.message));
  }, [session, company.stateSlug, company.slug]);

  if (session === undefined) return <p className="text-sm text-slate-400">Loading...</p>;

  if (session === null) {
    return (
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <Lock className="mx-auto h-6 w-6 text-slate-400" />
        <h3 className="mt-3 font-semibold text-brand-navy">Sign up to view contact information</h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-slate-500">
          Address, email and phone details are visible to registered Bidcore members.
        </p>
        <Link
          href="/sign-in?intent=contacts"
          className="mt-4 inline-block rounded-full bg-brand-accent px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-accent-light"
        >
          Sign Up
        </Link>
        <p className="mt-3 text-sm text-slate-500">
          Already a member?{" "}
          <Link
            href={`/login?next=${encodeURIComponent(`/companies/${company.stateSlug}/${company.slug}?tab=contacts`)}`}
            className="font-medium text-brand-accent hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    );
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!contact) return <p className="text-sm text-slate-400">Loading...</p>;

  const rows = [
    { icon: MapPin, label: "Address", value: contact.address, href: null },
    {
      icon: Mail,
      label: "Email",
      value: contact.email,
      href: contact.email ? `mailto:${contact.email}` : null,
    },
    {
      icon: Phone,
      label: "Phone",
      value: contact.phone,
      href: contact.phone ? `tel:${contact.phone.replace(/[^\d+]/g, "")}` : null,
    },
    {
      icon: Globe,
      label: "Website",
      value: contact.website,
      href: contact.website?.startsWith("http") ? contact.website : null,
    },
  ];

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {rows.map(({ icon: Icon, label, value, href }) => (
        <div
          key={label}
          className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white p-4"
        >
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <div className="min-w-0">
            <dt className="text-xs text-slate-400">{label}</dt>
            <dd className="break-words font-medium text-slate-800">
              {value ? (
                href ? (
                  <a
                    href={href}
                    target={label === "Website" ? "_blank" : undefined}
                    rel="noopener noreferrer"
                    className="hover:text-brand-accent hover:underline"
                  >
                    {value}
                  </a>
                ) : (
                  value
                )
              ) : (
                <span className="font-normal text-slate-400">Not published</span>
              )}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}

export default function CompanyProfileTabs({
  company,
  initialTab,
  registryAge,
}: {
  company: Company;
  initialTab?: string;
  registryAge?: string | null;
}) {
  const [active, setActive] = useState<(typeof TABS)[number]>(
    TABS.find((t) => t.toLowerCase() === initialTab?.toLowerCase()) ?? "Overview",
  );

  return (
    <div>
      <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              active === tab
                ? "border-brand-navy text-brand-navy"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="py-6">
        {active === "Overview" && (
          <div className="space-y-6">
            {company.about ? (
              <p className="text-slate-700">{company.about}</p>
            ) : (
              <p className="text-slate-500">
                This company hasn&apos;t added a description yet.
              </p>
            )}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                Services
              </h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {company.specializations.map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {active === "Projects" && (
          <div>
            {company.projectCount ? (
              <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <FolderKanban className="h-5 w-5 text-brand-navy" />
                <div>
                  <p className="font-semibold text-slate-900">
                    {company.projectCount} projects on record
                  </p>
                  <p className="text-sm text-slate-500">
                    Detailed project-level data is coming as the network grows.
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-slate-500">No project records yet.</p>
            )}
          </div>
        )}

        {active === "Services" && (
          <div className="flex flex-wrap gap-2">
            {company.specializations.map((s) => (
              <span
                key={s}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              >
                <ClipboardList className="h-4 w-4 text-slate-400" />
                {s}
              </span>
            ))}
          </div>
        )}

        {active === "Locations" && (
          <div>
            {company.operatingLocations && company.operatingLocations.length > 0 ? (
              <ul className="space-y-2">
                {company.operatingLocations.map((loc) => (
                  <li key={loc} className="flex items-center gap-2 text-slate-700">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    {loc}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-slate-500">No operating locations listed.</p>
            )}
          </div>
        )}

        {active === "Contacts" && <ContactsPanel company={company} />}

        {active === "Company Information" && (
          <div className="space-y-8">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InfoRow label="Company Type" value={company.type} />
              {company.founded && <InfoRow label="Founded" value={String(company.founded)} />}
              {company.sizeRange && <InfoRow label="Company Size" value={company.sizeRange} />}
              <InfoRow label="Verification" value={company.verified ? "Verified" : "Unverified"} />
              <InfoRow label="Claim Status" value={company.claimed ? "Claimed" : "Unclaimed"} />
            </dl>

            <div>
              <h3 className="text-lg font-semibold text-brand-navy">Basic Information</h3>
              {company.registry ? (
                <dl className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
                  {[
                    ["CIN", company.registry.cin],
                    ["Name", company.name],
                    ["Listed on Stock Exchange", company.registry.listedStatus],
                    ["Company Status", <StatusBadge key="s" status={company.registry.status} />],
                    ["ROC", company.registry.roc],
                    ["Registration Number", company.registry.registrationNumber],
                    ["Company Category", company.registry.category],
                    ["Company Sub Category", company.registry.subCategory],
                    ["Class of Company", company.registry.companyClass],
                    ["Date of Incorporation", formatDate(company.registry.incorporationDate)],
                    ["Age of Company", registryAge],
                  ].map(([label, value]) => (
                    <div key={String(label)} className="grid grid-cols-1 gap-1 px-5 py-3.5 sm:grid-cols-2">
                      <dt className="text-sm text-slate-500">{label}</dt>
                      <dd className="break-words text-sm font-medium text-slate-800">
                        {value || <span className="font-normal text-slate-400">Not available</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-2 text-sm text-slate-500">
                  Official company-register details aren&apos;t available for this company yet.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <dt className="text-xs text-slate-400">{label}</dt>
      <dd className="mt-0.5 font-medium text-slate-800">{value}</dd>
    </div>
  );
}
