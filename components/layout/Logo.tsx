import Link from "next/link";
import { SITE_NAME, SITE_NAME_ACCENT } from "@/lib/constants/site";
import { cn } from "@/lib/utils";

/** Two overlapping glass rings: one batch handing over to the next. */
export function LogoMark({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden className="shrink-0">
      <defs>
        <linearGradient id="sc-logo-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a9d8ff" />
          <stop offset="0.55" stopColor="#2a92ff" />
          <stop offset="1" stopColor="#0a6be0" />
        </linearGradient>
      </defs>
      <path d="M0 10 Q0 0 10 0 H26 L34 8 V24 Q34 34 24 34 H8 L0 26 Z" fill="url(#sc-logo-fill)" />
      <circle cx="13.5" cy="17" r="6.5" fill="none" stroke="#fff" strokeWidth="2.4" />
      <circle cx="20.5" cy="17" r="6.5" fill="none" stroke="#fff" strokeWidth="2.4" opacity="0.6" />
    </svg>
  );
}

/** The wordmark, with the accent part of SITE_NAME tinted in the brand colour. */
export function Wordmark({ className }: { className?: string }) {
  const index = SITE_NAME.indexOf(SITE_NAME_ACCENT);
  if (!SITE_NAME_ACCENT || index === -1) return <span className={className}>{SITE_NAME}</span>;
  return (
    <span className={className}>
      {SITE_NAME.slice(0, index)}
      <span className="text-primary-text">{SITE_NAME_ACCENT}</span>
      {SITE_NAME.slice(index + SITE_NAME_ACCENT.length)}
    </span>
  );
}

export function Logo({ className, wordmarkClassName }: { className?: string; wordmarkClassName?: string }) {
  return (
    <Link
      href="/"
      aria-label={`${SITE_NAME} home`}
      className={cn("flex items-center gap-2.5 font-semibold tracking-[-0.03em] text-ink transition active:scale-95", className)}
    >
      <LogoMark />
      <Wordmark className={cn("text-[15px] sm:text-lg xl:text-xl", wordmarkClassName)} />
    </Link>
  );
}
