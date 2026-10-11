import type { Category, Role } from "@/types";

export const BRANCHES = [
  "Computer Engineering",
  "Information Technology",
  "AI & Data Science",
  "Electronics",
  "Mechanical",
  "Civil",
] as const;

/** Short forms used in dense metadata lines on cards. */
export const BRANCH_SHORT: Record<string, string> = {
  "Computer Engineering": "COMP",
  "Information Technology": "IT",
  "AI & Data Science": "AI&DS",
  Electronics: "ENTC",
  Mechanical: "MECH",
  Civil: "CIVIL",
};

export const CATEGORIES: { value: Category; label: string; nameLabel: string }[] = [
  { value: "interview", label: "Interview", nameLabel: "Company" },
  { value: "internship", label: "Internship", nameLabel: "Company" },
  { value: "exam", label: "Competitive exam", nameLabel: "Exam" },
  { value: "certification", label: "Certification", nameLabel: "Certification" },
];

export const CATEGORY_LABEL: Record<Category, string> = {
  interview: "Interview",
  internship: "Internship",
  exam: "Competitive exam",
  certification: "Certification",
};

export const ROLE_LABEL: Record<Role, string> = {
  junior: "Junior",
  senior: "Senior",
  alumni: "Alumni",
  admin: "Admin",
};

/** Shown in the homepage discovery panel when there is not enough data yet. */
export const SUGGESTED_COMPANIES = [
  "Barclays",
  "Mastercard",
  "PhonePe",
  "ZS Associates",
  "Siemens",
  "GATE",
  "CAT",
  "GRE",
  "AWS Certification",
];

/**
 * The graduating year of the current final-year batch. The academic year
 * turns over in July, so in October 2026 the final-year batch is 2027.
 */
export function finalYearBatch(now: Date = new Date()): number {
  return now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
}

/** Years offered in filters: the four current batches plus recent alumni. */
export function graduationYears(now: Date = new Date()): number[] {
  const top = finalYearBatch(now) + 3;
  return Array.from({ length: 11 }, (_, i) => top - i);
}

/** Years a current student can pick at signup (first to final year). */
export function studentGraduationYears(now: Date = new Date()): number[] {
  const final = finalYearBatch(now);
  return [final, final + 1, final + 2, final + 3];
}

/** Years an alumnus can pick at signup. */
export function alumniGraduationYears(now: Date = new Date()): number[] {
  const final = finalYearBatch(now);
  return Array.from({ length: 30 }, (_, i) => final - 1 - i);
}

/**
 * Final-year and pre-final-year students are seniors; everyone earlier is a
 * junior. The same rule is implemented in the database trigger that creates
 * profiles (supabase/migrations/0001_schema.sql).
 */
export function studentRoleFor(graduationYear: number, now: Date = new Date()): "junior" | "senior" {
  return graduationYear <= finalYearBatch(now) + 1 ? "senior" : "junior";
}
