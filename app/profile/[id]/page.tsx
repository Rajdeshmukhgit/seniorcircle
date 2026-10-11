import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProfileView } from "@/components/profile/ProfileView";
import { requireUser } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await getRepo().getProfile(id);
  return { title: profile?.name ?? "Profile" };
}

export default async function ProfilePage({ params }: PageProps) {
  const { id } = await params;
  const viewer = await requireUser(`/profile/${id}`);
  if (viewer.id === id) redirect("/profile");

  const profile = await getRepo().getProfile(id);
  if (!profile) notFound();

  return <ProfileView profile={profile} />;
}
