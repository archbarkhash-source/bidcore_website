import InviteToBidcoreForm from "@/components/InviteToBidcoreForm";

export default async function InvitePage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name } = await searchParams;

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-bold text-brand-navy sm:text-3xl">Invite to Bidcore</h1>
      <p className="mt-2 text-slate-600">
        Don&apos;t see a contractor, supplier or developer on Bidcore? Invite them to join your
        network.
      </p>

      <div className="mt-8">
        <InviteToBidcoreForm defaultCompanyName={name} />
      </div>
    </div>
  );
}
