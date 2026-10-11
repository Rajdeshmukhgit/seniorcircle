import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, authLink } from "@/components/auth/AuthShell";
import { DemoAccounts } from "@/components/auth/DemoAccounts";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/lib/auth/session";
import { isDemoMode } from "@/lib/config";
import { SITE_NAME } from "@/lib/constants/site";
import { safeNext } from "@/lib/validation/schemas";

export const metadata: Metadata = { title: "Sign In" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const params = await searchParams;
  const next = safeNext(params.next);
  if (await getCurrentUser()) redirect(next);

  return (
    <AuthShell
      title="Sign in"
      subtitle={`Welcome back to ${SITE_NAME}.`}
      footer={
        <>
          New here?{" "}
          <Link href="/auth/signup" className={authLink}>
            Join the community
          </Link>
        </>
      }
    >
      {params.error === "link" && (
        <p role="alert" className="mb-4 shape-cut border border-line bg-tint [--cut:12px] [--r:12px] px-3.5 py-2.5 text-[13.5px] text-danger">
          That link has expired or was already used. Sign in, or request a new one.
        </p>
      )}
      <LoginForm next={next} />
      {isDemoMode && <DemoAccounts next={next} />}
    </AuthShell>
  );
}
