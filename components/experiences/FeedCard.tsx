import { Briefcase, Building2, GraduationCap, Layers, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { AuthorBadge, CategoryBadge } from "@/components/ui/Badges";
import { BRANCH_SHORT } from "@/lib/constants/options";
import { excerpt, plural, timeAgo } from "@/lib/utils";
import type { Post } from "@/types";

const chip = "shape-cut inline-flex items-center gap-1 bg-tint px-2 py-0.5 text-[11px] font-medium text-soft [--cut:5px] [--r:6px]";

/** The list card used in the feed and on profiles. The whole card is one link. */
export function FeedCard({ post }: { post: Post }) {
  return (
    <article className="group relative rounded-card border border-line bg-card px-4 py-4 transition duration-200 [--cut:20px] [--r:16px] hover:border-primary/30 hover:shadow-float sm:px-6 sm:py-5">
      <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-faint">
        <Avatar name={post.author.name} size="xs" />
        <span className="inline-flex items-center gap-1 font-semibold text-strong">
          <Building2 className="h-3.5 w-3.5 text-faint" aria-hidden />
          {post.company_or_exam}
        </span>
        <span aria-hidden>•</span>
        <span className="truncate">{post.author.name}</span>
        <AuthorBadge role={post.author.role} />
        <span aria-hidden>•</span>
        <time dateTime={post.created_at} className="whitespace-nowrap">
          {timeAgo(post.created_at)}
        </time>
      </div>

      <h2 className="mt-2.5 font-display text-[18px] font-semibold leading-snug tracking-[-0.025em] text-ink transition-colors group-hover:text-primary-text">
        <Link href={`/experiences/${post.id}`} className="after:absolute after:inset-0 after:rounded-[16px]">
          {post.title}
        </Link>
      </h2>
      <p className="mt-1 line-clamp-3 text-sm leading-relaxed text-soft">{excerpt(post.description, 260)}</p>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <CategoryBadge category={post.category} className="px-2 py-1" />
        {post.role && (
          <span className={chip}>
            <Briefcase className="h-3 w-3" aria-hidden />
            {post.role}
          </span>
        )}
        <span className={chip}>
          <GraduationCap className="h-3 w-3" aria-hidden />
          {BRANCH_SHORT[post.branch] ?? post.branch} · {post.graduation_year}
        </span>
        {post.round_count !== null && post.round_count > 0 && (
          <span className={chip}>
            <Layers className="h-3 w-3" aria-hidden />
            {post.round_count} {post.round_count === 1 ? "round" : "rounds"}
          </span>
        )}
        {/* Topics are read out of the write-up; tags are the author's own.
            Prefer the topics when they exist, since they say what was asked. */}
        {(post.topics.length > 0 ? post.topics : post.tags).slice(0, 3).map((label) => (
          <span key={label} className={chip}>
            {post.topics.length > 0 ? label : `#${label}`}
          </span>
        ))}
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-faint">
          <MessageSquare className="h-3.5 w-3.5" aria-hidden />
          {plural(post.comment_count, "comment")}
        </span>
      </div>
    </article>
  );
}
