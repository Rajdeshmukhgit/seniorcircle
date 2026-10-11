"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { enrichPostById } from "@/lib/ai/enrich";
import { canDeletePost, canEditPost, canPost, postingBlockedReason } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";
import { invalid, postSchema } from "@/lib/validation/schemas";
import type { ActionState } from "@/types";

/** Creates an experience, or updates it when the form carries an id. */
export async function savePost(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!canPost(user)) {
    return { ok: false, message: postingBlockedReason(user) ?? "You cannot post from this account." };
  }

  const parsed = postSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  const repo = getRepo();
  const id = String(formData.get("id") ?? "");
  let postId = id;

  try {
    if (id) {
      const existing = await repo.getPost(id);
      if (!existing) return { ok: false, message: "That experience no longer exists." };
      if (!canEditPost(user, existing)) {
        return { ok: false, message: "You can only edit experiences you wrote." };
      }
      await repo.updatePost(id, parsed.data);
    } else {
      postId = await repo.createPost(user!, parsed.data);
    }
  } catch {
    return { ok: false, message: "We could not save the experience. Try again." };
  }

  revalidatePath("/", "layout");

  // Embedding and reading the write-up takes several seconds and two model
  // calls, so it runs after the response: the member gets their experience
  // immediately, and enrichPostById swallows its own failures. Anything that
  // does fail stays in the admin backfill queue.
  const enriching = postId;
  after(async () => {
    await enrichPostById(enriching);
    revalidatePath(`/experiences/${enriching}`);
  });

  redirect(`/experiences/${postId}`);
}

export async function deletePost(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const id = String(formData.get("id") ?? "");
  const repo = getRepo();
  const post = await repo.getPost(id);

  if (!user || !post || !canDeletePost(user, post)) redirect("/unauthorized");

  await repo.deletePost(id);
  revalidatePath("/", "layout");
  redirect(formData.get("from") === "admin" ? "/admin" : "/feed");
}
