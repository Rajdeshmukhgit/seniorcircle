"use server";

import { revalidatePath } from "next/cache";
import { aiConfig } from "@/lib/ai/config";
import { enrichPostById } from "@/lib/ai/enrich";
import { requireAdmin } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";

/**
 * Embeds and reads a batch of experiences that predate the enrichment
 * pipeline, or that failed it. New posts are enriched as they are written
 * (lib/actions/posts.ts); this is for everything already in the database.
 *
 * One batch per click, sequentially, because the free tiers of both model
 * providers rate-limit bursts. The admin page shows how many are left.
 */
export async function backfillEnrichment(): Promise<void> {
  await requireAdmin();

  const ids = await getRepo().listPostsNeedingEnrichment(aiConfig.backfillBatch);
  for (const id of ids) {
    await enrichPostById(id);
  }

  revalidatePath("/admin");
  revalidatePath("/", "layout");
}
