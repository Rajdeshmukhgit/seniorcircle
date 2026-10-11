"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { canInteract } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";
import type { VoteValue } from "@/types";

/**
 * Casts, changes or withdraws one vote. The form sends the value the member
 * should end up with, so pressing the arrow they already chose sends 0 and
 * takes the vote back.
 *
 * Authorization is checked here and again by Row Level Security: a member can
 * only write their own vote, and nobody can vote on their own experience.
 */
export async function castVote(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!canInteract(user)) redirect("/unauthorized");

  const postId = String(formData.get("postId") ?? "");
  const raw = Number(formData.get("value"));
  if (!postId || ![-1, 0, 1].includes(raw)) return;

  try {
    await getRepo().setVote(user!.id, postId, raw as VoteValue);
  } catch (error) {
    // A rejected vote (voting on your own experience, say) should not blow up
    // the page the member is looking at.
    console.error("[vote] could not record the vote:", error);
    return;
  }

  revalidatePath("/trending");
  revalidatePath(`/experiences/${postId}`);
}
