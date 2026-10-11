import { CalendarDays, GraduationCap } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { AuthorBadge, VerifiedBadge } from "@/components/ui/Badges";
import { formatDate } from "@/lib/utils";
import type { PublicProfile } from "@/types";

interface ProfileHeaderProps {
  profile: PublicProfile;
  /** Shown only on your own profile. */
  email?: string;
  stats: { posts: number; comments: number };
}

export function ProfileHeader({ profile, email, stats }: ProfileHeaderProps) {
  return (
    <header className="flex flex-col gap-5 border-b border-hairline pb-7 sm:flex-row sm:items-center">
      <Avatar name={profile.name} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
          <h1 className="font-display text-[28px] font-semibold leading-tight tracking-[-0.035em] text-ink">{profile.name}</h1>
          <AuthorBadge role={profile.role} className="px-2 py-1 text-[12px]" />
          {profile.role === "alumni" && <VerifiedBadge status={profile.verification_status} />}
        </div>
        {email && <p className="mt-1 truncate text-[14px] text-faint">{email}</p>}
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-[14px] text-soft">
          <li className="inline-flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-faint" aria-hidden />
            {profile.branch}, class of {profile.graduation_year}
          </li>
          <li className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4 text-faint" aria-hidden />
            Joined {formatDate(profile.created_at)}
          </li>
        </ul>
      </div>
      <dl className="flex gap-6 sm:text-right">
        <div>
          <dt className="text-[12.5px] text-faint">Experiences</dt>
          <dd className="font-display text-[22px] font-bold leading-tight text-ink">{stats.posts}</dd>
        </div>
        <div>
          <dt className="text-[12.5px] text-faint">Comments</dt>
          <dd className="font-display text-[22px] font-bold leading-tight text-ink">{stats.comments}</dd>
        </div>
      </dl>
    </header>
  );
}
