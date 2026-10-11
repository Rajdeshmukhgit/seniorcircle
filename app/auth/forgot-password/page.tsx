import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell, authLink } from "@/components/auth/AuthShell";
import { ForgotPasswordForm } from "@/components/auth/SimpleAuthForms";

export const metadata: Metadata = { title: "Reset your password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email you signed up with and we will send a link to set a new password."
      footer={
        <Link href="/auth/login" className={authLink}>
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
