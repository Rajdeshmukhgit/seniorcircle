import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  AdminStats,
  Comment,
  ConnectRequest,
  Notification,
  PendingAlumni,
  Post,
  PostDigest,
  PostPreview,
  PostReport,
  PublicProfile,
  RankedPost,
  VoteBreakdown,
  VoteValue,
} from "@/types";
import type { Repo } from "./repo";

/** Profile columns members may read. Email is not granted (see the migration). */
export const PROFILE_COLUMNS = "id, role, verification_status, name, branch, graduation_year, created_at";

// `embedding` is deliberately absent: 768 floats per row that no page uses.
// `upvotes` and `downvotes` are absent because members are not granted them --
// only the net score (see migration 0002, section 8).
const POST_COLUMNS = `id, author_id, title, company_or_exam, description, category, role, branch, graduation_year, tags, created_at, updated_at,
  insights, topics, difficulty, round_count, outcome, score,
  author:profiles!posts_author_id_fkey(${PROFILE_COLUMNS}),
  comments(count)`;

const CONNECT_COLUMNS = `id, post_id, requester_id, recipient_id, status, created_at, updated_at,
  requester:profiles!connect_requests_requester_id_fkey(${PROFILE_COLUMNS}),
  recipient:profiles!connect_requests_recipient_id_fkey(${PROFILE_COLUMNS}),
  post:posts(title)`;

type PostRow = Omit<Post, "comment_count"> & { comments: { count: number }[] };

type ConnectRow = Omit<ConnectRequest, "post_title" | "contact_email"> & { post: { title: string } | null };

interface ReportRow {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  status: PostReport["status"];
  created_at: string;
  reporter: { name: string } | null;
  post: { title: string; author: { name: string } | null } | null;
}

/** Everything migration 0002 adds. A missing one means it has not been applied. */
const MIGRATION_0002 = [
  "embedding", "insights", "topics", "difficulty", "round_count", "outcome",
  "enriched_at", "upvotes", "downvotes", "score", "hot",
];

const MIGRATION_0002_FUNCTIONS = /match_posts|set_post_enrichment|posts_needing_enrichment|admin_vote_breakdown/;

/**
 * Postgres says "column posts.insights does not exist", which is true but does
 * not say what to do about it. The app is then ahead of the database, which
 * happens when a migration has not been run -- or was run and rolled back,
 * since the SQL editor executes a file in one transaction and a single failure
 * reverts all of it. Name the file instead of making somebody work it out.
 */
function explain(message: string): string {
  const column = /column [\w.]*?"?(\w+)"? does not exist/i.exec(message);
  const missing =
    (column && MIGRATION_0002.includes(column[1])) ||
    /relation "?(public\.)?post_votes"? does not exist/i.test(message) ||
    (MIGRATION_0002_FUNCTIONS.test(message) && /could not find|does not exist/i.test(message));

  if (!missing) return message;
  return `${message} — the database is missing the search, insight and vote columns. Run supabase/migrations/0002_search_insights_votes.sql in the Supabase SQL editor, then reload.`;
}

/** Turns a Supabase error into a thrown Error the actions can show. */
function check<T>(result: { data: T; error: { message: string } | null }): T {
  if (result.error) throw new Error(explain(result.error.message));
  return result.data;
}

function toPost(row: PostRow): Post {
  const { comments, ...post } = row;
  return { ...post, comment_count: comments?.[0]?.count ?? 0 };
}

/** PostgREST filter strings treat these characters as syntax. */
function sanitizeSearch(q: string): string {
  return q.replace(/[,()%*\\"{}]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

async function toConnect(row: ConnectRow, viewerId: string | null): Promise<ConnectRequest> {
  const { post, ...request } = row;
  let contact_email: string | null = null;

  if (request.status === "accepted" && viewerId) {
    const supabase = await createClient();
    const other = viewerId === request.requester_id ? request.recipient_id : request.requester_id;
    const { data } = await supabase.rpc("get_contact_email", { other_user: other });
    contact_email = (data as string | null) ?? null;
  }

  return { ...request, post_title: post?.title ?? "a removed experience", contact_email };
}

export const supabaseRepo: Repo = {
  async listPreviews() {
    const supabase = await createClient();
    const result = await supabase
      .from("post_previews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(40);
    return check(result) as PostPreview[];
  },

  async listPosts(filters) {
    const supabase = await createClient();
    let query = supabase.from("posts").select(POST_COLUMNS);

    if (filters.company) query = query.ilike("company_or_exam", filters.company.replace(/[%_]/g, " "));
    if (filters.category) query = query.eq("category", filters.category);
    if (filters.branch) query = query.eq("branch", filters.branch);
    if (filters.year) query = query.eq("graduation_year", filters.year);

    const q = filters.q ? sanitizeSearch(filters.q) : "";
    if (q) {
      const tag = q.toLowerCase().replace(/\s+/g, "-");
      query = query.or(
        `title.ilike.%${q}%,company_or_exam.ilike.%${q}%,description.ilike.%${q}%,role.ilike.%${q}%,tags.cs.{${tag}}`,
      );
    }

    const result = await query.order("created_at", { ascending: false }).limit(60);
    const posts = (check(result) as unknown as PostRow[]).map(toPost);

    if (filters.sort === "helpful") {
      posts.sort((a, b) => b.comment_count - a.comment_count || b.created_at.localeCompare(a.created_at));
    }
    return posts;
  },

  async listCompanies() {
    const supabase = await createClient();
    const result = await supabase.from("posts").select("company_or_exam").limit(500);
    const rows = check(result) as { company_or_exam: string }[];
    return [...new Set(rows.map((r) => r.company_or_exam))].sort((a, b) => a.localeCompare(b));
  },

  async listPostDigests(limit) {
    const supabase = await createClient();
    const result = await supabase
      .from("posts")
      .select("company_or_exam, category, role, branch, graduation_year, created_at, topics, difficulty")
      .order("created_at", { ascending: false })
      .limit(limit);
    return check(result) as unknown as PostDigest[];
  },

  async searchPostsByVector(embedding, limit, minSimilarity) {
    const supabase = await createClient();
    const matched = await supabase.rpc("match_posts", {
      query_embedding: embedding,
      match_count: limit,
      min_similarity: minSimilarity,
    });
    const hits = check(matched) as { id: string; similarity: number }[];
    if (hits.length === 0) return [];

    // The RPC returns ids by distance; this fetches the rows and puts them
    // back into that order, which PostgREST's `in` filter does not preserve.
    const result = await supabase
      .from("posts")
      .select(POST_COLUMNS)
      .in("id", hits.map((hit) => hit.id));
    const rank = new Map(hits.map((hit, index) => [hit.id, index]));
    return (check(result) as unknown as PostRow[])
      .map(toPost)
      .sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
  },

  async setPostEnrichment(id, enrichment) {
    const supabase = await createClient();
    const result = await supabase.rpc("set_post_enrichment", {
      target: id,
      new_embedding: enrichment.embedding,
      new_insights: enrichment.insights,
      new_topics: enrichment.topics,
      new_difficulty: enrichment.difficulty,
      new_round_count: enrichment.round_count,
      new_outcome: enrichment.outcome,
    });
    if (result.error) throw new Error(result.error.message);
  },

  async listPostsNeedingEnrichment(batch) {
    const supabase = await createClient();
    const result = await supabase.rpc("posts_needing_enrichment", { batch });
    return (check(result) as { id: string }[]).map((row) => row.id);
  },

  async listTrending(viewerId, limit) {
    const supabase = await createClient();
    // `hot` is a stored column kept current by the vote trigger, so this is a
    // plain indexed sort -- no ranking arithmetic at read time.
    const result = await supabase
      .from("posts")
      .select(POST_COLUMNS)
      .order("hot", { ascending: false })
      .limit(limit);
    const posts = (check(result) as unknown as PostRow[]).map(toPost);
    if (posts.length === 0) return [];

    const votes = await supabase
      .from("post_votes")
      .select("post_id, value")
      .eq("voter_id", viewerId)
      .in("post_id", posts.map((post) => post.id));
    // A failure here only costs the highlighted arrow, so the page still renders.
    const mine = new Map((votes.data ?? []).map((vote) => [vote.post_id as string, vote.value as VoteValue]));
    return posts.map((post) => ({ ...post, my_vote: mine.get(post.id) ?? 0 })) as RankedPost[];
  },

  async getVote(voterId, postId) {
    const supabase = await createClient();
    const result = await supabase
      .from("post_votes")
      .select("value")
      .eq("voter_id", voterId)
      .eq("post_id", postId)
      .maybeSingle();
    // Not having voted is the common case, not an error worth surfacing.
    if (result.error) return 0;
    return ((result.data?.value as VoteValue | undefined) ?? 0) as VoteValue;
  },

  async setVote(voterId, postId, value) {
    const supabase = await createClient();
    if (value === 0) {
      const removed = await supabase.from("post_votes").delete().eq("post_id", postId).eq("voter_id", voterId);
      if (removed.error) throw new Error(removed.error.message);
      return;
    }
    const result = await supabase
      .from("post_votes")
      .upsert({ post_id: postId, voter_id: voterId, value }, { onConflict: "post_id,voter_id" });
    if (result.error) throw new Error(result.error.message);
  },

  async listVoteBreakdown(limit) {
    const supabase = await createClient();
    const result = await supabase.rpc("admin_vote_breakdown", { limit_count: limit });
    return check(result) as VoteBreakdown[];
  },

  async getPost(id) {
    const supabase = await createClient();
    const result = await supabase.from("posts").select(POST_COLUMNS).eq("id", id).maybeSingle();
    // An id that is not a uuid makes Postgres raise; treat that as "not found".
    if (result.error) return null;
    return result.data ? toPost(result.data as unknown as PostRow) : null;
  },

  async listPostsByAuthor(authorId) {
    const supabase = await createClient();
    const result = await supabase
      .from("posts")
      .select(POST_COLUMNS)
      .eq("author_id", authorId)
      .order("created_at", { ascending: false });
    return (check(result) as unknown as PostRow[]).map(toPost);
  },

  async createPost(author, input) {
    const supabase = await createClient();
    const result = await supabase
      .from("posts")
      .insert({ ...input, author_id: author.id })
      .select("id")
      .single();
    return (check(result) as { id: string }).id;
  },

  async updatePost(id, input) {
    const supabase = await createClient();
    check(await supabase.from("posts").update(input).eq("id", id));
  },

  async deletePost(id) {
    const supabase = await createClient();
    check(await supabase.from("posts").delete().eq("id", id));
  },

  async listComments(postId) {
    const supabase = await createClient();
    const result = await supabase
      .from("comments")
      .select(`id, post_id, author_id, body, created_at, author:profiles!comments_author_id_fkey(${PROFILE_COLUMNS})`)
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    return check(result) as unknown as Comment[];
  },

  async getCommentOwner(id) {
    const supabase = await createClient();
    const { data } = await supabase.from("comments").select("author_id, post_id").eq("id", id).maybeSingle();
    return (data as { author_id: string; post_id: string } | null) ?? null;
  },

  async addComment(author, post, body) {
    // The post author's notification is written by a database trigger.
    const supabase = await createClient();
    check(await supabase.from("comments").insert({ post_id: post.id, author_id: author.id, body }));
  },

  async deleteComment(id) {
    const supabase = await createClient();
    check(await supabase.from("comments").delete().eq("id", id));
  },

  async getConnectForPost(viewerId, postId) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("connect_requests")
      .select(CONNECT_COLUMNS)
      .eq("requester_id", viewerId)
      .eq("post_id", postId)
      .maybeSingle();
    return data ? toConnect(data as unknown as ConnectRow, viewerId) : null;
  },

  async getConnect(id) {
    const supabase = await createClient();
    const { data } = await supabase.from("connect_requests").select(CONNECT_COLUMNS).eq("id", id).maybeSingle();
    return data ? toConnect(data as unknown as ConnectRow, null) : null;
  },

  async listConnects(viewerId) {
    const supabase = await createClient();
    // RLS already limits this to requests the viewer sent or received.
    const result = await supabase
      .from("connect_requests")
      .select(CONNECT_COLUMNS)
      .order("created_at", { ascending: false });
    const rows = await Promise.all(
      (check(result) as unknown as ConnectRow[]).map((row) => toConnect(row, viewerId)),
    );
    return {
      incoming: rows.filter((r) => r.recipient_id === viewerId),
      outgoing: rows.filter((r) => r.requester_id === viewerId),
    };
  },

  async createConnect(requester, post) {
    const supabase = await createClient();
    check(
      await supabase
        .from("connect_requests")
        .insert({ post_id: post.id, requester_id: requester.id, recipient_id: post.author_id }),
    );
  },

  async respondConnect(request, status) {
    const supabase = await createClient();
    check(await supabase.from("connect_requests").update({ status }).eq("id", request.id));
  },

  async listNotifications(userId) {
    const supabase = await createClient();
    const result = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);
    return check(result) as Notification[];
  },

  async unreadCount(userId) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false);
    return count ?? 0;
  },

  async markNotificationRead(userId, id) {
    const supabase = await createClient();
    check(await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", userId));
  },

  async markAllNotificationsRead(userId) {
    const supabase = await createClient();
    check(await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false));
  },

  async hasReported(reporterId, postId) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("post_reports")
      .select("id", { count: "exact", head: true })
      .eq("reporter_id", reporterId)
      .eq("post_id", postId);
    return (count ?? 0) > 0;
  },

  async reportPost(reporter, postId, reason) {
    const supabase = await createClient();
    check(await supabase.from("post_reports").insert({ post_id: postId, reporter_id: reporter.id, reason }));
  },

  async getProfile(id) {
    const supabase = await createClient();
    const { data } = await supabase.from("profiles").select(PROFILE_COLUMNS).eq("id", id).maybeSingle();
    return (data as unknown as PublicProfile | null) ?? null;
  },

  async updateProfile(id, input) {
    const supabase = await createClient();
    check(await supabase.from("profiles").update(input).eq("id", id));
  },

  async profileStats(id) {
    const supabase = await createClient();
    const [posts, comments] = await Promise.all([
      supabase.from("posts").select("id", { count: "exact", head: true }).eq("author_id", id),
      supabase.from("comments").select("id", { count: "exact", head: true }).eq("author_id", id),
    ]);
    return { posts: posts.count ?? 0, comments: comments.count ?? 0 };
  },

  async listPendingAlumni() {
    const supabase = await createClient();
    return check(await supabase.rpc("admin_pending_alumni")) as PendingAlumni[];
  },

  async setVerification(userId, status) {
    // Updates the profile and notifies the alumnus inside one database function.
    const supabase = await createClient();
    check(await supabase.rpc("admin_set_verification", { target: userId, new_status: status }));
  },

  async listOpenReports() {
    const supabase = await createClient();
    const result = await supabase
      .from("post_reports")
      .select(
        `id, post_id, reporter_id, reason, status, created_at,
         reporter:profiles!post_reports_reporter_id_fkey(name),
         post:posts(title, author:profiles!posts_author_id_fkey(name))`,
      )
      .eq("status", "open")
      .order("created_at", { ascending: false });

    return (check(result) as unknown as ReportRow[]).map(({ reporter, post, ...report }) => ({
      ...report,
      reporter_name: reporter?.name ?? "A member",
      post_title: post?.title ?? "Removed experience",
      post_author_name: post?.author?.name ?? "Unknown",
    }));
  },

  async dismissReport(id) {
    const supabase = await createClient();
    check(await supabase.from("post_reports").update({ status: "dismissed" }).eq("id", id));
  },

  async stats() {
    const supabase = await createClient();
    return check(await supabase.rpc("admin_stats")) as AdminStats;
  },
};
