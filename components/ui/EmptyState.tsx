import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center rounded-card border border-dashed border-line px-6 py-12 text-center">
      <span className="shape-cut flex h-10 w-10 items-center justify-center bg-tint text-primary-text [--cut:10px] [--r:11px]">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="mt-4 font-display text-[17px] font-bold tracking-[-0.02em] text-ink">{title}</h3>
      {description && <p className="mt-1.5 max-w-sm text-[14.5px] leading-relaxed text-soft">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
