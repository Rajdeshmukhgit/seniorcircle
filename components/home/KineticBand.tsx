"use client";

import { useEffect, useState } from "react";

/** S, J, C: Senior Junior Connect, one letter at a time, like a slow wheel. */
const LETTERS = [
  { letter: "S", word: "senior" },
  { letter: "J", word: "junior" },
  { letter: "C", word: "connect" },
];

const STEP_MS = 1800;

export function KineticBand() {
  const [index, setIndex] = useState(0);
  const [still, setStill] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      setStill(true);
      return;
    }
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % LETTERS.length), STEP_MS);
    return () => window.clearInterval(timer);
  }, []);

  const current = LETTERS[index];

  return (
    <section aria-label="Senior Junior Connect" className="px-2.5 pt-3 sm:px-4 sm:pt-4">
      <div className="relative mx-auto flex min-h-[380px] max-w-wide flex-col overflow-hidden rounded-panel bg-card px-5 py-8 shadow-card sm:min-h-[460px] sm:px-10 sm:py-10 lg:px-14">
        <p className="max-w-[220px] font-display text-[19px] font-semibold leading-[1.12] tracking-[-0.035em] text-ink">
          Real, Verified,
          <br />
          Searchable, Shared
        </p>

        <div className="flex flex-1 items-center justify-center py-6" aria-hidden>
          {still ? (
            <span className="font-display text-[120px] font-bold leading-none tracking-[-0.06em] text-ink sm:text-[200px]">SJC</span>
          ) : (
            <div className="relative flex items-start">
              <span className="relative block h-[0.86em] overflow-hidden font-display text-[150px] font-bold leading-[0.86] tracking-[-0.06em] text-ink sm:text-[240px]">
                <span key={index} className="block" style={{ animation: "letter-in 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) both" }}>
                  {current.letter}
                </span>
              </span>
              <span key={`w-${index}`} className="animate-rise ml-2 mt-1 font-mono text-[11px] text-soft sm:mt-3 sm:text-[12px]">
                {current.word}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="h-px w-full max-w-[520px] bg-line">
            {!still && (
              <div
                key={`p-${index}`}
                className="h-px origin-left bg-ink"
                style={{ animation: `progress ${STEP_MS}ms linear both` }}
              />
            )}
          </div>
          <p className="max-w-[300px] text-[13.5px] leading-snug text-soft">
            Senior–Junior Connect: what one batch learned, handed to the next.
          </p>
        </div>
      </div>
    </section>
  );
}
