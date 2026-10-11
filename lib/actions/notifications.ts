"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";

export async function markNotificationRead(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await getRepo().markNotificationRead(user.id, String(formData.get("id") ?? ""));
  revalidatePath("/", "layout");
}

export async function markAllNotificationsRead(): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;
  await getRepo().markAllNotificationsRead(user.id);
  revalidatePath("/", "layout");
}
