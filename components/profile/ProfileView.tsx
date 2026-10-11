import { NotebookPen } from "lucide-react";
import { FeedCard } from "@/components/experiences/FeedCard";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { canPost } from "@/lib/auth/permissions";
import { getRepo } from "@/lib/data";
import type { Profile, PublicProfile } from "@/types";
import { ProfileForm } from "./ProfileForm";
import { ProfileHeader } from "./ProfileHeader";

interface ProfileViewProps {
  profile: PublicProfile;
  /** Set when the viewer is looking at their own profile. */
  self?: Profile;
}

export async function ProfileView({ profile, self }: ProfileViewProps) {
  const repo = getRepo();
  const [posts, stats] = await Promise.all([repo.listPostsByAuthor(profile.id), repo.profileStats(profile.id)]);
  const firstName = profile.name.split(" ")[0];

  return (
    <div className="mx-auto w-full max-w-[820px] px-4 pb-16 pt-24 sm:px-6 md:pt-28">
      <ProfileHeader profile={profile} email={self?.email} stats={stats} />

      <section aria-labelledby="profile-posts" className="mt-8">
        <h2 id="profile-posts" className="font-display text-[20px] font-bold tracking-[-0.025em] text-ink">
          {self ? "Your experiences" : `Experiences by ${firstName}`}
        </h2>
        <div className="mt-4 space-y-3">
          {posts.length === 0 ? (
            <EmptyState
              icon={NotebookPen}
              title={self ? "You have not shared an experience yet" : `${firstName} has not shared an experience yet`}
              description={self && canPost(self) ? "Write up an interview, exam or certification you have been through." : undefined}
              action={
                self && canPost(self) ? (
                  <ButtonLink href="/experiences/new" variant="solid">
                    Share Your Experience
                  </ButtonLink>
                ) : undefined
              }
            />
          ) : (
            posts.map((post) => <FeedCard key={post.id} post={post} />)
          )}
        </div>
      </section>

      {self && (
        <section aria-labelledby="profile-edit" className="mt-10 rounded-card border border-line bg-card p-[22px]">
          <h2 id="profile-edit" className="font-display text-[20px] font-bold tracking-[-0.025em] text-ink">
            Edit profile
          </h2>
          <div className="mt-4">
            <ProfileForm name={self.name} branch={self.branch} />
          </div>
        </section>
      )}
    </div>
  );
}
