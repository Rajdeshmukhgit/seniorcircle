import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell, authLink } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";
import { getCurrentUser } from "@/lib/auth/session";
import { collegeEmailDomain } from "@/lib/config";
import { alumniGraduationYears, studentGraduationYears } from "@/lib/constants/options";
import { COLLEGE_NAME } from "@/lib/constants/site";

export const metadata: Metadata = { title: "Join the community" };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  if (await getCurrentUser()) redirect("/feed");
  const { type } = await searchParams;

  return (
    <AuthShell
      wide
      title="Join the community"
      subtitle={`For current ${COLLEGE_NAME} students and alumni only.`}
      footer={
        <>
          Already a member?{" "}
          <Link href="/auth/login" className={authLink}>
            Sign in
          </Link>
        </>
      }
    >
      <SignupForm
        initialType={type === "alumni" ? "alumni" : "student"}
        collegeDomain={collegeEmailDomain()}
        studentYears={studentGraduationYears()}
        alumniYears={alumniGraduationYears()}
      />
    </AuthShell>
  );
}
