import { Clock3 } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { ButtonLink } from "@/components/ui/Button";
import { isPendingAlumni, isRejectedAlumni } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { CONTACT_EMAIL } from "@/lib/constants/site";

export const metadata: Metadata = { title: "Verification pending" };

export default async function PendingPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/auth/login");
  // Verified members have nothing to wait for.
  if (!isPendingAlumni(user) && !isRejectedAlumni(user)) redirect("/feed");

  const rejected = isRejectedAlumni(user);

  return (
    <AuthShell title={rejected ? "Verification not approved" : "Verification pending"} wide>
      <span className="flex h-11 w-11 items-center justify-center shape-cut bg-[#DCEBFF] text-[#0A4C96] [--cut:12px] [--r:12px] dark:bg-[#5AA9FF]/15 dark:text-[#9CCBFF]">
        <Clock3 className="h-5 w-5" aria-hidden />
      </span>
      <p className="mt-4 text-[15.5px] leading-relaxed text-strong">
        {rejected
          ? "An administrator could not confirm this alumni account, so it cannot post or connect."
          : "Your alumni account has been submitted for verification. You will be able to contribute once an administrator approves your account."}
      </p>

      <dl className="mt-5 divide-y divide-hairline shape-cut border border-line [--cut:12px] [--r:12px] text-[14px]">
        {[
          ["Name", user.name],
          ["Email", user.email],
          ["Branch", user.branch],
          ["Graduated", String(user.graduation_year)],
        ].map(([term, value]) => (
          <div key={term} className="flex justify-between gap-4 px-3.5 py-2.5">
            <dt className="text-faint">{term}</dt>
            <dd className="truncate font-semibold text-ink">{value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-5 text-[14px] leading-relaxed text-soft">
        {rejected ? "If this looks wrong, write to " : "You will get a notification here when it is decided. Meanwhile you can read every experience. Questions go to "}
        <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary-text hover:underline">
          {CONTACT_EMAIL}
        </a>
        .
      </p>

      <ButtonLink href="/feed" variant="solid" className="mt-6 w-full">
        Browse experiences
      </ButtonLink>
    </AuthShell>
  );
}
