import { notFound, redirect } from "next/navigation";
import CompanyEditForm from "@/components/CompanyEditForm";
import { getCurrentUser } from "@/lib/current-user";
import { db } from "@/lib/db";

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ state: string; company: string }>;
}) {
  const { state, company: slug } = await params;
  const profilePath = `/companies/${state}/${slug}`;

  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`${profilePath}/edit`)}`);

  const company = await db.company.findFirst({
    where: { slug, active: true, state: { slug: state } },
  });
  if (!company) notFound();
  if (company.claimedById !== user.id) redirect(profilePath);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-bold text-brand-navy">Update {company.name}</h1>
      <p className="mt-2 text-sm text-slate-600">
        Your company is claimed and shows the Verified badge. Keep its details current so partners
        can find and contact you.
      </p>
      <div className="mt-8">
        <CompanyEditForm
          company={{
            stateSlug: state,
            slug,
            about: company.about ?? "",
            phone: company.phone ?? "",
            address: company.address ?? "",
            sizeRange: company.sizeRange ?? "",
            specializations: company.specializations.join(", "),
            operatingLocations: company.operatingLocations.join(", "),
          }}
        />
      </div>
    </div>
  );
}
