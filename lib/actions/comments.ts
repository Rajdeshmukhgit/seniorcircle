"use server";

import { revalidatePath } from "next/cache";
import { canInteract, isAdmin } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";
import { commentSchema, invalid } from "@/lib/validation/schemas";
import type { ActionState } from "@/types";

export async function addComment(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sign in to comment." };
  if (!canInteract(user)) {
    return { ok: false, message: "You can comment once an administrator verifies your alumni account." };
  }

  const parsed = commentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error, parsed.error.issues[0]?.message);

  const repo = getRepo();
  const post = await repo.getPost(String(formData.get("post_id") ?? ""));
  if (!post) return { ok: false, message: "That experience no longer exists." };

  try {
    await repo.addComment(user, post, parsed.data.body);
  } catch {
    return { ok: false, message: "We could not post your comment. Try again." };
  }

  revalidatePath(`/experiences/${post.id}`);
  return { ok: true };
}

export async function deleteComment(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const id = String(formData.get("id") ?? "");
  const repo = getRepo();
  const comment = await repo.getCommentOwner(id);
  if (!user || !comment) return;
  if (comment.author_id !== user.id && !isAdmin(user)) return;

  await repo.deleteComment(id);
  revalidatePath(`/experiences/${comment.post_id}`);
}
