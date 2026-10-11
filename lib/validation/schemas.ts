import { z } from "zod";
import { BRANCHES, alumniGraduationYears, studentGraduationYears } from "@/lib/constants/options";
import type { ActionState } from "@/types";

const name = z
  .string()
  .trim()
  .min(2, "Enter your full name.")
  .max(80, "Keep your name under 80 characters.");

const email = z.string().trim().toLowerCase().email("Enter a valid email address.");

const password = z
  .string()
  .min(8, "Use at least 8 characters.")
  .max(72, "Use 72 characters or fewer.");

const branch = z.enum(BRANCHES, { errorMap: () => ({ message: "Choose your branch." }) });

export const signupSchema = z
  .object({
    account_type: z.enum(["student", "alumni"], { errorMap: () => ({ message: "Choose Student or Alumni." }) }),
    name,
    email,
    password,
    branch,
    graduation_year: z.coerce.number({ invalid_type_error: "Choose your graduation year." }).int(),
  })
  .superRefine((value, ctx) => {
    const allowed = value.account_type === "student" ? studentGraduationYears() : alumniGraduationYears();
    if (!allowed.includes(value.graduation_year)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["graduation_year"],
        message:
          value.account_type === "student"
            ? "Choose the year your batch graduates."
            : "Choose the year you graduated.",
      });
    }
  });

export const loginSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export const forgotPasswordSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({ password, confirm: z.string() })
  .refine((value) => value.password === value.confirm, {
    path: ["confirm"],
    message: "The two passwords do not match.",
  });

/** "On Campus, DSA , dsa" -> ["on-campus", "dsa"] */
export function parseTags(raw: string): string[] {
  const tags = raw
    .split(",")
    .map((tag) =>
      tag
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9+#&.\s-]/g, "")
        .replace(/\s+/g, "-"),
    )
    .filter((tag) => tag.length >= 2 && tag.length <= 24);
  return [...new Set(tags)];
}

export const postSchema = z.object({
  title: z.string().trim().min(8, "Give the title at least 8 characters.").max(140, "Keep the title under 140 characters."),
  company_or_exam: z
    .string()
    .trim()
    .min(2, "Enter the company, exam or certification.")
    .max(80, "Keep this under 80 characters."),
  category: z.enum(["interview", "internship", "exam", "certification"], {
    errorMap: () => ({ message: "Choose what kind of experience this is." }),
  }),
  role: z
    .string()
    .trim()
    .max(80, "Keep the role under 80 characters.")
    .transform((value) => (value === "" ? null : value)),
  branch,
  graduation_year: z.coerce
    .number({ invalid_type_error: "Choose a graduation year." })
    .int()
    .min(1980, "Choose a graduation year.")
    .max(2100, "Choose a graduation year."),
  description: z
    .string()
    .trim()
    .min(80, "Write at least a few sentences (80 characters) so the experience is useful.")
    .max(20000, "Keep the experience under 20,000 characters."),
  tags: z
    .string()
    .transform(parseTags)
    .refine((tags) => tags.length <= 6, "Use at most 6 tags."),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Write a comment first.").max(2000, "Keep comments under 2,000 characters."),
});

export const reportSchema = z.object({
  reason: z.string().trim().min(5, "Say briefly what is wrong with this post.").max(500, "Keep this under 500 characters."),
});

export const profileSchema = z.object({ name, branch });

/** Flattens a zod error into the shape forms display. */
export function invalid(error: z.ZodError, message = "Check the highlighted fields."): ActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { ok: false, message, fieldErrors };
}

/** Only allow redirects back into this site. */
export function safeNext(value: FormDataEntryValue | string | null | undefined, fallback = "/feed"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
