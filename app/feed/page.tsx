import { Clock3, MessagesSquare, PenLine, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FeedCard } from "@/components/experiences/FeedCard";
import { FilterBar } from "@/components/filters/FilterBar";
import { SearchBar } from "@/components/filters/SearchBar";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { canPost } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { graduationYears } from "@/lib/constants/options";
import { getRepo } from "@/lib/data";
import { feedUrl, hasActiveFilters, parseFeedFilters } from "@/lib/data/filters";
import { cn, plural } from "@/lib/utils";

export const metadata: Metadata = { title: "Experiences" };

interface FeedPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const user = await requireUser("/feed");
  const filters = parseFeedFilters(await searchParams);
  const repo = getRepo();
  const [posts, companies] = await Promise.all([repo.listPosts(filters), repo.listCompanies()]);
  const filtered = hasActiveFilters(filters);

  const sortTab = (sort: "latest" | "helpful") =>
    cn(
      "shape-cut inline-flex flex-1 items-center justify-center gap-1.5 px-3 py-2 [--cut:9px] [--r:10px] text-[13px] font-semibold transition",
      filters.sort === sort ? "bg-card text-primary-text shadow-sm" : "text-soft hover:text-ink",
    );

  return (
    <div className="mx-auto w-full max-w-[820px] px-4 pb-16 pt-24 sm:px-6 md:pt-28">
      <header>
        <h1 className="font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.05em] text-ink sm:text-[46px]">
          Experiences
        </h1>
        <p className="mt-2 text-[15.5px] text-soft">
          Interview, internship, exam and certification write-ups from seniors and alumni.
        </p>
      </header>

      <div className="mt-6 space-y-3">
        <SearchBar filters={filters} />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div role="group" aria-label="Sort" className="glass shape-cut inline-flex flex-1 items-center gap-0.5 p-1 [--cut:12px] [--r:13px]">
            <Link href={feedUrl({ ...filters, sort: "latest" })} scroll={false} aria-current={filters.sort === "latest" ? "true" : undefined} className={sortTab("latest")}>
              <Clock3 className="h-3.5 w-3.5" aria-hidden />
              Latest
            </Link>
            <Link href={feedUrl({ ...filters, sort: "helpful" })} scroll={false} aria-current={filters.sort === "helpful" ? "true" : undefined} className={sortTab("helpful")}>
              <MessagesSquare className="h-3.5 w-3.5" aria-hidden />
              Most helpful
            </Link>
          </div>
          {canPost(user) && (
            <ButtonLink href="/experiences/new" variant="solid" className="h-[42px] sm:w-auto">
              <PenLine className="h-4 w-4" aria-hidden />
              Share Your Experience
            </ButtonLink>
          )}
        </div>

        <FilterBar filters={filters} companies={companies} years={graduationYears()} />
      </div>

      <p className="mt-6 text-[13.5px] font-medium text-faint" aria-live="polite">
        {plural(posts.length, "experience")}
        {filtered ? " match these filters" : ""}
        {filters.sort === "helpful" ? ", most discussed first" : ", newest first"}
      </p>

      <div className="mt-3 space-y-3">
        {posts.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No experiences found for these filters."
            description={
              filtered
                ? "Try a different company, branch or year, or clear the filters to see everything."
                : "Nothing has been shared yet. Seniors and alumni can post the first experience."
            }
            action={
              filtered ? (
                <ButtonLink href="/feed" variant="outline">
                  Clear filters
                </ButtonLink>
              ) : undefined
            }
          />
        ) : (
          posts.map((post) => <FeedCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
