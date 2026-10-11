"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, type ReactNode } from "react";

const arrow =
  "glass-strong shape-cut absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center text-soft shadow-float transition [--cut:10px] [--r:11px] hover:text-ink sm:inline-flex";

/** A horizontally scrolling row with previous and next buttons on wider screens. */
export function ScrollRow({ children, label }: { children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (direction: 1 | -1) => ref.current?.scrollBy({ left: direction * 632, behavior: "smooth" });

  return (
    <div className="relative">
      <button suppressHydrationWarning type="button" onClick={() => scroll(-1)} aria-label="Scroll left" className={`${arrow} -left-3`}>
        <ChevronLeft className="h-4 w-4" aria-hidden />
      </button>
      <div
        ref={ref}
        role="list"
        aria-label={label}
        tabIndex={0}
        className="no-scrollbar -mx-2 flex snap-x gap-4 overflow-x-auto scroll-smooth px-2 pb-6 pt-1"
      >
        {children}
      </div>
      <button suppressHydrationWarning type="button" onClick={() => scroll(1)} aria-label="Scroll right" className={`${arrow} -right-3`}>
        <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}
