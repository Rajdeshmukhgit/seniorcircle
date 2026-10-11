import type {
  AdminStats,
  Comment,
  ConnectRequest,
  FeedFilters,
  Notification,
  PendingAlumni,
  Post,
  PostDigest,
  PostEnrichment,
  PostInput,
  PostPreview,
  PostReport,
  Profile,
  PublicProfile,
  RankedPost,
  VoteBreakdown,
  VoteValue,
} from "@/types";

/**
 * Everything the app reads or writes goes through this interface. There are
 * two implementations: Supabase (lib/data/supabase.ts) and an in-memory demo
 * store (lib/data/mock.ts). Pages and server actions never know which is live.
 *
 * Authorization is checked in the server actions before these are called, and
 * again by Row Level Security when Supabase is the backend.
 */
export interface Repo {
  listPreviews(): Promise<PostPreview[]>;
  listPosts(filters: FeedFilters): Promise<Post[]>;
  listCompanies(): Promise<string[]>;
  /** Every experience, without descriptions, for the assistant's archive overview. */
  listPostDigests(limit: number): Promise<PostDigest[]>;
  /**
   * Experiences nearest an embedding, closest first. Empty when nothing has
   * been embedded yet, which is the signal to fall back to keyword retrieval.
   */
  searchPostsByVector(embedding: string, limit: number, minSimilarity: number): Promise<Post[]>;
  /** Stores what lib/ai worked out about an experience. */
  setPostEnrichment(id: string, enrichment: PostEnrichment): Promise<void>;
  /** Ids of experiences still waiting to be embedded or read. Admin only. */
  listPostsNeedingEnrichment(batch: number): Promise<string[]>;

  /** The trending page: hot ranking, carrying the viewer's own vote. */
  listTrending(viewerId: string, limit: number): Promise<RankedPost[]>;
  /** The viewer's own vote on one experience, 0 when they have not voted. */
  getVote(voterId: string, postId: string): Promise<VoteValue>;
  /** Casts, changes or withdraws a vote. 0 withdraws it. */
  setVote(voterId: string, postId: string, value: VoteValue): Promise<void>;
  /** Upvotes and downvotes separately. Admin only -- members never see the split. */
  listVoteBreakdown(limit: number): Promise<VoteBreakdown[]>;
  getPost(id: string): Promise<Post | null>;
  listPostsByAuthor(authorId: string): Promise<Post[]>;
  createPost(author: Profile, input: PostInput): Promise<string>;
  updatePost(id: string, input: PostInput): Promise<void>;
  deletePost(id: string): Promise<void>;

  listComments(postId: string): Promise<Comment[]>;
  getCommentOwner(id: string): Promise<{ author_id: string; post_id: string } | null>;
  addComment(author: Profile, post: Post, body: string): Promise<void>;
  deleteComment(id: string): Promise<void>;

  getConnectForPost(viewerId: string, postId: string): Promise<ConnectRequest | null>;
  getConnect(id: string): Promise<ConnectRequest | null>;
  listConnects(viewerId: string): Promise<{ incoming: ConnectRequest[]; outgoing: ConnectRequest[] }>;
  createConnect(requester: Profile, post: Post): Promise<void>;
  respondConnect(request: ConnectRequest, status: "accepted" | "declined"): Promise<void>;

  listNotifications(userId: string): Promise<Notification[]>;
  unreadCount(userId: string): Promise<number>;
  markNotificationRead(userId: string, id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;

  hasReported(reporterId: string, postId: string): Promise<boolean>;
  reportPost(reporter: Profile, postId: string, reason: string): Promise<void>;

  getProfile(id: string): Promise<PublicProfile | null>;
  updateProfile(id: string, input: { name: string; branch: string }): Promise<void>;
  profileStats(id: string): Promise<{ posts: number; comments: number }>;

  listPendingAlumni(): Promise<PendingAlumni[]>;
  setVerification(userId: string, status: "verified" | "rejected"): Promise<void>;
  listOpenReports(): Promise<PostReport[]>;
  dismissReport(id: string): Promise<void>;
  stats(): Promise<AdminStats>;
}
