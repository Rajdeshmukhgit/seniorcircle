"use client";

import { ArrowBigDown, ArrowBigUp } from "lucide-react";
import { useFormStatus } from "react-dom";
import { castVote } from "@/lib/actions/votes";
import { cn } from "@/lib/utils";
import type { VoteValue } from "@/types";

/**
 * One score and two arrows. The number is the net score: upvotes minus
 * downvotes, never the two separately. Downvotes count towards ranking but are
 * not shown to members -- showing both would let anyone subtract one from the
 * other, which is the thing we are trying not to publish.
 */
interface VoteButtonsProps {
  postId: string;
  score: number;
  /** The viewer's own vote: 1, -1, or 0 when they have not voted. */
  value: VoteValue;
  /** False for a junior awaiting verification, or on your own experience. */
  canVote?: boolean;
  layout?: "column" | "row";
}

function Arrow({ direction, active, disabled }: { direction: "up" | "down"; active: boolean; disabled: boolean }) {
  const { pending } = useFormStatus();
  const Icon = direction === "up" ? ArrowBigUp : ArrowBigDown;
  const label = active
    ? `Take back your ${direction === "up" ? "upvote" : "downvote"}`
    : direction === "up"
      ? "Upvote this experience"
      : "Downvote this experience";

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "grid h-7 w-7 place-items-center rounded-md transition",
        active ? "text-primary-text" : "text-faint",
        disabled ? "cursor-not-allowed opacity-40" : "hover:bg-tint hover:text-ink",
        pending && "opacity-60",
      )}
    >
      <Icon className={cn("h-[18px] w-[18px]", active && "fill-current")} aria-hidden />
    </button>
  );
}

export function VoteButtons({ postId, score, value, canVote = true, layout = "column" }: VoteButtonsProps) {
  // Pressing the arrow you already chose withdraws the vote.
  const form = (direction: "up" | "down") => {
    const mine = direction === "up" ? 1 : -1;
    const next = value === mine ? 0 : mine;
    return (
      <form action={castVote}>
        <input suppressHydrationWarning type="hidden" name="postId" value={postId} />
        <input suppressHydrationWarning type="hidden" name="value" value={next} />
        <Arrow direction={direction} active={value === mine} disabled={!canVote} />
      </form>
    );
  };

  return (
    <div
      className={cn(
        "flex items-center gap-0.5",
        layout === "column" ? "w-9 flex-col" : "flex-row rounded-lg border border-line bg-card px-1 py-0.5",
      )}
    >
      {form("up")}
      <span
        className={cn(
          "select-none text-center text-[13px] font-bold tabular-nums",
          value !== 0 ? "text-primary-text" : "text-soft",
        )}
        aria-live="polite"
      >
        {score}
      </span>
      {form("down")}
    </div>
  );
}
