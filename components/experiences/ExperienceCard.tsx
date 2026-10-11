import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { CategoryBadge } from "@/components/ui/Badges";
import { BRANCH_SHORT, ROLE_LABEL } from "@/lib/constants/options";
import { formatDate } from "@/lib/utils";
import type { PostPreview } from "@/types";

/** The grid card used for featured experiences on the homepage. */
export function ExperienceCard({ post }: { post: PostPreview }) {
  return (
    <Link href={`/experiences/${post.id}`} className="block rounded-card">
      <article className="group flex h-full flex-col rounded-card border border-line bg-card p-[22px] transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-float">
        <div className="flex items-center justify-between gap-2.5">
          <span className="meta-mono truncate">
            {post.graduation_year} · {BRANCH_SHORT[post.branch] ?? post.branch}
          </span>
          <CategoryBadge category={post.category} />
        </div>

        <h3 className="mt-5 line-clamp-2 font-display text-[20px] font-semibold leading-[1.18] tracking-[-0.035em] text-ink transition-colors group-hover:text-primary-text">
          {post.title}
        </h3>
        <div className="mt-1.5 truncate text-[13.5px] text-faint">
          {post.company_or_exam}
          {post.role ? ` · ${post.role}` : ""}
        </div>

        <p className="mt-3.5 line-clamp-3 flex-1 text-[14.5px] leading-[1.58] text-soft">{post.excerpt}</p>

        <div className="mt-5 flex items-center gap-2.5 border-t border-hairline pt-[15px]">
          <Avatar name={post.author_name} tone="neutral" />
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-semibold text-strong">{post.author_name}</div>
            <div className="truncate text-[12px] text-faint">
              {ROLE_LABEL[post.author_role]} · <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
