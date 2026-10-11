import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PostForm } from "@/components/experiences/PostForm";
import { canEditPost } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { graduationYears } from "@/lib/constants/options";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Edit experience" };

export default async function EditExperiencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/experiences/${id}/edit`);
  const post = await getRepo().getPost(id);
  if (!post) notFound();
  // Only the author may open the editor. Everyone else is turned away.
  if (!canEditPost(user, post)) redirect("/unauthorized");

  return (
    <div className="mx-auto w-full max-w-[760px] px-4 pb-16 pt-24 sm:px-6 md:pt-28">
      <h1 className="font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.05em] text-ink sm:text-[46px]">
        Edit experience
      </h1>
      <div className="mt-8">
        <PostForm post={post} years={graduationYears()} defaults={{ branch: user.branch, graduation_year: user.graduation_year }} />
      </div>
    </div>
  );
}
