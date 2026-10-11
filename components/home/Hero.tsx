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

          <HeroArt className="absolute -right-[30%] top-[22%] -z-10 h-[52%] w-[120%] opacity-80 sm:-right-[10%] sm:top-[14%] sm:h-[70%] sm:w-[90%] lg:right-[2%] lg:top-[4%] lg:h-[88%] lg:w-[64%] lg:opacity-100" />

          <div className="relative flex min-h-[640px] flex-col justify-between gap-12 px-5 pb-9 pt-10 sm:min-h-[660px] sm:px-10 sm:pb-12 sm:pt-14 lg:min-h-[700px] lg:px-14 lg:pb-14">
            <div className="max-w-[720px]">
              <p className="eyebrow animate-rise text-white/90">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                {COLLEGE_NAME} · Senior–Junior Connect
              </p>
              <h1
                className="animate-rise mt-5 font-display text-[42px] font-semibold leading-[0.96] tracking-[-0.055em] [text-shadow:0_2px_24px_rgba(8,40,72,0.18)] min-[420px]:text-[50px] sm:text-[64px] lg:text-[76px]"
                style={{ animationDelay: "80ms" }}
              >
                Learn from experience.
                <br />
                <span className="text-white/70">Move forward</span> confidently.
              </h1>
            </div>

            {showStats && (
              <div
                className="glass-on-panel shape-cut-tr animate-rise w-[240px] p-5 [--cut:30px] [--r:22px] lg:absolute lg:left-[47%] lg:top-[29%]"
                style={{ animationDelay: "240ms" }}
              >
                <div className="font-display text-[56px] font-semibold leading-none tracking-[-0.06em]">
                  {stats.experiences}
                  <span className="text-white/60">+</span>
                </div>
                <svg viewBox="0 0 64 40" className="mt-5 h-10 w-16" aria-hidden>
                  <circle cx="22" cy="20" r="15" fill="none" stroke="#fff" strokeWidth="6" />
                  <circle cx="42" cy="20" r="15" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="6" />
                </svg>
                <p className="mt-4 text-[13px] font-medium leading-snug text-white/90">
                  experiences shared by seniors and alumni, across {stats.companies}{" "}
                  {stats.companies === 1 ? "company or exam" : "companies and exams"}.
                </p>
              </div>
            )}

            <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="animate-rise grid max-w-[540px] grid-cols-[auto_1fr] gap-x-8 border-t border-white/35 pt-4" style={{ animationDelay: "320ms" }}>
                <span className="pt-1 text-[13px] font-medium text-white/80">{SITE_NAME} is</span>
                <ul className="text-[19px] font-semibold leading-[1.18] tracking-[-0.03em] sm:text-[22px]">
                  {points.map((point, index) => (
                    <li key={point}>
                      {point}
                      {index < points.length - 1 ? "," : ""}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="animate-rise lg:justify-self-end" style={{ animationDelay: "400ms" }}>
                <p className="max-w-[420px] text-[16px] leading-[1.55] text-white/90 sm:text-[17px]">{SITE_TAGLINE}</p>
                <div className="mt-6 flex flex-wrap items-center gap-2.5">
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
