import { Bell } from "lucide-react";
import Link from "next/link";

/** Bell with an unread count. Opens the notifications page. */
export function NotificationBell({ unread }: { unread: number }) {
  return (
    <Link
      href="/notifications"
      aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
      className="glass-strong shape-cut relative flex h-9 w-9 shrink-0 items-center justify-center text-soft transition [--cut:9px] [--r:10px] hover:text-ink active:scale-95"
    >
      <Bell className="h-[18px] w-[18px]" aria-hidden />
      {unread > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full button-gradient px-1 text-[10.5px] font-bold leading-none text-white">
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </Link>
  );
}
