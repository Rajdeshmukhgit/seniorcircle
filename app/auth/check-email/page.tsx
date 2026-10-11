import { MailCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell, authLink } from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "Check your email" };

export default async function CheckEmailPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const alumni = type === "alumni";

  return (
    <AuthShell
      title="Check your email"
      footer={
        <Link href="/auth/login" className={authLink}>
          Back to sign in
        </Link>
      }
    >
      <span className="flex h-11 w-11 items-center justify-center shape-cut bg-[#D7F2EE] text-[#0B5A50] [--cut:12px] [--r:12px] dark:bg-[#5FD4C2]/15 dark:text-[#93E4D6]">
        <MailCheck className="h-5 w-5" aria-hidden />
      </span>
      <p className="mt-4 text-[15.5px] leading-relaxed text-strong">
        We sent a confirmation link to your inbox. Open it to finish creating your account.
      </p>
      {alumni && (
        <p className="mt-3 text-[14.5px] leading-relaxed text-soft">
          After you confirm, your alumni account goes to an administrator for verification. You will be able to
          contribute once it is approved.
        </p>
      )}
    </AuthShell>
  );
}
