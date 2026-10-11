import { Lock } from "lucide-react";
import type { Metadata } from "next";
import { PostForm } from "@/components/experiences/PostForm";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { canPost, postingBlockedReason } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { graduationYears } from "@/lib/constants/options";

export const metadata: Metadata = { title: "Share Your Experience" };

export default async function NewExperiencePage() {
  const user = await requireUser("/experiences/new");

  return (
    <div className="mx-auto w-full max-w-[760px] px-4 pb-16 pt-24 sm:px-6 md:pt-28">
      <h1 className="font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.05em] text-ink sm:text-[46px]">
        Share Your Experience
      </h1>
      <p className="mt-2 max-w-xl text-[15.5px] text-soft">
        Write it the way you would explain it to a junior over chai: what was asked, what surprised you, and what you
        would do differently.
      </p>

      <div className="mt-8">
        {canPost(user) ? (
          <PostForm years={graduationYears()} defaults={{ branch: user.branch, graduation_year: user.graduation_year }} />
        ) : (
          <EmptyState
            icon={Lock}
            title="This account cannot post yet"
            description={postingBlockedReason(user) ?? undefined}
            action={
              <ButtonLink href="/feed" variant="outline">
                Browse experiences
              </ButtonLink>
            }
          />
        )}
      </div>
    </div>
  );
}
