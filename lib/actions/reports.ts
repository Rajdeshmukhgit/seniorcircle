"use server";

import { revalidatePath } from "next/cache";
import { canInteract } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";
import { invalid, reportSchema } from "@/lib/validation/schemas";
import type { ActionState } from "@/types";

export async function reportPost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sign in to report a post." };
  if (!canInteract(user)) {
    return { ok: false, message: "You can report posts once your alumni account is verified." };
  }

  const parsed = reportSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, parsed.error.issues[0]?.message);

  const repo = getRepo();
  const postId = String(formData.get("post_id") ?? "");
  const post = await repo.getPost(postId);
  if (!post) return { ok: false, message: "That experience no longer exists." };
  if (await repo.hasReported(user.id, postId)) {
    return { ok: true, message: "You have already reported this post. An administrator will review it." };
  }

  try {
    await repo.reportPost(user, postId, parsed.data.reason);
  } catch {
    return { ok: false, message: "We could not send the report. Try again." };
  }

  revalidatePath("/admin");
  return { ok: true, message: "Reported. An administrator will review it." };
}
