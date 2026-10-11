import { BRANCHES } from "@/lib/constants/options";
import type { Category, FeedFilters } from "@/types";

type Params = Record<string, string | string[] | undefined>;

const CATEGORY_VALUES: Category[] = ["interview", "internship", "exam", "certification"];

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim() || undefined;

/** Reads the feed's filters from the URL, ignoring anything unrecognised. */
export function parseFeedFilters(params: Params): FeedFilters {
  const category = first(params.category) as Category | undefined;
  const branch = first(params.branch);
  const year = Number(first(params.year));

  return {
    q: first(params.q)?.slice(0, 80),
    company: first(params.company)?.slice(0, 80),
    category: category && CATEGORY_VALUES.includes(category) ? category : undefined,
    branch: branch && (BRANCHES as readonly string[]).includes(branch) ? branch : undefined,
    year: Number.isInteger(year) && year >= 1980 && year <= 2100 ? year : undefined,
    sort: first(params.sort) === "helpful" ? "helpful" : "latest",
  };
}

/** Builds a /feed URL from filters, leaving out anything empty or default. */
export function feedUrl(filters: FeedFilters): string {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.company) params.set("company", filters.company);
  if (filters.category) params.set("category", filters.category);
  if (filters.branch) params.set("branch", filters.branch);
  if (filters.year) params.set("year", String(filters.year));
  if (filters.sort === "helpful") params.set("sort", "helpful");
  const query = params.toString();
  return query ? `/feed?${query}` : "/feed";
}

export function hasActiveFilters(filters: FeedFilters): boolean {
  return Boolean(filters.q || filters.company || filters.category || filters.branch || filters.year);
}
