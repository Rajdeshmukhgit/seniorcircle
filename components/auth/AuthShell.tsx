import type { ReactNode } from "react";
import { HeroArt } from "@/components/home/HeroArt";
import { SITE_NAME } from "@/lib/constants/site";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}

/**
 * Every sign-in, sign-up and status screen: the form card on frosted glass,
 * beside the blue glass panel on wide screens.
 */
export function AuthShell({ title, subtitle, children, footer, wide }: AuthShellProps) {
  return (
    <div className="mx-auto w-full max-w-wide px-2.5 pt-[74px] sm:px-4 sm:pt-[82px]">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-4">
        <div className="glass flex flex-col items-center justify-center rounded-panel px-3 py-10 shadow-card sm:px-6 sm:py-16">
          <div className={`animate-rise w-full ${wide ? "max-w-[520px]" : "max-w-[430px]"}`}>
            <div className="rounded-card border border-line bg-card p-[22px] [--cut:34px] sm:p-8">
              <h1 className="font-display text-[30px] font-semibold leading-[1.05] tracking-[-0.045em] text-ink">{title}</h1>
              {subtitle && <p className="mt-2.5 text-[14.5px] leading-relaxed text-soft">{subtitle}</p>}
              <div className="mt-6">{children}</div>
            </div>
            {footer && <div className="mt-5 text-center text-[14px] text-soft">{footer}</div>}
          </div>
        </div>

        <aside aria-hidden className="glass hidden rounded-panel p-2 shadow-float lg:block">
          <div className="panel-gradient chamfer-bl relative isolate flex h-full min-h-[660px] flex-col justify-between overflow-hidden rounded-[24px] p-12 text-white [--cut:112px]">
            <HeroArt uid="auth" className="absolute inset-x-[-6%] top-[12%] -z-10 h-[66%]" />
            <p className="eyebrow text-white/90">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
              {SITE_NAME}
            </p>
            <p className="ml-auto max-w-[380px] text-right font-display text-[40px] font-semibold leading-[0.98] tracking-[-0.05em]">
              What seniors know, written down.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

export const authLink = "font-semibold text-primary-text hover:underline";
