/**
 * Branding lives here and nowhere else. Change SITE_NAME (and the part of it
 * that is tinted in the logo) to rename the platform everywhere.
 */
export const SITE_NAME = "SeniorCircle";

/**
 * Release number shown in the footer and returned by /api/health.
 * Bump it when you ship a change, so you can see which build is running.
 */
export const APP_VERSION = "1.0.0";

/** The slice of SITE_NAME drawn in the brand colour in the wordmark. */
export const SITE_NAME_ACCENT = "Circle";

export const COLLEGE_NAME = "MIT";

/**
 * Students must sign up with an email at this domain, for example
 * raj.deshmukh1@mitwpu.edu.in. The COLLEGE_EMAIL_DOMAIN environment variable
 * overrides it. The database enforces the same domain in
 * public.college_email_domain() (supabase/migrations/0001_schema.sql).
 */
export const DEFAULT_COLLEGE_EMAIL_DOMAIN = "mitwpu.edu.in";

export const SITE_TAGLINE =
  "Real interview, placement, exam and certification experiences shared by seniors and alumni from our college.";

export const SITE_MISSION =
  "A place where seniors and alumni write down what the process was really like, so the next batch walks in prepared.";

export const CONTACT_EMAIL = "coordinator@example.edu";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/feed", label: "Experiences" },
  { href: "/trending", label: "Trending" },
  { href: "/discover", label: "Discover" },
  { href: "/about", label: "About" },
] as const;
