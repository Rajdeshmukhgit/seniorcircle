import { Check, Mail, X } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { AuthorBadge, StatusPill } from "@/components/ui/Badges";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { respondConnect } from "@/lib/actions/connect";
import { timeAgo } from "@/lib/utils";
import type { ConnectRequest } from "@/types";

interface RequestCardProps {
  request: ConnectRequest;
  /** "incoming": someone asked the viewer. "outgoing": the viewer asked someone. */
  direction: "incoming" | "outgoing";
  canRespond: boolean;
}

const statusTone = { pending: "neutral", accepted: "success", declined: "danger" } as const;
const statusLabel = { pending: "Pending", accepted: "Accepted", declined: "Declined" } as const;

export function RequestCard({ request, direction, canRespond }: RequestCardProps) {
  const other = direction === "incoming" ? request.requester : request.recipient;

  return (
    <li className="rounded-card border border-line bg-card [--cut:20px] [--r:16px] px-4 py-4 sm:px-5">
      <div className="flex items-start gap-3">
        <Avatar name={other.name} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link href={`/profile/${other.id}`} className="text-[15px] font-bold text-ink hover:underline">
              {other.name}
            </Link>
            <AuthorBadge role={other.role} />
            <StatusPill tone={statusTone[request.status]}>{statusLabel[request.status]}</StatusPill>
          </div>
          <p className="mt-0.5 text-[13px] text-faint">
            {other.branch}, class of {other.graduation_year} · {timeAgo(request.created_at)}
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-soft">
            {direction === "incoming" ? "Wants to connect about " : "You asked to connect about "}
            <Link href={`/experiences/${request.post_id}`} className="font-semibold text-strong hover:underline">
              {request.post_title}
            </Link>
          </p>

          {request.status === "accepted" && request.contact_email && (
            <a
              href={`mailto:${request.contact_email}`}
              className="mt-3 inline-flex items-center gap-2 shape-cut bg-primary/10 [--cut:8px] [--r:9px] px-3 py-1.5 text-[13.5px] font-semibold text-primary-text hover:bg-primary/15"
            >
              <Mail className="h-4 w-4" aria-hidden />
              <span className="break-all">{request.contact_email}</span>
            </a>
          )}

          {direction === "incoming" && request.status === "pending" && canRespond && (
            <div className="mt-3.5 flex flex-wrap gap-2">
              <form action={respondConnect}>
                <input suppressHydrationWarning type="hidden" name="id" value={request.id} />
                <input suppressHydrationWarning type="hidden" name="status" value="accepted" />
                <SubmitButton variant="solid" size="sm">
                  <Check className="h-3.5 w-3.5" aria-hidden />
                  Accept
                </SubmitButton>
              </form>
              <form action={respondConnect}>
                <input suppressHydrationWarning type="hidden" name="id" value={request.id} />
                <input suppressHydrationWarning type="hidden" name="status" value="declined" />
                <SubmitButton variant="outline" size="sm">
                  <X className="h-3.5 w-3.5" aria-hidden />
                  Decline
                </SubmitButton>
              </form>
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
