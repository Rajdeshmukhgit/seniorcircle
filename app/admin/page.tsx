import type { Metadata } from "next";
import { EnrichmentPanel } from "@/components/admin/EnrichmentPanel";
import { FlaggedPosts } from "@/components/admin/FlaggedPosts";
import { VerificationQueue } from "@/components/admin/VerificationQueue";
import { VoteSplit } from "@/components/admin/VoteSplit";
import { isAiConfigured } from "@/lib/ai/config";
import { requireAdmin } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Admin Dashboard" };

const sectionHeading = "font-display text-[20px] font-bold tracking-[-0.025em] text-ink";

export default async function AdminPage() {
  await requireAdmin();
  const repo = getRepo();
  const [alumni, reports, stats, pending, votes] = await Promise.all([
    repo.listPendingAlumni(),
    repo.listOpenReports(),
    repo.stats(),
    repo.listPostsNeedingEnrichment(200).catch(() => [] as string[]),
    repo.listVoteBreakdown(50).catch(() => []),
  ]);

  const tiles = [
    { label: "Members", value: stats.users },
    { label: "Verified alumni", value: stats.verifiedAlumni },
    { label: "Experiences", value: stats.experiences },
    { label: "Connect requests", value: stats.connectRequests },
  ];

  return (
    <div className="container-site pb-16 pt-24 md:pt-28">
      <h1 className="font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.05em] text-ink sm:text-[46px]">Admin Dashboard</h1>
      <p className="mt-2 text-[15.5px] text-soft">Verify alumni and review posts that members have flagged.</p>

      <dl className="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-card border border-line bg-card [--cut:20px] [--r:16px] px-4 py-3.5">
            <dt className="text-[13px] text-faint">{tile.label}</dt>
            <dd className="mt-0.5 font-display text-[24px] font-bold leading-tight tabular-nums text-ink">{tile.value}</dd>
          </div>
        ))}
      </dl>

      <section aria-labelledby="verification" className="mt-10">
        <h2 id="verification" className={sectionHeading}>
          Verification Requests{alumni.length > 0 ? ` (${alumni.length})` : ""}
        </h2>
        <p className="mt-1 text-[14px] text-soft">
          Approve alumni you can confirm graduated from the college. Rejected accounts stay read-only.
        </p>
        <div className="mt-4">
          <VerificationQueue alumni={alumni} />
        </div>
      </section>

      <section aria-labelledby="enrichment" className="mt-10">
        <h2 id="enrichment" className={sectionHeading}>
          Search &amp; Insights
        </h2>
        <p className="mt-1 text-[14px] text-soft">
          Each experience is embedded for semantic search and read for its rounds, topics and difficulty. New posts are
          processed as they are written; this catches up on older ones.
        </p>
        <div className="mt-4">
          <EnrichmentPanel pending={pending.length} configured={isAiConfigured} />
        </div>
      </section>

      <section aria-labelledby="votes" className="mt-10">
        <h2 id="votes" className={sectionHeading}>
          Vote Split
        </h2>
        <p className="mt-1 text-[14px] text-soft">
          Members see only the net score. Downvotes are shown here so a write-up being quietly buried does not go
          unnoticed.
        </p>
        <div className="mt-4">
          <VoteSplit rows={votes} />
        </div>
      </section>

      <section aria-labelledby="flagged" className="mt-10">
        <h2 id="flagged" className={sectionHeading}>
          Flagged Posts{reports.length > 0 ? ` (${reports.length})` : ""}
        </h2>
        <p className="mt-1 text-[14px] text-soft">Removing a post deletes it for everyone. Dismissing keeps the post and closes the report.</p>
        <div className="mt-4">
          <FlaggedPosts reports={reports} />
        </div>
      </section>
    </div>
  );
}
