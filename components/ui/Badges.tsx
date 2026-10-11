import { BadgeCheck, Clock3, ShieldAlert } from "lucide-react";
import { CATEGORY_LABEL, ROLE_LABEL } from "@/lib/constants/options";
import { cn } from "@/lib/utils";
import type { Category, Role, VerificationStatus } from "@/types";

const pill = "shape-cut inline-flex shrink-0 items-center gap-1 whitespace-nowrap px-2.5 py-1 text-[11px] font-semibold leading-none [--cut:6px] [--r:7px]";

// One tint per kind of experience, shared by cards, filters and the detail page.
const categoryTone: Record<Category, string> = {
  interview: "bg-[#DCEBFF] text-[#0A4C96] dark:bg-[#5AA9FF]/15 dark:text-[#9CCBFF]",
  internship: "bg-[#D7F2EE] text-[#0B5A50] dark:bg-[#5FD4C2]/15 dark:text-[#93E4D6]",
  exam: "bg-[#E7E6FF] text-[#35308C] dark:bg-[#A9A4FF]/15 dark:text-[#C6C2FF]",
  certification: "bg-[#E3EDF5] text-[#274459] dark:bg-[#9DBBD3]/15 dark:text-[#BFD3E3]",
};

export function CategoryBadge({ category, className }: { category: Category; className?: string }) {
  return <span className={cn(pill, categoryTone[category], className)}>{CATEGORY_LABEL[category]}</span>;
}

/** "Senior", "Alumni" and so on, next to an author's name. */
export function AuthorBadge({ role, className }: { role: Role; className?: string }) {
  return (
    <span className={cn("shape-cut inline-flex shrink-0 items-center bg-tint px-1.5 py-0.5 text-[11px] font-semibold leading-none text-soft [--cut:4px] [--r:5px]", className)}>
      {ROLE_LABEL[role]}
    </span>
  );
}

/** Shown for alumni only. Students are verified by their college email. */
export function VerifiedBadge({ status, className }: { status: VerificationStatus; className?: string }) {
  if (status === "verified") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[12.5px] font-semibold text-success", className)}>
        <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
        Verified alumni
      </span>
    );
  }
  if (status === "pending") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[12.5px] font-semibold text-soft", className)}>
        <Clock3 className="h-3.5 w-3.5" aria-hidden />
        Verification pending
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className={cn("inline-flex items-center gap-1 text-[12.5px] font-semibold text-danger", className)}>
        <ShieldAlert className="h-3.5 w-3.5" aria-hidden />
        Not verified
      </span>
    );
  }
  return null;
}

export function StatusPill({ tone, children }: { tone: "neutral" | "success" | "danger"; children: React.ReactNode }) {
  return (
    <span
      className={cn(
        pill,
        "bg-tint",
        tone === "success" && "text-success",
        tone === "danger" && "text-danger",
        tone === "neutral" && "text-soft",
      )}
    >
      {children}
    </span>
  );
}
