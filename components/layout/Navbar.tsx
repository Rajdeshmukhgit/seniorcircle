import { NotificationBell } from "@/components/notifications/NotificationBell";
import { canPost, isAdmin } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";
import { NavbarShell } from "./NavbarShell";

export async function Navbar() {
  const user = await getCurrentUser();
  const unread = user ? await getRepo().unreadCount(user.id) : 0;

  return (
    <NavbarShell
      user={user ? { name: user.name, role: user.role, isAdmin: isAdmin(user), canPost: canPost(user) } : null}
      bell={<NotificationBell unread={unread} />}
    />
  );
}
