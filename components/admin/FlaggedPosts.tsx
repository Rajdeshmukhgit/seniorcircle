import { ExternalLink, ShieldCheck, Trash2 } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { dismissReport, removeReportedPost } from "@/lib/actions/admin";
import { timeAgo } from "@/lib/utils";
import type { PostReport } from "@/types";

export function FlaggedPosts({ reports }: { reports: PostReport[] }) {
  if (reports.length === 0) {
    return <EmptyState icon={ShieldCheck} title="No flagged posts" description="Posts reported by members appear here for review." />;
  }

  return (
    <ul className="space-y-3">
      {reports.map((report) => (
        <li key={report.id} className="rounded-card border border-line bg-card [--cut:20px] [--r:16px] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h3 className="text-[15.5px] font-bold leading-snug text-ink">{report.post_title}</h3>
              <p className="mt-0.5 text-[13px] text-faint">
                By {report.post_author_name} · reported by {report.reporter_name}, {timeAgo(report.created_at)}
              </p>
              <blockquote className="mt-2.5 border-l-2 border-line pl-3 text-[14px] leading-relaxed text-soft">{report.reason}</blockquote>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <ButtonLink href={`/experiences/${report.post_id}`} variant="outline" size="sm">
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                View Post
              </ButtonLink>
              <form action={dismissReport}>
                <input suppressHydrationWarning type="hidden" name="id" value={report.id} />
                <SubmitButton variant="outline" size="sm">
                  Dismiss Flag
                </SubmitButton>
              </form>
              <form action={removeReportedPost}>
                <input suppressHydrationWarning type="hidden" name="post_id" value={report.post_id} />
                <SubmitButton variant="danger" size="sm">
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Remove
                </SubmitButton>
              </form>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
