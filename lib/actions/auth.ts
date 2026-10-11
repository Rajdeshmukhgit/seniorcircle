"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE } from "@/lib/auth/demo-cookie";
import { collegeEmailDomain, isDemoMode } from "@/lib/config";
import { SITE_URL } from "@/lib/constants/site";
import { studentRoleFor } from "@/lib/constants/options";
import { demoStore } from "@/lib/data/mock";
import { createClient } from "@/lib/supabase/server";
import {
  forgotPasswordSchema,
  invalid,
  loginSchema,
  resetPasswordSchema,
  safeNext,
  signupSchema,
} from "@/lib/validation/schemas";
import type { ActionState } from "@/types";

const DEMO_COOKIE_OPTIONS = { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 7 } as const;

export async function signUp(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const input = parsed.data;
  const isStudent = input.account_type === "student";

  if (isStudent) {
    const domain = collegeEmailDomain();
    if (input.email.split("@")[1] !== domain) {
      return {
        ok: false,
        message: "Check the highlighted fields.",
        fieldErrors: { email: `Use your college email ending in @${domain}. Graduated? Sign up as alumni.` },
      };
    }
  }

  if (isDemoMode) {
    const store = demoStore();
    if (store.profiles.some((p) => p.email === input.email)) {
      return { ok: false, message: "Check the highlighted fields.", fieldErrors: { email: "An account with this email already exists. Sign in instead." } };
    }
    const id = `u-${crypto.randomUUID().slice(0, 8)}`;
    store.profiles.push({
      id,
      email: input.email,
      role: isStudent ? studentRoleFor(input.graduation_year) : "alumni",
      verification_status: isStudent ? "not_required" : "pending",
      name: input.name,
      branch: input.branch,
      graduation_year: input.graduation_year,
      created_at: new Date().toISOString(),
    });
    (await cookies()).set(DEMO_COOKIE, id, DEMO_COOKIE_OPTIONS);
    redirect(isStudent ? "/feed" : "/auth/pending");
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      // Read by the handle_new_user database trigger, which decides the role.
      data: {
        account_type: input.account_type,
        name: input.name,
        branch: input.branch,
        graduation_year: input.graduation_year,
      },
      emailRedirectTo: `${SITE_URL}/auth/callback?next=${isStudent ? "/feed" : "/auth/pending"}`,
    },
  });

  if (error) {
    const message = /database error/i.test(error.message)
      ? "We could not create this account. Check your email address and graduation year, then try again."
      : error.message;
    return { ok: false, message };
  }
  // Supabase answers a repeat signup with a user that has no identities.
  if (data.user && data.user.identities?.length === 0) {
    return { ok: false, message: "Check the highlighted fields.", fieldErrors: { email: "An account with this email already exists. Sign in instead." } };
  }

  if (data.session) redirect(isStudent ? "/feed" : "/auth/pending");
  redirect(`/auth/check-email?type=${input.account_type}`);
}

export async function signIn(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);
  const next = safeNext(formData.get("next"));

  if (isDemoMode) {
    const profile = demoStore().profiles.find((p) => p.email === parsed.data.email);
    if (!profile) {
      return { ok: false, message: "No demo account uses that email. Pick one of the demo accounts below, or sign up." };
    }
    (await cookies()).set(DEMO_COOKIE, profile.id, DEMO_COOKIE_OPTIONS);
    redirect(next);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const message = /confirm/i.test(error.message)
      ? "Confirm your email first. The link is in the message we sent when you signed up."
      : "That email and password do not match an account.";
    return { ok: false, message };
  }
  redirect(next);
}

/** Demo mode only: sign in as one of the seeded accounts. */
export async function demoSignIn(formData: FormData): Promise<void> {
  if (!isDemoMode) redirect("/auth/login");
  const id = String(formData.get("id") ?? "");
  const profile = demoStore().profiles.find((p) => p.id === id);
  if (!profile) redirect("/auth/login");
  (await cookies()).set(DEMO_COOKIE, profile.id, DEMO_COOKIE_OPTIONS);
  redirect(safeNext(formData.get("next")));
}

export async function signOut(): Promise<void> {
  if (isDemoMode) {
    (await cookies()).delete(DEMO_COOKIE);
  } else {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function requestPasswordReset(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  if (isDemoMode) {
    return { ok: true, message: "Demo mode does not send email. With Supabase connected, a reset link is sent here." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${SITE_URL}/auth/callback?next=/auth/reset-password`,
  });
  if (error) return { ok: false, message: "We could not send the reset email. Try again in a minute." };

  // Same answer whether or not the account exists, so emails cannot be probed.
  return { ok: true, message: "If an account uses that email, a reset link is on its way." };
}

export async function updatePassword(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return invalid(parsed.error);

  if (isDemoMode) {
    return { ok: true, message: "Demo mode has no passwords to change." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, message: "This reset link has expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, message: error.message };

  redirect("/feed");
}
