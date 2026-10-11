import { MessageSquare, Trash2 } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { AuthorBadge } from "@/components/ui/Badges";
import { deleteComment } from "@/lib/actions/comments";
import { canInteract, isAdmin } from "@/lib/auth/permissions";
import { plural, timeAgo } from "@/lib/utils";
import type { Comment, Profile } from "@/types";
import { CommentForm } from "./CommentForm";

interface CommentSectionProps {
  postId: string;
  postAuthorId: string;
  comments: Comment[];
  viewer: Profile;
}

export function CommentSection({ postId, postAuthorId, comments, viewer }: CommentSectionProps) {
  return (
    <section id="comments" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="flex items-center gap-2 font-display text-[22px] font-semibold tracking-[-0.03em] text-ink">
        <MessageSquare className="h-5 w-5 text-primary-text" aria-hidden />
        {comments.length === 0 ? "Comments" : plural(comments.length, "comment")}
      </h2>

      <div className="mt-5">
        {canInteract(viewer) ? (
          <CommentForm postId={postId} />
        ) : (
          <p className="shape-cut border border-line bg-tint [--cut:12px] [--r:12px] px-4 py-3 text-[14px] text-soft">
            You can comment once an administrator verifies your alumni account.
          </p>
        )}
      </div>

      {comments.length === 0 ? (
        <p className="mt-6 text-[14.5px] text-soft">No comments yet. Ask the first question.</p>
      ) : (
        <ol className="mt-6 divide-y divide-hairline border-t border-hairline">
          {comments.map((comment) => (
            <li key={comment.id} className="flex gap-3 py-4">
              <Avatar name={comment.author.name} size="sm" className="mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Link href={`/profile/${comment.author.id}`} className="text-[14px] font-semibold text-ink hover:underline">
                    {comment.author.name}
                  </Link>
                  <AuthorBadge role={comment.author.role} />
                  {comment.author_id === postAuthorId && (
                    <span className="rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold leading-none text-primary-text">
                      Author
                    </span>
                  )}
                  <time dateTime={comment.created_at} className="text-[12.5px] text-faint">
                    {timeAgo(comment.created_at)}
                  </time>
                  {(comment.author_id === viewer.id || isAdmin(viewer)) && (
                    <form action={deleteComment} className="ml-auto">
                      <input suppressHydrationWarning type="hidden" name="id" value={comment.id} />
                      <button suppressHydrationWarning
                        type="submit"
                        aria-label="Delete comment"
                        className="flex h-7 w-7 items-center justify-center rounded-lg text-faint hover:bg-tint hover:text-danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    </form>
                  )}
                </div>
                <p className="mt-1 whitespace-pre-line break-words text-[15px] leading-relaxed text-strong">{comment.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
