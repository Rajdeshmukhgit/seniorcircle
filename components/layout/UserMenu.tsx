"use client";

import { ChevronDown, LayoutDashboard, LogOut, UserRound, Users } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { signOut } from "@/lib/actions/auth";
import { ROLE_LABEL } from "@/lib/constants/options";
import type { Role } from "@/types";

interface UserMenuProps {
  name: string;
  role: Role;
  isAdmin: boolean;
}

const item = "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium text-strong hover:bg-tint hover:text-ink";

export function UserMenu({ name, role, isAdmin }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  // Links close the menu. The sign-out form must stay mounted to submit.
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button suppressHydrationWarning
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="glass-strong shape-cut flex h-10 items-center gap-1.5 pl-1 pr-2 transition [--cut:10px] [--r:11px] hover:border-faint"
      >
        <Avatar name={name} size="sm" />
        <ChevronDown className="h-4 w-4 text-faint" aria-hidden />
      </button>

      {open && (
        <div role="menu" className="glass-strong shape-cut-tr absolute right-0 top-12 z-50 w-60 p-1.5 shadow-float [--cut:16px] [--r:14px]">
          <div className="border-b border-hairline px-2.5 pb-2.5 pt-1.5">
            <div className="truncate text-sm font-bold text-ink">{name}</div>
            <div className="text-[12.5px] text-faint">{ROLE_LABEL[role]}</div>
          </div>
          <div className="pt-1.5">
            <Link href="/profile" role="menuitem" className={item} onClick={close}>
              <UserRound className="h-4 w-4 text-faint" aria-hidden />
              Profile
            </Link>
            <Link href="/connections" role="menuitem" className={item} onClick={close}>
              <Users className="h-4 w-4 text-faint" aria-hidden />
              Connections
            </Link>
            {isAdmin && (
              <Link href="/admin" role="menuitem" className={item} onClick={close}>
                <LayoutDashboard className="h-4 w-4 text-faint" aria-hidden />
                Admin Dashboard
              </Link>
            )}
            <form action={signOut}>
              <button suppressHydrationWarning type="submit" role="menuitem" className={item}>
                <LogOut className="h-4 w-4 text-faint" aria-hidden />
                Sign out
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
