import type { Profile } from "@/types";

type Viewer = Pick<Profile, "id" | "role" | "verification_status"> | null | undefined;

export function isAdmin(user: Viewer): boolean {
  return user?.role === "admin";
}

/** Students and admins are trusted by their email; alumni only once verified. */
export function isVerifiedMember(user: Viewer): boolean {
  if (!user) return false;
  if (user.role === "alumni") return user.verification_status === "verified";
  return true;
}

export function isPendingAlumni(user: Viewer): boolean {
  return user?.role === "alumni" && user.verification_status === "pending";
}

export function isRejectedAlumni(user: Viewer): boolean {
  return user?.role === "alumni" && user.verification_status === "rejected";
}

/** Seniors, verified alumni and admins write experiences. Juniors read them. */
export function canPost(user: Viewer): boolean {
  if (!user || !isVerifiedMember(user)) return false;
  return user.role === "senior" || user.role === "alumni" || user.role === "admin";
}

/** Commenting, connecting and reporting need a verified member. */
export function canInteract(user: Viewer): boolean {
  return isVerifiedMember(user);
}

export function canEditPost(user: Viewer, post: { author_id: string }): boolean {
  return Boolean(user) && isVerifiedMember(user) && user!.id === post.author_id;
}

export function canDeletePost(user: Viewer, post: { author_id: string }): boolean {
  return Boolean(user) && (user!.id === post.author_id || isAdmin(user));
}

/** Why this person cannot post, phrased for the interface. */
export function postingBlockedReason(user: Viewer): string | null {
  if (!user) return "Sign in to share an experience.";
  if (isPendingAlumni(user)) return "Your alumni account is waiting for verification. You can post once an administrator approves it.";
  if (isRejectedAlumni(user)) return "Your alumni verification was not approved, so this account cannot post.";
  if (user.role === "junior") return "Experiences are written by seniors and alumni. You can read, comment and connect.";
  return null;
}
