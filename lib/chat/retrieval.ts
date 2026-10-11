import type { Post } from "@/types";
import type { ChatSource } from "./types";

/**
 * Finds the experiences most relevant to a question. This replaces the vector
 * store the voice agent used for uploaded media: here the "memory" is the
 * college's own experiences, already filtered to what this member may read.
 */

const STOP_WORDS = new Set(
  `a about after all also am an and any are as at be been before but by can could did do does for from get got had has
   have how i if in into is it its just me my need of on or our out please prepare preparation prepared preparing
   should so some tell than that the their them then there these they this to up us was we were what when where which
   who why will with would you your asked ask give know like many much want tips advice help experience experiences
   good best way part round rounds question questions process company college student students year`.split(/\s+/),
);

const CATEGORY_WORDS: Record<string, Post["category"]> = {
  interview: "interview",
  interviews: "interview",
  placement: "interview",
  placements: "interview",
  internship: "internship",
  internships: "internship",
  intern: "internship",
  exam: "exam",
  exams: "exam",
  entrance: "exam",
  certification: "certification",
  certifications: "certification",
  certificate: "certification",
};

/** The meaningful words of a question, lower-cased. */
export function keywords(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z0-9+#.&]+/g) ?? [];
  const cleaned = words.map((word) => word.replace(/^[.&]+|[.&]+$/g, "")).filter((word) => word.length >= 2);
  return [...new Set(cleaned.filter((word) => !STOP_WORDS.has(word)))];
}

const tokens = (text: string) => new Set(text.toLowerCase().match(/[a-z0-9+#]+/g) ?? []);

/** Whole-word match, so "cat" never matches "certification". Longer words also match as a prefix ("intern", "internship"). */
function has(words: Set<string>, word: string): boolean {
  if (words.has(word)) return true;
  if (word.length < 5) return false;
  for (const candidate of words) if (candidate.startsWith(word)) return true;
  return false;
}

function score(post: Post, words: string[]): number {
  const company = tokens(post.company_or_exam);
  const title = tokens(post.title);
  const role = tokens(post.role ?? "");
  const branch = tokens(post.branch);
  const tags = tokens(post.tags.join(" "));
  const body = tokens(post.description);

  let total = 0;
  for (const word of words) {
    if (has(company, word)) total += 6;
    if (has(title, word)) total += 3;
    if (has(tags, word)) total += 3;
    if (CATEGORY_WORDS[word] === post.category) total += 3;
    if (has(role, word)) total += 2;
    if (has(branch, word)) total += 1;
    if (has(body, word)) total += 1;
  }
  return total;
}

/** Below this an experience only shares a stray word with the question. */
const MIN_SCORE = 3;
const RELATIVE_CUTOFF = 0.5;
/** A company, exam or title match. Anything weaker is treated as a follow-up question. */
const STRONG_SCORE = 6;

export function rankPosts(question: string, posts: Post[], limit: number, previousQuestion?: string): Post[] {
  const rank = (words: string[]) => {
    const scored = posts
      .map((post) => ({ post, points: score(post, words) }))
      .filter((entry) => entry.points >= MIN_SCORE)
      .sort(
        (a, b) =>
          b.points - a.points ||
          b.post.comment_count - a.post.comment_count ||
          b.post.created_at.localeCompare(a.post.created_at),
      );
    // Keep only experiences that match about as well as the best one, so a
    // question about one company does not pull in a loosely related post.
    const best = scored[0]?.points ?? 0;
    const picked = scored
      .filter((entry) => entry.points >= best * RELATIVE_CUTOFF)
      .slice(0, limit)
      .map((entry) => entry.post);
    return { picked, best };
  };

  const direct = rank(keywords(question));
  if (direct.best >= STRONG_SCORE || !previousQuestion) return direct.picked;

  // A follow-up such as "what about the HR round?" names no company, so read
  // it together with what the member was asking about just before.
  const combined = rank(keywords(`${previousQuestion} ${question}`));
  return combined.best > direct.best ? combined.picked : direct.picked;
}

/**
 * Reciprocal rank fusion, the standard way to combine two retrievers whose
 * scores are not comparable. A keyword score of 9 and a cosine similarity of
 * 0.72 mean nothing next to each other, but their *positions* do: each list
 * contributes 1/(k + rank), so a result near the top of either list scores
 * well, and one that both retrievers found beats one that only appeared in
 * either. k = 60 is the value from the original paper -- large enough that the
 * exact order inside a list matters less than being in both.
 */
const RRF_K = 60;

export function fuse(lists: Post[][], limit: number): Post[] {
  const points = new Map<string, number>();
  const posts = new Map<string, Post>();

  for (const list of lists) {
    list.forEach((post, index) => {
      points.set(post.id, (points.get(post.id) ?? 0) + 1 / (RRF_K + index + 1));
      posts.set(post.id, post);
    });
  }

  return [...posts.values()]
    .sort(
      (a, b) =>
        (points.get(b.id) ?? 0) - (points.get(a.id) ?? 0) ||
        b.comment_count - a.comment_count ||
        b.created_at.localeCompare(a.created_at),
    )
    .slice(0, limit);
}

export function toSource(post: Post): ChatSource {
  return {
    id: post.id,
    title: post.title,
    company: post.company_or_exam,
    author: post.author.name,
    year: post.graduation_year,
  };
}
