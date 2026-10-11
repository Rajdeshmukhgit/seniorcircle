import { ArrowBigDown, ArrowBigUp, Scale } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/EmptyState";
import type { VoteBreakdown } from "@/types";

const th = "px-4 py-2.5 text-left text-[12.5px] font-bold text-faint";
const td = "px-4 py-3 align-middle text-[14px] text-soft";

/**
 * The only place downvotes are ever shown. Members see one number, the net
 * score, and cannot derive the split from it; administrators see both, so a
 * write-up quietly being buried is visible to somebody.
 */
export function VoteSplit({ rows }: { rows: VoteBreakdown[] }) {
  if (rows.length === 0) {
    return <EmptyState icon={Scale} title="Nothing has been voted on yet" description="Experiences appear here once members start voting." />;
  }

  return (
    <div className="overflow-hidden rounded-card border border-line bg-card [--cut:20px] [--r:16px]">
      <table className="w-full border-collapse">
        <thead className="border-b border-line bg-tint">
          <tr>
            <th scope="col" className={th}>Experience</th>
            <th scope="col" className={`${th} text-right`}>Up</th>
            <th scope="col" className={`${th} text-right`}>Down</th>
            <th scope="col" className={`${th} text-right`}>Net</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-hairline">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className={td}>
                <Link href={`/experiences/${row.id}`} className="font-semibold text-ink hover:text-primary-text">
                  {row.title}
                </Link>
                <div className="text-[12.5px] text-faint">{row.company_or_exam}</div>
              </td>
              <td className={`${td} text-right tabular-nums`}>
                <span className="inline-flex items-center gap-1">
                  <ArrowBigUp className="h-3.5 w-3.5 text-faint" aria-hidden />
                  {row.upvotes}
                </span>
              </td>
              <td className={`${td} text-right tabular-nums`}>
                <span className={row.downvotes > 0 ? "inline-flex items-center gap-1 font-semibold text-ink" : "inline-flex items-center gap-1"}>
                  <ArrowBigDown className="h-3.5 w-3.5 text-faint" aria-hidden />
                  {row.downvotes}
                </span>
              </td>
              <td className={`${td} text-right font-semibold tabular-nums text-ink`}>
                {row.score > 0 ? `+${row.score}` : row.score}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
