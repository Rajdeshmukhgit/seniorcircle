import { cache } from "react";
import { ArrowLeft, Briefcase, Building2, CalendarDays, Clock3, GraduationCap, MessageSquare, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentSection } from "@/components/experiences/CommentSection";
import { ConnectButton } from "@/components/experiences/ConnectButton";
import { DeletePostButton } from "@/components/experiences/DeletePostButton";
import { InsightPanel } from "@/components/experiences/InsightPanel";
import { ReportButton } from "@/components/experiences/ReportButton";
import { RichText } from "@/components/experiences/RichText";
import { VoteButtons } from "@/components/experiences/VoteButtons";
import { Avatar } from "@/components/ui/Avatar";
import { AuthorBadge, CategoryBadge, VerifiedBadge } from "@/components/ui/Badges";
import { ButtonLink } from "@/components/ui/Button";
import { canDeletePost, canEditPost, canInteract } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";
import { formatDate, plural, readingMinutes } from "@/lib/utils";

interface PageProps {
  params: Promise<{ id: string }>;
}

/** One database read per request, shared by the page and its metadata. */
const loadPost = cache((id: string) => getRepo().getPost(id));

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await loadPost(id);
  return { title: post?.title ?? "Experience" };
}

const metaPill = "shape-cut inline-flex items-center gap-1.5 bg-card border border-line px-3 py-1.5 [--cut:8px] [--r:9px] text-[12.5px] font-medium text-soft";

export default async function ExperiencePage({ params }: PageProps) {
  const { id } = await params;
  const viewer = await requireUser(`/experiences/${id}`);
  const repo = getRepo();
  // Everything this page needs is fetched at the same time rather than one
  // query after another; each extra round trip to the database adds latency.
  const [post, comments, connectRow, reportedRow, myVote] = await Promise.all([
    loadPost(id),
    repo.listComments(id),
    repo.getConnectForPost(viewer.id, id),
    repo.hasReported(viewer.id, id),
    repo.getVote(viewer.id, id).catch(() => 0 as const),
  ]);
  if (!post) notFound();

  const isAuthor = viewer.id === post.author_id;
  const connect = isAuthor ? null : connectRow;
  const reported = isAuthor ? false : reportedRow;
  const firstName = post.author.name.split(" ")[0];
  const edited = post.updated_at.slice(0, 16) !== post.created_at.slice(0, 16);

  return (
    <div className="mx-auto w-full max-w-[820px] px-4 pb-16 pt-24 sm:px-6 md:pt-28">
      <Link
        href="/feed"
        className="glass-strong shape-cut inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-strong transition [--cut:10px] [--r:11px] hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Back to experiences
      </Link>

      <article className="mt-7">
        <header>
          <CategoryBadge category={post.category} />
          <h1 className="mt-3 font-display text-[34px] font-semibold leading-[1.12] tracking-[-0.05em] text-ink sm:text-[44px]">
            {post.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[15px]">
            <span className="inline-flex items-center gap-1.5 font-bold text-ink">
              <Building2 className="h-4 w-4 text-primary-text" aria-hidden />
              {post.company_or_exam}
            </span>
            {post.role && (
              <span className="inline-flex items-center gap-1.5 text-soft">
                <Briefcase className="h-4 w-4 text-primary-text" aria-hidden />
                {post.role}
              </span>
            )}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-hairline py-4">
            <div className="flex items-center gap-3">
              <Avatar name={post.author.name} size="md" />
              <div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Link href={`/profile/${post.author.id}`} className="text-[15px] font-bold text-ink hover:underline">
                    {post.author.name}
                  </Link>
                  <AuthorBadge role={post.author.role} />
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2.5 text-[13px] text-faint">
                  <span>
                    {post.author.branch}, class of {post.author.graduation_year}
                  </span>
                  {post.author.role === "alumni" && <VerifiedBadge status={post.author.verification_status} />}
                </div>
              </div>
            </div>

            {(canEditPost(viewer, post) || canDeletePost(viewer, post)) && (
              <div className="flex items-center gap-2">
                {canEditPost(viewer, post) && (
                  <ButtonLink href={`/experiences/${post.id}/edit`} variant="outline" size="sm">
                    <Pencil className="h-3.5 w-3.5" aria-hidden />
                    Edit
                  </ButtonLink>
                )}
                {canDeletePost(viewer, post) && <DeletePostButton postId={post.id} title={post.title} />}
              </div>
            )}
          </div>

          <ul className="mt-4 flex flex-wrap gap-2">
            <li className={metaPill}>
              <GraduationCap className="h-3.5 w-3.5" aria-hidden />
              {post.branch} {post.graduation_year}
            </li>
            <li className={metaPill}>
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
              {edited && <span>(edited)</span>}
            </li>
            <li className={metaPill}>
              <Clock3 className="h-3.5 w-3.5" aria-hidden />
              {readingMinutes(post.description)} min read
            </li>
            <li>
              <a href="#comments" className={`${metaPill} hover:text-ink`}>
                <MessageSquare className="h-3.5 w-3.5" aria-hidden />
                {plural(post.comment_count, "comment")}
              </a>
            </li>
            <li>
              <VoteButtons
                postId={post.id}
                score={post.score}
                value={myVote}
                canVote={canInteract(viewer) && !isAuthor}
                layout="row"
              />
            </li>
          </ul>
        </header>

        {post.insights && <InsightPanel insights={post.insights} />}

        <div className="mt-9">
          <RichText text={post.description} />
        </div>

        {post.tags.length > 0 && (
          <ul aria-label="Tags" className="mt-8 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li key={tag}>
                <Link
                  href={`/feed?q=${encodeURIComponent(tag)}`}
                  className="shape-cut inline-flex border border-line bg-card px-3 py-1 [--cut:7px] [--r:8px] text-[13px] font-medium text-soft transition hover:border-faint hover:text-ink"
                >
                  #{tag}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </article>

      {!isAuthor && (
        <aside aria-label="Connect with the author" className="mt-10 rounded-card border border-line bg-card p-[22px]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-md">
              <h2 className="font-display text-[19px] font-bold tracking-[-0.025em] text-ink">
                Want to ask {firstName} something directly?
              </h2>
              <p className="mt-1 text-[14.5px] leading-relaxed text-soft">
                Send a connect request. If {firstName} accepts, you will each see the other&apos;s email.
              </p>
            </div>
            <div className="shrink-0">
              {canInteract(viewer) ? (
                <ConnectButton
                  postId={post.id}
                  authorFirstName={firstName}
                  status={connect?.status ?? null}
                  contactEmail={connect?.contact_email ?? null}
                />
              ) : (
                <p className="max-w-[240px] text-[13.5px] text-soft">
                  Connecting opens once an administrator verifies your alumni account.
                </p>
              )}
            </div>
          </div>
        </aside>
      )}

      <div className="mt-12">
        <CommentSection postId={post.id} postAuthorId={post.author_id} comments={comments} viewer={viewer} />
      </div>

      {!isAuthor && canInteract(viewer) && (
        <div className="mt-10 border-t border-hairline pt-5">
          <ReportButton postId={post.id} alreadyReported={reported} />
        </div>
      )}
    </div>
  );
}
