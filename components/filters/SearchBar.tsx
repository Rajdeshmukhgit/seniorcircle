"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { feedUrl } from "@/lib/data/filters";
import type { FeedFilters } from "@/types";

/** Searches titles, companies and exams, descriptions and tags. Keeps the other filters. */
export function SearchBar({ filters }: { filters: FeedFilters }) {
  const router = useRouter();
  const [value, setValue] = useState(filters.q ?? "");

  // Keep the box in step when the URL changes, for example after "Clear".
  useEffect(() => setValue(filters.q ?? ""), [filters.q]);

  const go = (q: string) => router.push(feedUrl({ ...filters, q: q.trim() || undefined }));

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        go(value);
      }}
      className="relative"
    >
      <label htmlFor="feed-search" className="sr-only">
        Search experiences
      </label>
      <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-faint" aria-hidden />
      <input suppressHydrationWarning
        id="feed-search"
        type="search"
        name="q"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search experiences, companies or exams"
        autoComplete="off"
        maxLength={80}
        className="h-12 w-full rounded-card border border-line bg-card [--cut:20px] [--r:16px] pl-11 pr-11 text-[15px] text-ink outline-none transition placeholder:text-faint focus:border-primary focus:ring-4 focus:ring-primary/10 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button suppressHydrationWarning
          type="button"
          onClick={() => {
            setValue("");
            if (filters.q) go("");
          }}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg text-faint hover:bg-tint hover:text-ink"
        >
          <X className="h-4 w-4" aria-hidden />
        </button>
      )}
    </form>
  );
}
