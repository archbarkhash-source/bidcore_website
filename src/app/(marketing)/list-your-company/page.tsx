import { redirect } from "next/navigation";

// Company sign-up lives at /sign-in, which verifies the email with an OTP.
export default function ListYourCompanyPage() {
  redirect("/sign-in");
}
