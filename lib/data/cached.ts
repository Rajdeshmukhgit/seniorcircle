import "server-only";
import { unstable_cache } from "next/cache";
import { isDemoMode } from "@/lib/config";
import { createPublicClient } from "@/lib/supabase/public";
import type { PostPreview } from "@/types";
import { getRepo } from "./index";

/** Cache tag for anything derived from the list of experiences. */
export const POSTS_TAG = "posts";

/**
 * The newest experiences for the homepage and Discover. The database sits in
 * another region from many visitors, so instead of querying it on every page
 * view the result is kept for 60 seconds and shared. Writing, editing or
 * deleting an experience (or a comment) clears it straight away through
 * revalidateTag(POSTS_TAG), so nobody waits a minute to see their own post.
 */
const cachedPreviews = unstable_cache(
  async (): Promise<PostPreview[]> => {
    const { data, error } = await createPublicClient()
      .from("post_previews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(40);
    if (error) throw new Error(error.message); // errors are not cached
    return (data ?? []) as PostPreview[];
  },
  ["post-previews-v1"],
  { revalidate: 60, tags: [POSTS_TAG] },
);

export async function getPublicPreviews(): Promise<PostPreview[]> {
  // Demo data lives in memory and changes instantly, so it is never cached.
  if (isDemoMode) return getRepo().listPreviews();
  return cachedPreviews();
}
