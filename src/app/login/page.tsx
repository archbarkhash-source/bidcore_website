import Link from "next/link";
import LoginForm from "@/components/LoginForm";

// Only same-site paths are allowed as a post-login destination.
function safeNext(raw: string | undefined): string {
  return raw && raw.startsWith("/") && !raw.startsWith("//") ? raw : "/companies";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
      <h1 className="text-2xl font-bold text-brand-navy sm:text-3xl">Sign In</h1>
      <p className="mt-2 text-slate-600">
        Enter the email you signed up with and we&apos;ll send you a one-time code.
      </p>

      <div className="mt-8">
        <LoginForm next={safeNext(next)} />
      </div>

      <p className="mt-6 text-sm text-slate-500">
        New to Bidcore?{" "}
        <Link href="/sign-in" className="font-medium text-brand-accent hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  );
}
