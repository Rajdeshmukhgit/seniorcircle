import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { HeroArt } from "./HeroArt";

export function ContributeCta() {
  return (
    <section id="contribute" className="px-2.5 pb-4 sm:px-4">
      <div className="glass mx-auto max-w-wide rounded-panel p-1.5 shadow-float sm:p-2">
        <div className="panel-gradient chamfer-bl relative isolate overflow-hidden rounded-[24px] px-6 py-12 text-white [--cut:44px] sm:px-10 sm:py-16 sm:[--cut:72px] lg:px-14">
          <HeroArt uid="cta" className="absolute -right-24 -top-10 -z-10 h-[150%] w-[520px] opacity-70 sm:-right-10" />
          <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-xl">
              <p className="eyebrow text-white/80">Contribute</p>
              <h2 className="mt-4 font-display text-[34px] font-semibold leading-[1] tracking-[-0.05em] sm:text-[48px]">
                Been through it already?
              </h2>
              <p className="mt-3 text-[16px] leading-relaxed text-white/90">
                Your experience could help the next student prepare better.
              </p>
            </div>
            <ButtonLink href="/experiences/new" size="lg" variant="light" className="gap-8">
              Share Your Experience
              <ArrowRight className="h-[18px] w-[18px]" aria-hidden />
            </ButtonLink>
          </div>
        </div>
      </div>
    </section>
  );
}
