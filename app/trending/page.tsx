import { Flame, PenLine } from "lucide-react";
import type { Metadata } from "next";
import { FeedCard } from "@/components/experiences/FeedCard";
import { VoteButtons } from "@/components/experiences/VoteButtons";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { canInteract, canPost } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";
import type { RankedPost } from "@/types";

export const metadata: Metadata = { title: "Trending" };
export const dynamic = "force-dynamic";

const LIMIT = 40;

export default async function TrendingPage() {
  const user = await requireUser("/trending");

  let posts: RankedPost[] = [];
  try {
    posts = await getRepo().listTrending(user.id, LIMIT);
  } catch {
    // An empty page is better than a crash; the empty state below explains it.
  }

  const voter = canInteract(user);

  return (
    <div className="mx-auto w-full max-w-[820px] px-4 pb-16 pt-24 sm:px-6 md:pt-28">
      <header>
        <h1 className="font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.05em] text-ink sm:text-[46px]">
          Trending
        </h1>
        <p className="mt-2 text-[15.5px] text-soft">
          What juniors are finding most useful right now. Ranked by votes and how recent an experience is, so a new
          write-up is not buried under an old one.
        </p>
      </header>

      {!voter && (
        <p className="mt-6 rounded-card border border-line bg-card [--cut:20px] [--r:16px] px-4 py-3.5 text-[14px] text-soft">
          Your account is waiting for verification, so you can read the ranking but not vote on it yet.
        </p>
      )}

      <div className="mt-7 space-y-3">
        {posts.length === 0 ? (
          <EmptyState
            icon={Flame}
            title="Nothing to rank yet"
            description="Once experiences are shared and members start voting, the most useful ones rise to the top here."
            action={
              canPost(user) ? (
                <ButtonLink href="/experiences/new" variant="solid">
                  <PenLine className="h-4 w-4" aria-hidden />
                  Share Your Experience
                </ButtonLink>
              ) : undefined
            }
          />
        ) : (
          posts.map((post, index) => (
            <div key={post.id} className="flex items-start gap-2 sm:gap-3">
              <div className="flex shrink-0 flex-col items-center gap-1 pt-3.5">
                <span className="font-mono text-[11.5px] tabular-nums text-faint">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <VoteButtons
                  postId={post.id}
                  score={post.score}
                  value={post.my_vote}
                  canVote={voter && post.author_id !== user.id}
                />
              </div>
              <div className="min-w-0 flex-1">
                <FeedCard post={post} />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
