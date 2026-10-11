import type { Metadata } from "next";
import { ProfileView } from "@/components/profile/ProfileView";
import { requireUser } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Your profile" };

export default async function OwnProfilePage() {
  const user = await requireUser("/profile");
  return <ProfileView profile={user} self={user} />;
}
