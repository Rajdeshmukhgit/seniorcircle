"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";
import { invalid, profileSchema } from "@/lib/validation/schemas";
import type { ActionState } from "@/types";

export async function updateProfile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "Sign in to edit your profile." };

  const parsed = profileSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  try {
    await getRepo().updateProfile(user.id, parsed.data);
  } catch {
    return { ok: false, message: "We could not save your profile. Try again." };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Profile saved." };
}
