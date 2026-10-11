import { CheckCircle2, CircleDashed, Layers, ListChecks, Sparkles, Target, Timer, XCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Outcome, PostInsights } from "@/types";

/**
 * The structure a model read out of the write-up (lib/ai/extract.ts), shown
 * above the prose so a reader can see the shape of the process before reading
 * it. Labelled as machine-read, because it is: the write-up itself is the
 * source of truth and sits right below.
 */

const OUTCOME: Record<Outcome, { label: string; icon: typeof CheckCircle2 }> = {
  selected: { label: "Selected", icon: CheckCircle2 },
  rejected: { label: "Not selected", icon: XCircle },
  in_progress: { label: "Still in progress", icon: CircleDashed },
  unknown: { label: "Outcome not stated", icon: CircleDashed },
};

const stat = "shape-cut inline-flex items-center gap-1.5 bg-card border border-line px-3 py-1.5 [--cut:8px] [--r:9px] text-[12.5px] font-medium text-soft";

function Difficulty({ level }: { level: number }) {
  return (
    <span className={stat}>
      <Target className="h-3.5 w-3.5" aria-hidden />
      <span className="sr-only">Difficulty </span>
      <span className="flex items-center gap-[3px]" aria-hidden>
        {[1, 2, 3, 4, 5].map((step) => (
          <span
            key={step}
            className={cn("h-1.5 w-1.5 rounded-full", step <= level ? "bg-primary-text" : "bg-faint/40")}
          />
        ))}
      </span>
      {level}/5
    </span>
  );
}

export function InsightPanel({ insights }: { insights: PostInsights }) {
  const outcome = OUTCOME[insights.outcome];
  const hasBody = insights.rounds.length > 0 || insights.topics.length > 0 || insights.preparation.length > 0;
  if (!insights.summary && !hasBody && insights.difficulty === null) return null;

  return (
    <section aria-labelledby="at-a-glance" className="mt-8 rounded-card border border-line bg-card p-[22px]">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary-text" aria-hidden />
        <h2 id="at-a-glance" className="font-display text-[17px] font-bold tracking-[-0.025em] text-ink">
          At a glance
        </h2>
        <span className="ml-auto text-[11.5px] text-faint">Read from the write-up below</span>
      </div>

      {insights.summary && <p className="mt-3 text-[15px] leading-relaxed text-soft">{insights.summary}</p>}

      <ul className="mt-4 flex flex-wrap gap-2">
        {insights.rounds.length > 0 && (
          <li className={stat}>
            <Layers className="h-3.5 w-3.5" aria-hidden />
            {insights.rounds.length} {insights.rounds.length === 1 ? "round" : "rounds"}
          </li>
        )}
        {insights.difficulty !== null && (
          <li>
            <Difficulty level={insights.difficulty} />
          </li>
        )}
        {insights.duration_weeks !== null && (
          <li className={stat}>
            <Timer className="h-3.5 w-3.5" aria-hidden />
            {insights.duration_weeks} {insights.duration_weeks === 1 ? "week" : "weeks"} of prep
          </li>
        )}
        <li className={stat}>
          <outcome.icon className="h-3.5 w-3.5" aria-hidden />
          {outcome.label}
        </li>
      </ul>

      {insights.rounds.length > 0 && (
        <ol className="mt-5 space-y-2.5 border-t border-hairline pt-4">
          {insights.rounds.map((round, index) => (
            <li key={`${round.name}-${index}`} className="flex gap-3">
              <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-tint font-mono text-[11px] font-bold text-soft">
                {index + 1}
              </span>
              <div className="min-w-0">
                <div className="text-[14.5px] font-semibold text-ink">{round.name}</div>
                {round.focus && <div className="mt-0.5 text-[13.5px] leading-relaxed text-soft">{round.focus}</div>}
              </div>
            </li>
          ))}
        </ol>
      )}

      {insights.topics.length > 0 && (
        <div className="mt-5 border-t border-hairline pt-4">
          <h3 className="text-[12.5px] font-bold uppercase tracking-wide text-faint">What was asked</h3>
          <ul className="mt-2.5 flex flex-wrap gap-2">
            {insights.topics.map((topic) => (
              <li key={topic}>
                <Link
                  href={`/feed?q=${encodeURIComponent(topic)}`}
                  className="shape-cut inline-flex border border-line bg-card px-3 py-1 [--cut:7px] [--r:8px] text-[13px] font-medium text-soft transition hover:border-faint hover:text-ink"
                >
                  {topic}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {insights.preparation.length > 0 && (
        <div className="mt-5 border-t border-hairline pt-4">
          <h3 className="inline-flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-wide text-faint">
            <ListChecks className="h-3.5 w-3.5" aria-hidden />
            Advice from the author
          </h3>
          <ul className="mt-2.5 space-y-1.5">
            {insights.preparation.map((tip, index) => (
              <li key={index} className="flex gap-2 text-[14px] leading-relaxed text-soft">
                <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-faint" aria-hidden />
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
