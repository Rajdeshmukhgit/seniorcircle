import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface SectionHeadingProps {
  title: string;
  subtitle: string;
  /** A short mono label above the title, e.g. "01 · Featured". */
  eyebrow?: string;
  link?: { href: string; label: string };
}

export function SectionHeading({ title, subtitle, eyebrow, link }: SectionHeadingProps) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-5">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
        <h2 className="heading-section">{title}</h2>
        <p className="mt-3 text-[15.5px] leading-relaxed text-soft">{subtitle}</p>
      </div>
      {link && (
        <Link
          href={link.href}
          className="glass-strong shape-cut group inline-flex shrink-0 items-center gap-3 whitespace-nowrap py-2 pl-4 pr-3 text-[13.5px] font-semibold text-ink transition [--cut:10px] [--r:11px] hover:border-primary/40"
        >
          {link.label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}
