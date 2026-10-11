import type { Category, PostDigest } from "@/types";
import { chatConfig } from "./config";

/**
 * Keyword retrieval can only find experiences that share words with the
 * question, so it returns nothing for questions *about* the archive itself:
 * "which companies have come to campus", "how many GATE experiences are
 * there", "do you have anything for IT". No single experience answers those.
 *
 * This builds a compact catalogue of the whole archive -- every company, exam
 * and certification with how many experiences each has -- that goes into every
 * prompt alongside the matched experiences. It costs a few hundred tokens and
 * carries no descriptions, so it stays small as the site grows.
 */

const LABEL: Record<Category, string> = {
  interview: "interview",
  internship: "internship",
  exam: "exam",
  certification: "certification",
};

interface Entry {
  name: string;
  count: number;
  categories: Set<Category>;
  years: number[];
}

function span(years: number[]): string {
  const low = Math.min(...years);
  const high = Math.max(...years);
  return low === high ? String(low) : `${low}-${high}`;
}

const byCount = (a: { count: number; name: string }, b: { count: number; name: string }) =>
  b.count - a.count || a.name.localeCompare(b.name);

function tally(values: string[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].map(([name, count]) => ({ name, count })).sort(byCount);
}

/**
 * @param digests every experience the member may read, newest first.
 * @param partial true when the database held more rows than were fetched, so
 *   the counts below are a floor rather than the whole picture.
 */
export function buildArchiveOverview(digests: PostDigest[], partial = false): string {
  if (digests.length === 0) return "";

  const named = new Map<string, Entry>();
  for (const post of digests) {
    const name = post.company_or_exam.trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const entry = named.get(key) ?? { name, count: 0, categories: new Set<Category>(), years: [] };
    entry.count += 1;
    entry.categories.add(post.category);
    entry.years.push(post.graduation_year);
    named.set(key, entry);
  }

  const entries = [...named.values()].sort(byCount);
  const shown = entries.slice(0, chatConfig.maxArchiveNames);
  const hidden = entries.length - shown.length;

  const names = shown
    .map((entry) => {
      const types = [...entry.categories].map((category) => LABEL[category]).join("/");
      return `${entry.name} (${entry.count}, ${types}, batch ${span(entry.years)})`;
    })
    .join("; ");

  const types = tally(digests.map((post) => LABEL[post.category]))
    .map((entry) => `${entry.count} ${entry.name}`)
    .join(", ");

  const branches = tally(digests.map((post) => post.branch))
    .map((entry) => `${entry.name} (${entry.count})`)
    .join(", ");

  // Topics come from the enrichment pipeline, so this line is empty until
  // experiences have been read. It is what lets the assistant answer "what do
  // companies actually ask" without quoting a single write-up.
  const asked = tally(digests.flatMap((post) => post.topics))
    .slice(0, chatConfig.maxArchiveTopics)
    .map((entry) => `${entry.name} (${entry.count})`)
    .join(", ");

  const rated = digests.filter((post) => typeof post.difficulty === "number");
  const averageDifficulty =
    rated.length > 0
      ? (rated.reduce((total, post) => total + (post.difficulty ?? 0), 0) / rated.length).toFixed(1)
      : "";

  const total = partial
    ? `${digests.length} or more (only the ${digests.length} newest were counted, so treat every number here as a minimum)`
    : String(digests.length);

  return [
    `Total experiences on the site: ${total}`,
    `By type: ${types}`,
    `By branch of the member who wrote them: ${branches}`,
    `Batch years covered: ${span(digests.map((post) => post.graduation_year))}`,
    asked ? `Topics asked most often, across every experience: ${asked}` : "",
    averageDifficulty ? `Average difficulty across ${rated.length} rated experiences: ${averageDifficulty} out of 5` : "",
    `Every company, exam and certification that has an experience, with the number of experiences, the types, and the batch years:`,
    names + (hidden > 0 ? `; and ${hidden} more not listed here` : ""),
  ]
    .filter(Boolean)
    .join("\n");
}
