import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { isDemoMode } from "@/lib/config";
import { demoStore } from "@/lib/data/mock";
import { PROFILE_COLUMNS } from "@/lib/data/supabase";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types";
import { DEMO_COOKIE } from "./demo-cookie";
import { isAdmin } from "./permissions";

/**
 * The signed-in member, or null. Cached per request, so layouts, pages and
 * actions can all call it without repeating the lookup.
 */
export const getCurrentUser = cache(async (): Promise<Profile | null> => {
  if (isDemoMode) {
    const id = (await cookies()).get(DEMO_COOKIE)?.value;
    if (!id) return null;
    return demoStore().profiles.find((p) => p.id === id) ?? null;
  }

  const supabase = await createClient();
  // Verified locally against the project's public signing key (see
  // lib/supabase/middleware.ts), which saves a network round trip per page.
  const { data: auth } = await supabase.auth.getClaims();
  const claims = auth?.claims;
  if (!claims?.sub) return null;

  const { data } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", claims.sub).maybeSingle();
  if (!data) return null;

  return { ...(data as unknown as Omit<Profile, "email">), email: typeof claims.email === "string" ? claims.email : "" };
});

/** For pages that need a member. Sends everyone else to sign in. */
export async function requireUser(next?: string): Promise<Profile> {
  const user = await getCurrentUser();
  if (!user) redirect(next ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login");
  return user;
}

/** For the admin area. Non-admins get the "not allowed" screen. */
export async function requireAdmin(): Promise<Profile> {
  const user = await requireUser("/admin");
  if (!isAdmin(user)) redirect("/unauthorized");
  return user;
}
