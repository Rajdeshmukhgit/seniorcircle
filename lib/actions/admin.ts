"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { POSTS_TAG } from "@/lib/data/cached";
import { isAdmin } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";

/** Every admin action re-checks the role on the server; hiding the button is not the control. */
async function assertAdmin() {
  const user = await getCurrentUser();
  if (!isAdmin(user)) throw new Error("Only administrators can do this.");
}

export async function reviewAlumni(formData: FormData): Promise<void> {
  await assertAdmin();
  const decision = formData.get("decision");
  if (decision !== "verified" && decision !== "rejected") return;
  await getRepo().setVerification(String(formData.get("id") ?? ""), decision);
  revalidatePath("/admin");
}

export async function dismissReport(formData: FormData): Promise<void> {
  await assertAdmin();
  await getRepo().dismissReport(String(formData.get("id") ?? ""));
  revalidatePath("/admin");
}

export async function removeReportedPost(formData: FormData): Promise<void> {
  await assertAdmin();
  await getRepo().deletePost(String(formData.get("post_id") ?? ""));
  revalidatePath("/", "layout");
  revalidateTag(POSTS_TAG);
}
