import { Sparkles, Wand2 } from "lucide-react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { backfillEnrichment } from "@/lib/actions/enrich";
import { aiConfig } from "@/lib/ai/config";

interface EnrichmentPanelProps {
  /** Experiences with no embedding or no insights yet. */
  pending: number;
  /** False when neither model has a key, so nothing can be enriched. */
  configured: boolean;
}

/**
 * Runs the enrichment pipeline over experiences written before it existed.
 * Everything posted from now on is enriched as it is saved.
 */
export function EnrichmentPanel({ pending, configured }: EnrichmentPanelProps) {
  if (!configured) {
    return (
      <p className="rounded-card border border-line bg-card [--cut:20px] [--r:16px] px-4 py-3.5 text-[14px] text-soft">
        No model key is set, so experiences cannot be embedded or read. Add <code className="font-mono text-[13px]">GEMINI_API_KEY</code> to{" "}
        <code className="font-mono text-[13px]">.env.local</code> and restart the server.
      </p>
    );
  }

  if (pending === 0) {
    return (
      <p className="inline-flex items-center gap-2 rounded-card border border-line bg-card [--cut:20px] [--r:16px] px-4 py-3.5 text-[14px] text-soft">
        <Sparkles className="h-4 w-4 text-faint" aria-hidden />
        Every experience has been embedded and read.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-card border border-line bg-card [--cut:20px] [--r:16px] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-[14px] text-soft">
        <span className="font-semibold text-ink">{pending}</span>{" "}
        {pending === 1 ? "experience is" : "experiences are"} waiting to be embedded and read.
      </p>
      <form action={backfillEnrichment}>
        <SubmitButton variant="solid" size="sm" pendingLabel="Reading…">
          <Wand2 className="h-3.5 w-3.5" aria-hidden />
          Process {Math.min(pending, aiConfig.backfillBatch)}
        </SubmitButton>
      </form>
    </div>
  );
}
