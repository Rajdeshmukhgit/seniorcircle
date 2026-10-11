"use client";

import { Check, Clock3, UserPlus, X } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { sendConnect } from "@/lib/actions/connect";
import type { ActionState, ConnectStatus } from "@/types";

interface ConnectButtonProps {
  postId: string;
  authorFirstName: string;
  /** The viewer's existing request for this experience, if any. */
  status: ConnectStatus | null;
  contactEmail: string | null;
}

const initial: ActionState = { ok: false };
const note = "flex items-center gap-2 text-[14px] font-semibold";

export function ConnectButton({ postId, authorFirstName, status, contactEmail }: ConnectButtonProps) {
  const [state, action] = useActionState(sendConnect, initial);
  const current: ConnectStatus | null = status ?? (state.ok ? "pending" : null);

  if (current === "accepted") {
    return (
      <div>
        <p className={`${note} text-success`}>
          <Check className="h-4 w-4" aria-hidden />
          You are connected with {authorFirstName}
        </p>
        {contactEmail && (
          <p className="mt-1.5 text-[14px] text-soft">
            Reach out at{" "}
            <a href={`mailto:${contactEmail}`} className="font-semibold text-primary-text hover:underline">
              {contactEmail}
            </a>
          </p>
        )}
      </div>
    );
  }

  if (current === "pending") {
    return (
      <div>
        <p className={`${note} text-strong`}>
          <Clock3 className="h-4 w-4" aria-hidden />
          Request sent
        </p>
        <p className="mt-1.5 text-[14px] text-soft">
          {authorFirstName} will see it in their notifications. Track it under{" "}
          <Link href="/connections" className="font-semibold text-primary-text hover:underline">
            Connections
          </Link>
          .
        </p>
      </div>
    );
  }

  if (current === "declined") {
    return (
      <p className={`${note} text-soft`}>
        <X className="h-4 w-4" aria-hidden />
        {authorFirstName} declined your request
      </p>
    );
  }

  return (
    <form action={action}>
      <input suppressHydrationWarning type="hidden" name="post_id" value={postId} />
      <SubmitButton variant="solid" pendingLabel="Sending">
        <UserPlus className="h-4 w-4" aria-hidden />
        Connect
      </SubmitButton>
      {state.message && !state.ok && (
        <p role="alert" className="mt-2 text-[13px] text-danger">
          {state.message}
        </p>
      )}
    </form>
  );
}
