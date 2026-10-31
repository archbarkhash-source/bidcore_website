import type { Metadata } from "next";
import InvitePortal from "@/components/InvitePortal";

export const metadata: Metadata = {
  title: "Tender invitation | Bidcore",
  robots: { index: false, follow: false },
  referrer: "no-referrer", // the link token must not leak to other sites through the Referer header
};

export default async function InvitePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ action?: string }> }) {
  const { token } = await params;
  const { action } = await searchParams;
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <InvitePortal token={token} action={action === "unsubscribe" || action === "report" ? action : null} />
    </div>
  );
}
