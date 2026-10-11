"use server";

import { revalidatePath } from "next/cache";
import { canInteract } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";
import type { ActionState } from "@/types";

export async function sendConnect(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sign in to connect." };
  if (!canInteract(user)) {
    return { ok: false, message: "You can connect once an administrator verifies your alumni account." };
  }

  const repo = getRepo();
  const post = await repo.getPost(String(formData.get("post_id") ?? ""));
  if (!post) return { ok: false, message: "That experience no longer exists." };
  if (post.author_id === user.id) return { ok: false, message: "This is your own experience." };

  if (await repo.getConnectForPost(user.id, post.id)) {
    return { ok: false, message: "You have already sent a request for this experience." };
  }

  try {
    await repo.createConnect(user, post);
  } catch {
    return { ok: false, message: "We could not send the request. Try again." };
  }

  revalidatePath(`/experiences/${post.id}`);
  revalidatePath("/connections");
  return { ok: true, message: "Request sent." };
}

export async function respondConnect(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  const status = formData.get("status");
  if (!user || !canInteract(user)) return;
  if (status !== "accepted" && status !== "declined") return;

  const repo = getRepo();
  const request = await repo.getConnect(String(formData.get("id") ?? ""));
  // Only the person who received a still-pending request may answer it.
  if (!request || request.recipient_id !== user.id || request.status !== "pending") return;

  await repo.respondConnect(request, status);
  revalidatePath("/connections");
}
