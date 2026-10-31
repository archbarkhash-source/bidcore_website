import Link from "next/link";
import SignInForm, { type SignUpIntent } from "@/components/SignInForm";
import type { ProductKey } from "@/lib/app-links";

const COPY: Record<SignUpIntent, { title: string; body: React.ReactNode }> = {
  company: {
    title: "Add Your Company Details",
    body: (
      <>
        Free, with no payment. Verify your email and mobile number with one-time codes, then list your company on Bidcore and manage its profile. You can discover companies today, and
        qualify for{" "}
        <Link href="/bid-board" className="text-brand-accent hover:underline">
          Bid Board
        </Link>{" "}
        as it rolls out.
      </>
    ),
  },
  contacts: {
    title: "Add Your Details to View Contacts",
    body: (
      <>
        Free, with no payment and no credit card. Add your contact details and verify your email and
        mobile number with one-time codes to see contact details across the Bidcore directory.
      </>
    ),
  },
  tender: {
    title: "Sign Up Free",
    body: (
      <>
        Verify your email and mobile number with one-time codes to create your Bidcore account. It is free, with no credit card. You can then add your company
        information to the Bidcore directory and view contact details across it.
      </>
    ),
  },
};

const PUBLISH_COPY = {
  title: "Publish Your Tender on Bidcore",
  body: (
    <>
      Verify your email to create your Bidcore account. Tenders are published from the BidcoreAI software and appear on Bidcore.in under Public Tenders. No credit
      card required.
    </>
  ),
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string; company?: string; product?: string; next?: string }>;
}) {
  const { intent: rawIntent, company, product: rawProduct, next: appNext } = await searchParams;
  const PRODUCT_KEYS: ProductKey[] = ["tender-connect", "tender-management", "project-management", "procurement", "site-management", "all-in-one"];
  // Every product's Sign Up lands here first; an old ?intent=tender link means Tender Connect.
  const product = PRODUCT_KEYS.find((k) => k === rawProduct) ?? (rawIntent === "tender" || rawIntent === "publish" ? "tender-connect" : undefined);
  const intent: SignUpIntent = product ? "tender" : rawIntent === "contacts" ? "contacts" : "company";
  const publish = rawIntent === "publish";
  const { title, body } = publish ? PUBLISH_COPY : COPY[intent];
  const explicitNext = appNext?.startsWith("/") && !appNext.startsWith("//") ? appNext : undefined;
  // After verifying, the person stays on this website: an explicit page, the tender-invite page when they came for a named company, else Add company info.
  const next = explicitNext ?? (intent === "tender" && company ? `/send-tender-invite?company=${encodeURIComponent(company)}` : undefined);

  return (
    <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-bold text-brand-navy sm:text-3xl">{title}</h1>
      <p className="mt-2 text-slate-600">{body}</p>

      <div className="mt-8">
        <SignInForm intent={intent} next={next} product={product} publish={publish} appNext={appNext?.startsWith("/") ? appNext : undefined} />
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Already a member?{" "}
        <Link href="/login" className="font-medium text-brand-accent hover:underline">
          Sign in
        </Link>
      </p>

      {intent === "company" ? (
        <p className="mt-3 text-sm text-slate-500">
          Just here to browse?{" "}
          <Link href="/sign-in?intent=contacts" className="font-medium text-brand-accent hover:underline">
            Add your details to view contacts
          </Link>
        </p>
      ) : (
        <p className="mt-3 text-sm text-slate-500">
          Have a company to list instead?{" "}
          <Link href="/sign-in" className="font-medium text-brand-accent hover:underline">
            Add your company details
          </Link>
        </p>
      )}
    </div>
  );
}
