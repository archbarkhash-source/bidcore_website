import TenderInviteForm from "@/components/TenderInviteForm";
import TenderInviteGate from "@/components/TenderInviteGate";
import { db } from "@/lib/db";

export default async function SendBidInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ company?: string }>;
}) {
  const { company: companySlug } = await searchParams;
  const company = companySlug
    ? await db.company.findFirst({ where: { slug: companySlug, active: true }, select: { slug: true, name: true } })
    : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-bold text-brand-navy sm:text-3xl">Send Tender Invite</h1>
      <p className="mt-2 text-slate-600">
        {company ? (
          <>
            Inviting <span className="font-medium text-brand-navy">{company.name}</span> to bid
            on a project.
          </>
        ) : (
          "Invite a company to bid on your project."
        )}
      </p>

      <div className="mt-8">
        <TenderInviteGate companySlug={company?.slug}>
          <TenderInviteForm companyName={company?.name} />
        </TenderInviteGate>
      </div>
    </div>
  );
}
