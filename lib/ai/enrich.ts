import "server-only";
import { getRepo } from "@/lib/data";
import type { Post } from "@/types";
import { embedDocument, embeddableText, toVectorLiteral } from "./embed";
import { extractInsights } from "./extract";

/**
 * Everything the site learns about one experience, in a single pass: a vector
 * for semantic retrieval, and the structure the model read out of the prose.
 *
 * Called after an experience is saved (lib/actions/posts.ts) and by the admin
 * backfill. Both halves are optional and independent -- a post can end up with
 * an embedding and no insights, or the other way round -- so one model being
 * down never costs the other.
 *
 * This never throws. Enrichment runs after the member already has their post,
 * so a failure must not surface to them; it is written to the log and the post
 * stays in the backfill queue.
 */
export async function enrichPost(post: Post): Promise<{ embedded: boolean; extracted: boolean }> {
  const [vector, insights] = await Promise.all([
    embedDocument(embeddableText(post)),
    extractInsights(post),
  ]);

  if (!vector && !insights) return { embedded: false, extracted: false };

  try {
    await getRepo().setPostEnrichment(post.id, {
      embedding: vector ? toVectorLiteral(vector) : null,
      insights,
      topics: insights?.topics ?? null,
      difficulty: insights?.difficulty ?? null,
      round_count: insights ? insights.rounds.length : null,
      outcome: insights?.outcome ?? null,
    });
  } catch (error) {
    console.error(`[enrich] could not store enrichment for ${post.id}:`, error);
    return { embedded: false, extracted: false };
  }

  return { embedded: Boolean(vector), extracted: Boolean(insights) };
}

/** Fetches the post first. Used where only the id is to hand. */
export async function enrichPostById(id: string): Promise<{ embedded: boolean; extracted: boolean }> {
  try {
    const post = await getRepo().getPost(id);
    if (!post) return { embedded: false, extracted: false };
    return await enrichPost(post);
  } catch (error) {
    console.error(`[enrich] could not read ${id}:`, error);
    return { embedded: false, extracted: false };
  }
}
