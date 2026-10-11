import Link from "next/link";
import { cn } from "@/lib/utils";

interface FilterChipProps {
  href: string;
  children: React.ReactNode;
  active?: boolean;
}

/** A pill that links to the feed with one filter applied. */
export function FilterChip({ href, children, active }: FilterChipProps) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(
        "shape-cut inline-flex border px-3.5 py-[6px] text-[13.5px] font-medium leading-[1.7] transition [--cut:8px] [--r:9px]",
        active
          ? "button-gradient border-transparent text-white"
          : "border-line bg-card text-soft hover:-translate-y-px hover:border-primary/40 hover:text-ink",
      )}
    >
      {children}
    </Link>
  );
}
