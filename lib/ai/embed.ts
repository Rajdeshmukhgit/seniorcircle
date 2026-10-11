import "server-only";
import type { Post, PostInput } from "@/types";
import { aiConfig, isEmbeddingConfigured } from "./config";

/**
 * Turns text into a vector so the assistant can retrieve by meaning instead of
 * by shared words. "Which companies ask system design" matches a write-up that
 * never uses either word; keyword scoring (lib/chat/retrieval.ts) cannot.
 *
 * Every function here returns null rather than throwing. Embeddings are an
 * improvement, not a dependency: without a key, or when Gemini is down, the
 * site falls back to keyword retrieval and nothing breaks.
 */

/**
 * Gemini asks what the text is for. A stored experience and a member's
 * question are embedded differently even when the words match, which measurably
 * improves retrieval.
 */
type EmbedTask = "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY";

/** Cosine similarity assumes unit length. Gemini normalises already; this is belt and braces. */
function normalize(values: number[]): number[] {
  let sum = 0;
  for (const value of values) sum += value * value;
  const length = Math.sqrt(sum);
  return length > 0 ? values.map((value) => value / length) : values;
}

async function embed(text: string, task: EmbedTask, signal?: AbortSignal): Promise<number[] | null> {
  const input = text.trim().slice(0, aiConfig.embedChars);
  if (!isEmbeddingConfigured || !input) return null;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(aiConfig.embedModel)}:embedContent`;

  try {
    const response = await fetch(url, {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": aiConfig.geminiKey },
      body: JSON.stringify({
        model: `models/${aiConfig.embedModel}`,
        content: { parts: [{ text: input }] },
        taskType: task,
      }),
    });

    if (!response.ok) {
      console.error(`[embed] Gemini answered ${response.status}:`, (await response.text().catch(() => "")).slice(0, 200));
      return null;
    }

    const body = (await response.json()) as { embedding?: { values?: number[] } };
    const values = body.embedding?.values;
    if (!Array.isArray(values) || values.length !== aiConfig.embedDimensions) {
      console.error(`[embed] expected ${aiConfig.embedDimensions} numbers, got ${values?.length ?? "none"}.`);
      return null;
    }
    return normalize(values);
  } catch (error) {
    console.error("[embed] failed:", error);
    return null;
  }
}

/** What gets embedded: the metadata a question might name, then the write-up. */
export function embeddableText(post: Pick<Post, "title" | "company_or_exam" | "category" | "role" | "branch" | "tags" | "description"> | PostInput): string {
  return [
    post.title,
    `${post.company_or_exam} -- ${post.category}${post.role ? ` -- ${post.role}` : ""}`,
    post.branch,
    post.tags.join(", "),
    post.description,
  ]
    .filter(Boolean)
    .join("\n");
}

export const embedDocument = (text: string, signal?: AbortSignal) => embed(text, "RETRIEVAL_DOCUMENT", signal);
export const embedQuery = (text: string, signal?: AbortSignal) => embed(text, "RETRIEVAL_QUERY", signal);

/** pgvector reads a vector from this literal. PostgREST has no vector type of its own. */
export function toVectorLiteral(values: number[]): string {
  return `[${values.map((value) => value.toFixed(6)).join(",")}]`;
}
