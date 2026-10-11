"use client";

import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ButtonLink } from "@/components/ui/Button";
import { signOut } from "@/lib/actions/auth";
import { NAV_LINKS } from "@/lib/constants/site";
import { cn } from "@/lib/utils";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";
import type { Role } from "@/types";

interface NavbarShellProps {
  user: { name: string; role: Role; isAdmin: boolean; canPost: boolean } | null;
  /** The notification bell, rendered on the server with the unread count. */
  bell: ReactNode;
}

export function NavbarShell({ user, bell }: NavbarShellProps) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu after navigating.
  useEffect(() => setMenuOpen(false), [pathname]);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : !href.includes("#") && pathname.startsWith(href));

  const mobileLink = "shape-cut px-3 py-2.5 text-[15px] font-semibold text-strong [--r:10px] [--cut:8px] hover:bg-tint";

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-2.5 pt-2.5 sm:px-4 sm:pt-3">
      <div
        className={cn(
          "mx-auto w-full max-w-wide rounded-[20px] border border-transparent transition-[background,box-shadow,border-color] duration-300",
          (scrolled || menuOpen) && "nav-solid",
        )}
      >
        <div className="relative flex w-full items-center justify-between gap-2 px-3 py-2 sm:px-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-4">
          <Logo />

          <nav aria-label="Main" className="glass hidden items-center gap-0.5 rounded-[15px] p-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "shape-cut px-4 py-1.5 text-[13.5px] font-medium transition-colors [--cut:9px] [--r:11px]",
                  isActive(link.href)
                    ? "bg-white/90 text-ink shadow-[0_6px_16px_-10px_rgba(12,52,94,0.5)] dark:bg-white/10"
                    : "text-soft hover:bg-white/50 hover:text-ink dark:hover:bg-white/5",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-2 lg:flex lg:justify-self-end xl:gap-2.5">
            <ThemeToggle />
            {user ? (
              <>
                {bell}
                {user.canPost && (
                  <ButtonLink href="/experiences/new" variant="solid">
                    Write Experience
                  </ButtonLink>
                )}
                <UserMenu name={user.name} role={user.role} isAdmin={user.isAdmin} />
              </>
            ) : (
              <>
                <ButtonLink href="/auth/login" variant="ghost">
                  Sign In
                </ButtonLink>
                <ButtonLink href="/auth/signup" variant="light" className="gap-6 pl-5 pr-4 dark:bg-white">
                  Join Community
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </ButtonLink>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle />
            {user && bell}
            <button suppressHydrationWarning
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              className="glass-strong shape-cut flex h-9 w-9 items-center justify-center text-soft transition [--cut:9px] [--r:10px] hover:text-ink active:scale-95"
            >
              {menuOpen ? <X className="h-[18px] w-[18px]" aria-hidden /> : <Menu className="h-[18px] w-[18px]" aria-hidden />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div id="mobile-menu" className="border-t border-hairline px-3 pb-4 pt-3 sm:px-4 lg:hidden">
            <nav aria-label="Mobile" className="flex flex-col">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(mobileLink, isActive(link.href) && "bg-tint text-ink")}
                >
                  {link.label}
                </Link>
              ))}
              {user && (
                <>
                  <Link href="/profile" className={mobileLink}>
                    Profile
                  </Link>
                  <Link href="/connections" className={mobileLink}>
                    Connections
                  </Link>
                  {user.isAdmin && (
                    <Link href="/admin" className={mobileLink}>
                      Admin Dashboard
                    </Link>
                  )}
                </>
              )}
            </nav>
            <div className="mt-3 flex flex-col gap-2 border-t border-hairline pt-4">
              {user ? (
                <>
                  {user.canPost && (
                    <ButtonLink href="/experiences/new" variant="solid" className="w-full">
                      Write Experience
                    </ButtonLink>
                  )}
                  <form action={signOut}>
                    <button suppressHydrationWarning type="submit" className="shape-cut h-10 w-full border border-line bg-card text-sm font-semibold text-soft [--cut:11px] [--r:11px]">
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <ButtonLink href="/auth/signup" variant="solid" className="w-full">
                    Join Community
                  </ButtonLink>
                  <ButtonLink href="/auth/login" variant="outline" className="w-full">
                    Sign In
                  </ButtonLink>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
