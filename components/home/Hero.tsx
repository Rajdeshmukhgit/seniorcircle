import { ArrowRight, PenLine } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { COLLEGE_NAME, SITE_NAME, SITE_TAGLINE } from "@/lib/constants/site";
import { HeroArt } from "./HeroArt";

const points = ["Real experiences", "Verified seniors & alumni", "Placement insights", "Exam guidance"];

interface HeroProps {
  /** How many experiences and distinct companies or exams are on the platform. */
  stats?: { experiences: number; companies: number };
}

export function Hero({ stats }: HeroProps) {
  const showStats = stats && stats.experiences > 0;

  return (
    <section id="hero" className="px-2.5 pt-[74px] sm:px-4 sm:pt-[82px]">
      {/* White glass frame around the blue panel, as in the reference. */}
      <div className="glass mx-auto max-w-wide rounded-panel p-1.5 shadow-float sm:p-2">
        <div className="panel-gradient chamfer-bl relative isolate overflow-hidden rounded-[24px] text-white [--cut:44px] sm:[--cut:80px] lg:[--cut:112px]">
          {/* Ambient light */}
          <div aria-hidden className="absolute -left-32 -top-32 -z-10 h-96 w-96 rounded-full bg-white/40 blur-3xl" />
          <div aria-hidden className="absolute -bottom-40 right-0 -z-10 h-[28rem] w-[28rem] rounded-full bg-[#0a84ff]/30 blur-3xl" />

          {/* Tablets and up: the staircase sits behind the right half of the panel. Phones get an in-flow copy next to the stat card. */}
          <HeroArt className="absolute right-[2%] top-[9%] -z-10 hidden h-[38%] w-[46%] sm:block lg:right-[4%] lg:top-[5%] lg:h-[62%] lg:w-[42%]" />

          <div className="relative flex min-h-[640px] flex-col justify-between gap-12 px-5 pb-9 pt-10 sm:min-h-[660px] sm:px-10 sm:pb-12 sm:pt-14 lg:h-[calc(100svh-108px)] lg:min-h-[470px] lg:max-h-[860px] lg:gap-6 lg:px-14 lg:pb-[clamp(24px,5svh,56px)] lg:pt-[clamp(28px,6svh,56px)]">
            <div className="max-w-[720px]">
              <p className="eyebrow animate-rise text-white/90">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                {COLLEGE_NAME} · Senior–Junior Connect
              </p>
              <h1
                className="animate-rise mt-5 lg:mt-[clamp(12px,2.4svh,20px)] font-display text-[42px] font-semibold leading-[0.96] tracking-[-0.055em] [text-shadow:0_2px_24px_rgba(8,40,72,0.18)] min-[420px]:text-[50px] sm:max-w-[6.4em] sm:text-[64px] lg:text-[clamp(50px,9.6svh,84px)]"
                style={{ animationDelay: "80ms" }}
              >
                Learn from experience.
                <br />
                <span className="text-white/70">Move forward</span> confidently.
              </h1>
            </div>

            {/* On phones the card and a copy of the staircase share a row; from sm up this wrapper disappears. */}
            <div className="-mr-2 flex items-center gap-1 sm:contents">
            {showStats && (
              <div
                className="glass-on-panel shape-cut-tr animate-rise w-[56%] shrink-0 p-4 [--cut:24px] [--r:20px] sm:w-[240px] sm:p-5 sm:[--cut:30px] sm:[--r:22px] lg:hidden xl:absolute xl:left-[45%] xl:top-[13%] xl:block"
                style={{ animationDelay: "240ms" }}
              >
                <div className="font-display text-[44px] font-semibold leading-none tracking-[-0.06em] sm:text-[56px] lg:text-[clamp(40px,7svh,56px)]">
                  {stats.experiences}
                  <span className="text-white/60">+</span>
                </div>
                <svg viewBox="0 0 64 40" className="mt-3 h-8 w-14 sm:mt-5 sm:h-10 sm:w-16 lg:mt-[clamp(10px,2svh,20px)] lg:h-[clamp(28px,4.5svh,40px)]" aria-hidden>
                  <path
                    d="M4 36 H18 V26 H32 V16 H46 V6 H60"
                    fill="none"
                    stroke="#fff"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <p className="mt-3 text-[12.5px] font-medium leading-snug text-white/90 sm:mt-4 sm:text-[13px]">
                  experiences shared by seniors and alumni, across {stats.companies}{" "}
                  {stats.companies === 1 ? "company or exam" : "companies and exams"}.
                </p>
              </div>
            )}
            <HeroArt uid="hero-m" className="h-[190px] min-w-0 flex-1 sm:hidden" />
            </div>

            <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="animate-rise grid max-w-[540px] grid-cols-[auto_1fr] gap-x-8 border-t border-white/35 pt-4" style={{ animationDelay: "320ms" }}>
                <span className="pt-1 text-[13px] font-medium text-white/80">{SITE_NAME} is</span>
                <ul className="text-[19px] font-semibold leading-[1.18] tracking-[-0.03em] sm:text-[22px] lg:text-[clamp(17px,2.7svh,22px)]">
                  {points.map((point, index) => (
                    <li key={point}>
                      {point}
                      {index < points.length - 1 ? "," : ""}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="animate-rise lg:justify-self-end" style={{ animationDelay: "400ms" }}>
                <p className="max-w-[420px] text-[16px] leading-[1.55] text-white/90 sm:text-[17px] lg:text-[clamp(15px,2.4svh,17px)]">{SITE_TAGLINE}</p>
                <div className="mt-6 flex flex-wrap items-center gap-2.5 lg:mt-[clamp(14px,2.6svh,24px)]">
                  <ButtonLink href="/feed" variant="light" size="lg" className="gap-8">
                    Explore Experiences
                    <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
                  </ButtonLink>
                  <ButtonLink href="/experiences/new" variant="glass" size="lg">
                    Share Your Experience
                    <PenLine className="h-4 w-4" aria-hidden />
                  </ButtonLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
