"use client";

import Link from "next/link";
import { Send } from "lucide-react";
import { useSession } from "@/lib/use-session";

// Signed-out visitors are sent to the Tender Connect free-trial signup first;
// members go straight to the invite form.
export default function TenderInviteButton({ companySlug }: { companySlug: string }) {
  const session = useSession();
  const href = session
    ? `/send-tender-invite?company=${companySlug}`
    : `/sign-in?intent=tender&company=${companySlug}`;

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 rounded-md bg-brand-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-accent-light"
    >
      <Send className="h-4 w-4" />
      Send Tender Invite
    </Link>
  );
}
