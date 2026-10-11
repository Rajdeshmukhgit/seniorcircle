import { BadgeCheck, MessageSquare, ShieldAlert, UserCheck, UserPlus, UserX, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { markNotificationRead } from "@/lib/actions/notifications";
import { cn, timeAgo } from "@/lib/utils";
import type { Notification, NotificationType } from "@/types";

const icons: Record<NotificationType, LucideIcon> = {
  comment: MessageSquare,
  connect_request: UserPlus,
  connect_accepted: UserCheck,
  connect_declined: UserX,
  verification_approved: BadgeCheck,
  verification_rejected: ShieldAlert,
};

/** Where a notification leads when opened. */
function targetFor(notification: Notification): string {
  switch (notification.type) {
    case "comment":
      return notification.reference_id ? `/experiences/${notification.reference_id}#comments` : "/feed";
    case "connect_request":
    case "connect_accepted":
    case "connect_declined":
      return "/connections";
    default:
      return "/profile";
  }
}

export function NotificationItem({ notification }: { notification: Notification }) {
  const Icon = icons[notification.type];
  const unread = !notification.is_read;

  return (
    <li className={cn("flex items-start gap-3 px-4 py-3.5 sm:px-5", unread && "bg-primary/[0.06]")}>
      <span
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          unread ? "bg-primary/10 text-primary-text" : "bg-tint text-faint",
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <Link href={targetFor(notification)} className={cn("text-[14.5px] leading-snug hover:underline", unread ? "font-semibold text-ink" : "text-soft")}>
          {notification.message}
        </Link>
        <time dateTime={notification.created_at} className="mt-0.5 block text-[12.5px] text-faint">
          {timeAgo(notification.created_at)}
        </time>
      </div>
      {unread && (
        <form action={markNotificationRead} className="shrink-0">
          <input suppressHydrationWarning type="hidden" name="id" value={notification.id} />
          <button suppressHydrationWarning type="submit" className="rounded-lg px-2 py-1 text-[12.5px] font-semibold text-primary-text hover:bg-primary/10">
            Mark as read
          </button>
        </form>
      )}
    </li>
  );
}
