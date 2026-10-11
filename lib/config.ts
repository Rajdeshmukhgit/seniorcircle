import "server-only";
import { DEFAULT_COLLEGE_EMAIL_DOMAIN } from "@/lib/constants/site";

/** True when Supabase keys are present. Otherwise the app runs on mock data. */
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export const isDemoMode = !isSupabaseConfigured;

/**
 * The email domain students must sign up with. Read on the server only, so it
 * cannot be changed from the browser.
 */
export function collegeEmailDomain(): string {
  const value = process.env.COLLEGE_EMAIL_DOMAIN?.trim().toLowerCase().replace(/^@/, "");
  return value || DEFAULT_COLLEGE_EMAIL_DOMAIN;
}
