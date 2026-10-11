import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { plural } from "@/lib/utils";
import type { PostPreview } from "@/types";

/** The fixed-width card used in the "Most Helpful" row, with its rank. */
export function RankedCard({ post, rank }: { post: PostPreview; rank: number }) {
  return (
    <Link href={`/experiences/${post.id}`} className="block w-[300px] shrink-0 snap-start rounded-card">
      <article className="group flex h-full flex-col rounded-card border border-line bg-card p-[22px] transition duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-float">
        <div className="flex items-start justify-between gap-2.5">
          <span className="font-display text-[44px] font-semibold leading-none tracking-[-0.06em] text-primary-text/90">
            {String(rank).padStart(2, "0")}
          </span>
          <span className="font-mono text-[11.5px] text-faint">{plural(post.comment_count, "comment")}</span>
        </div>
        <h3 className="mt-5 line-clamp-2 font-display text-[19px] font-semibold leading-[1.2] tracking-[-0.035em] text-ink transition-colors group-hover:text-primary-text">
          {post.title}
        </h3>
        <p className="mt-3 line-clamp-2 flex-1 text-[14.5px] leading-[1.58] text-soft">{post.excerpt}</p>
        <div className="mt-5 flex items-center gap-2.5 border-t border-hairline pt-[15px]">
          <Avatar name={post.author_name} tone="neutral" />
          <div className="min-w-0">
            <div className="truncate text-[13.5px] font-semibold text-strong">{post.author_name}</div>
            <div className="truncate text-[12px] text-faint">
              {post.company_or_exam} · {post.graduation_year}
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
