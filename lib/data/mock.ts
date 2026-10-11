import "server-only";
import { excerpt } from "@/lib/utils";
import {
  seedComments,
  seedConnects,
  seedNotifications,
  seedPosts,
  seedProfiles,
  seedReports,
  seedVotes,
  type SeedComment,
  type SeedConnect,
  type SeedNotification,
  type SeedPost,
  type SeedReport,
  type SeedVote,
} from "@/lib/mock/seed";
import type {
  ConnectRequest,
  NotificationType,
  Post,
  PostDigest,
  PostEnrichment,
  Profile,
  PublicProfile,
  RankedPost,
  VoteBreakdown,
  VoteValue,
} from "@/types";
import type { Repo } from "./repo";

interface Store {
  profiles: Profile[];
  posts: SeedPost[];
  comments: SeedComment[];
  connects: SeedConnect[];
  notifications: SeedNotification[];
  reports: SeedReport[];
  votes: SeedVote[];
}

// Kept on globalThis so the data survives hot reloads in `next dev`.
// It is reset whenever the server process restarts.
const globalStore = globalThis as unknown as { __demoStore?: Store };

export function demoStore(): Store {
  if (!globalStore.__demoStore) {
    globalStore.__demoStore = structuredClone({
      profiles: seedProfiles,
      posts: seedPosts,
      comments: seedComments,
      connects: seedConnects,
      notifications: seedNotifications,
      reports: seedReports,
      votes: seedVotes,
    });
  }
  return globalStore.__demoStore;
}

const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
const now = () => new Date().toISOString();

function toPublic(profile: Profile): PublicProfile {
  return {
    id: profile.id,
    role: profile.role,
    verification_status: profile.verification_status,
    name: profile.name,
    branch: profile.branch,
    graduation_year: profile.graduation_year,
    created_at: profile.created_at,
  };
}

function mustProfile(id: string): Profile {
  const profile = demoStore().profiles.find((p) => p.id === id);
  if (!profile) throw new Error("That member no longer exists.");
  return profile;
}

function hydratePost(post: SeedPost): Post {
  return {
    ...post,
    // The demo data carries no enrichment: there is no model behind it. The
    // shape still has to match what Supabase returns.
    insights: post.insights ?? null,
    topics: post.topics ?? [],
    difficulty: post.difficulty ?? null,
    round_count: post.round_count ?? null,
    outcome: post.outcome ?? null,
    score: postScore(post.id),
    author: toPublic(mustProfile(post.author_id)),
    comment_count: demoStore().comments.filter((c) => c.post_id === post.id).length,
  };
}

const postScore = (postId: string) =>
  demoStore()
    .votes.filter((vote) => vote.post_id === postId)
    .reduce((total, vote) => total + vote.value, 0);

/**
 * The same ranking the database computes in hot_rank() (migration 0002): the
 * age always counts and the score shifts it, so an unvoted experience still
 * sorts by recency instead of collapsing to zero.
 */
function hotRank(score: number, createdAt: string): number {
  return Math.sign(score) * Math.log10(Math.max(Math.abs(score), 1)) + Date.parse(createdAt) / 1000 / 45000;
}

function hydrateConnect(request: SeedConnect, viewerId: string | null): ConnectRequest {
  const requester = mustProfile(request.requester_id);
  const recipient = mustProfile(request.recipient_id);
  const other = viewerId === requester.id ? recipient : requester;
  return {
    ...request,
    requester: toPublic(requester),
    recipient: toPublic(recipient),
    post_title: demoStore().posts.find((p) => p.id === request.post_id)?.title ?? "a removed experience",
    contact_email: request.status === "accepted" && viewerId ? other.email : null,
  };
}

function notify(userId: string, type: NotificationType, referenceId: string | null, message: string) {
  demoStore().notifications.unshift({
    id: newId("n"),
    user_id: userId,
    type,
    reference_id: referenceId,
    message,
    is_read: false,
    created_at: now(),
  });
}

const byNewest = <T extends { created_at: string }>(a: T, b: T) => b.created_at.localeCompare(a.created_at);

export const mockRepo: Repo = {
  async listPreviews() {
    return demoStore()
      .posts.map(hydratePost)
      .sort(byNewest)
      .map((post) => ({
        id: post.id,
        title: post.title,
        company_or_exam: post.company_or_exam,
        category: post.category,
        role: post.role,
        branch: post.branch,
        graduation_year: post.graduation_year,
        excerpt: excerpt(post.description, 200),
        created_at: post.created_at,
        author_name: post.author.name,
        author_role: post.author.role,
        comment_count: post.comment_count,
      }));
  },

  async listPosts(filters) {
    const q = filters.q?.trim().toLowerCase();
    const posts = demoStore()
      .posts.filter((post) => {
        if (filters.company && post.company_or_exam.toLowerCase() !== filters.company.toLowerCase()) return false;
        if (filters.category && post.category !== filters.category) return false;
        if (filters.branch && post.branch !== filters.branch) return false;
        if (filters.year && post.graduation_year !== filters.year) return false;
        if (q) {
          const haystack = [post.title, post.company_or_exam, post.description, post.role ?? "", ...post.tags]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      })
      .map(hydratePost)
      .sort(byNewest);
    if (filters.sort === "helpful") {
      posts.sort((a, b) => b.comment_count - a.comment_count || byNewest(a, b));
    }
    return posts;
  },

  async listCompanies() {
    return [...new Set(demoStore().posts.map((p) => p.company_or_exam))].sort((a, b) => a.localeCompare(b));
  },

  async listPostDigests(limit) {
    return demoStore()
      .posts.slice()
      .sort(byNewest)
      .slice(0, limit)
      .map((post) => ({
        company_or_exam: post.company_or_exam,
        category: post.category,
        role: post.role,
        branch: post.branch,
        graduation_year: post.graduation_year,
        created_at: post.created_at,
        topics: post.topics ?? [],
        difficulty: post.difficulty ?? null,
      })) as PostDigest[];
  },

  // Demo data has no embeddings, so there is nothing to search by meaning.
  // Returning nothing is the signal for the caller to fall back to keywords.
  async searchPostsByVector() {
    return [];
  },

  async setPostEnrichment(id: string, enrichment: PostEnrichment) {
    const post = demoStore().posts.find((p) => p.id === id);
    if (!post) throw new Error("That experience no longer exists.");
    if (enrichment.insights !== null) post.insights = enrichment.insights;
    if (enrichment.topics !== null) post.topics = enrichment.topics;
    if (enrichment.difficulty !== null) post.difficulty = enrichment.difficulty;
    if (enrichment.round_count !== null) post.round_count = enrichment.round_count;
    if (enrichment.outcome !== null) post.outcome = enrichment.outcome;
  },

  async listPostsNeedingEnrichment(batch) {
    return demoStore()
      .posts.filter((post) => !post.insights)
      .sort(byNewest)
      .slice(0, batch)
      .map((post) => post.id);
  },

  async listTrending(viewerId, limit) {
    const mine = new Map(
      demoStore()
        .votes.filter((vote) => vote.voter_id === viewerId)
        .map((vote) => [vote.post_id, vote.value as VoteValue]),
    );
    return demoStore()
      .posts.map(hydratePost)
      .sort((a, b) => hotRank(b.score, b.created_at) - hotRank(a.score, a.created_at))
      .slice(0, limit)
      .map((post) => ({ ...post, my_vote: mine.get(post.id) ?? 0 })) as RankedPost[];
  },

  async getVote(voterId, postId) {
    const vote = demoStore().votes.find((v) => v.post_id === postId && v.voter_id === voterId);
    return (vote?.value ?? 0) as VoteValue;
  },

  async setVote(voterId, postId, value) {
    const store = demoStore();
    const post = store.posts.find((p) => p.id === postId);
    if (!post) throw new Error("That experience no longer exists.");
    if (post.author_id === voterId) throw new Error("You cannot vote on your own experience.");

    store.votes = store.votes.filter((vote) => !(vote.post_id === postId && vote.voter_id === voterId));
    if (value !== 0) store.votes.push({ post_id: postId, voter_id: voterId, value });
  },

  async listVoteBreakdown(limit) {
    return demoStore()
      .posts.map((post) => {
        const votes = demoStore().votes.filter((vote) => vote.post_id === post.id);
        const upvotes = votes.filter((vote) => vote.value === 1).length;
        const downvotes = votes.length - upvotes;
        return {
          id: post.id,
          title: post.title,
          company_or_exam: post.company_or_exam,
          upvotes,
          downvotes,
          score: upvotes - downvotes,
          created_at: post.created_at,
        };
      })
      .filter((row) => row.upvotes > 0 || row.downvotes > 0)
      .sort((a, b) => b.downvotes - a.downvotes || a.score - b.score)
      .slice(0, limit) as VoteBreakdown[];
  },

  async getPost(id) {
    const post = demoStore().posts.find((p) => p.id === id);
    return post ? hydratePost(post) : null;
  },

  async listPostsByAuthor(authorId) {
    return demoStore()
      .posts.filter((p) => p.author_id === authorId)
      .map(hydratePost)
      .sort(byNewest);
  },

  async createPost(author, input) {
    const id = newId("p");
    demoStore().posts.push({ id, author_id: author.id, ...input, created_at: now(), updated_at: now() });
    return id;
  },

  async updatePost(id, input) {
    const post = demoStore().posts.find((p) => p.id === id);
    if (!post) throw new Error("That experience no longer exists.");
    Object.assign(post, input, { updated_at: now() });
  },

  async deletePost(id) {
    const store = demoStore();
    store.posts = store.posts.filter((p) => p.id !== id);
    store.comments = store.comments.filter((c) => c.post_id !== id);
    store.connects = store.connects.filter((c) => c.post_id !== id);
    store.reports = store.reports.filter((r) => r.post_id !== id);
  },

  async listComments(postId) {
    return demoStore()
      .comments.filter((c) => c.post_id === postId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((c) => ({ ...c, author: toPublic(mustProfile(c.author_id)) }));
  },

  async getCommentOwner(id) {
    const comment = demoStore().comments.find((c) => c.id === id);
    return comment ? { author_id: comment.author_id, post_id: comment.post_id } : null;
  },

  async addComment(author, post, body) {
    demoStore().comments.push({ id: newId("c"), post_id: post.id, author_id: author.id, body, created_at: now() });
    if (post.author_id !== author.id) {
      notify(post.author_id, "comment", post.id, `${author.name} commented on “${post.title}”.`);
    }
  },

  async deleteComment(id) {
    const store = demoStore();
    store.comments = store.comments.filter((c) => c.id !== id);
  },

  async getConnectForPost(viewerId, postId) {
    const request = demoStore().connects.find((c) => c.requester_id === viewerId && c.post_id === postId);
    return request ? hydrateConnect(request, viewerId) : null;
  },

  async getConnect(id) {
    const request = demoStore().connects.find((c) => c.id === id);
    return request ? hydrateConnect(request, null) : null;
  },

  async listConnects(viewerId) {
    const all = demoStore().connects.slice().sort(byNewest);
    return {
      incoming: all.filter((c) => c.recipient_id === viewerId).map((c) => hydrateConnect(c, viewerId)),
      outgoing: all.filter((c) => c.requester_id === viewerId).map((c) => hydrateConnect(c, viewerId)),
    };
  },

  async createConnect(requester, post) {
    const id = newId("r");
    demoStore().connects.push({
      id,
      post_id: post.id,
      requester_id: requester.id,
      recipient_id: post.author_id,
      status: "pending",
      created_at: now(),
      updated_at: now(),
    });
    notify(post.author_id, "connect_request", id, `${requester.name} wants to connect about “${post.title}”.`);
  },

  async respondConnect(request, status) {
    const stored = demoStore().connects.find((c) => c.id === request.id);
    if (!stored) throw new Error("That request no longer exists.");
    stored.status = status;
    stored.updated_at = now();
    notify(
      request.requester_id,
      status === "accepted" ? "connect_accepted" : "connect_declined",
      request.id,
      `${request.recipient.name} ${status} your connect request.`,
    );
  },

  async listNotifications(userId) {
    return demoStore()
      .notifications.filter((n) => n.user_id === userId)
      .sort(byNewest)
      .slice(0, 50);
  },

  async unreadCount(userId) {
    return demoStore().notifications.filter((n) => n.user_id === userId && !n.is_read).length;
  },

  async markNotificationRead(userId, id) {
    const notification = demoStore().notifications.find((n) => n.id === id && n.user_id === userId);
    if (notification) notification.is_read = true;
  },

  async markAllNotificationsRead(userId) {
    for (const n of demoStore().notifications) if (n.user_id === userId) n.is_read = true;
  },

  async hasReported(reporterId, postId) {
    return demoStore().reports.some((r) => r.reporter_id === reporterId && r.post_id === postId);
  },

  async reportPost(reporter, postId, reason) {
    demoStore().reports.push({
      id: newId("f"),
      post_id: postId,
      reporter_id: reporter.id,
      reason,
      status: "open",
      created_at: now(),
    });
  },

  async getProfile(id) {
    const profile = demoStore().profiles.find((p) => p.id === id);
    return profile ? toPublic(profile) : null;
  },

  async updateProfile(id, input) {
    Object.assign(mustProfile(id), input);
  },

  async profileStats(id) {
    const store = demoStore();
    return {
      posts: store.posts.filter((p) => p.author_id === id).length,
      comments: store.comments.filter((c) => c.author_id === id).length,
    };
  },

  async listPendingAlumni() {
    return demoStore()
      .profiles.filter((p) => p.role === "alumni" && p.verification_status === "pending")
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  async setVerification(userId, status) {
    const profile = mustProfile(userId);
    profile.verification_status = status;
    notify(
      userId,
      status === "verified" ? "verification_approved" : "verification_rejected",
      null,
      status === "verified"
        ? "Your alumni account is verified. You can now share experiences and connect with students."
        : "Your alumni verification was not approved. Contact the coordinator if this looks wrong.",
    );
  },

  async listOpenReports() {
    const store = demoStore();
    return store.reports
      .filter((r) => r.status === "open")
      .sort(byNewest)
      .flatMap((r) => {
        const post = store.posts.find((p) => p.id === r.post_id);
        if (!post) return [];
        return [
          {
            ...r,
            reporter_name: mustProfile(r.reporter_id).name,
            post_title: post.title,
            post_author_name: mustProfile(post.author_id).name,
          },
        ];
      });
  },

  async dismissReport(id) {
    const report = demoStore().reports.find((r) => r.id === id);
    if (report) report.status = "dismissed";
  },

  async stats() {
    const store = demoStore();
    return {
      users: store.profiles.length,
      verifiedAlumni: store.profiles.filter((p) => p.role === "alumni" && p.verification_status === "verified").length,
      experiences: store.posts.length,
      connectRequests: store.connects.length,
    };
  },
};
