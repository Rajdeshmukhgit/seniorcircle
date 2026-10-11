import { BellOff, CheckCheck } from "lucide-react";
import type { Metadata } from "next";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import { EmptyState } from "@/components/ui/EmptyState";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { markAllNotificationsRead } from "@/lib/actions/notifications";
import { requireUser } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser("/notifications");
  const notifications = await getRepo().listNotifications(user.id);
  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="mx-auto w-full max-w-[720px] px-4 pb-16 pt-24 sm:px-6 md:pt-28">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.05em] text-ink sm:text-[46px]">Notifications</h1>
          <p className="mt-2 text-[15.5px] text-soft">{unread > 0 ? `${unread} unread` : "You are all caught up."}</p>
        </div>
        {unread > 0 && (
          <form action={markAllNotificationsRead}>
            <SubmitButton variant="outline" size="sm">
              <CheckCheck className="h-3.5 w-3.5" aria-hidden />
              Mark all as read
            </SubmitButton>
          </form>
        )}
      </div>

      <div className="mt-7">
        {notifications.length === 0 ? (
          <EmptyState
            icon={BellOff}
            title="No new notifications."
            description="Comments on your experiences, connect requests and verification updates appear here."
          />
        ) : (
          <ul className="divide-y divide-hairline overflow-hidden rounded-card border border-line bg-card [--cut:20px] [--r:16px]">
            {notifications.map((notification) => (
              <NotificationItem key={notification.id} notification={notification} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
