export type Role = "junior" | "senior" | "alumni" | "admin";

export type VerificationStatus = "not_required" | "pending" | "verified" | "rejected";

export type Category = "interview" | "internship" | "exam" | "certification";

export type ConnectStatus = "pending" | "accepted" | "declined";

export type ReportStatus = "open" | "dismissed";

/** How an experience ended, as the write-up reports it. */
export type Outcome = "selected" | "rejected" | "in_progress" | "unknown";

/** A vote is up, down, or taken back. */
export type VoteValue = -1 | 0 | 1;

export type NotificationType =
  | "comment"
  | "connect_request"
  | "connect_accepted"
  | "connect_declined"
  | "verification_approved"
  | "verification_rejected";

export interface Profile {
  id: string;
  email: string;
  role: Role;
  verification_status: VerificationStatus;
  name: string;
  branch: string;
  graduation_year: number;
  created_at: string;
}

/** What other members may see of a profile. Email is never included. */
export type PublicProfile = Omit<Profile, "email">;

/** One stage of a process, as the model read it out of the write-up. */
export interface PostRound {
  name: string;
  focus: string;
  difficulty: number | null;
}

/**
 * The structure a model pulled out of an experience (lib/ai/extract.ts). Null
 * on a post that has not been read yet, or when no model could be reached.
 */
export interface PostInsights {
  summary: string;
  rounds: PostRound[];
  topics: string[];
  preparation: string[];
  difficulty: number | null;
  outcome: Outcome;
  duration_weeks: number | null;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  company_or_exam: string;
  description: string;
  category: Category;
  role: string | null;
  branch: string;
  graduation_year: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  author: PublicProfile;
  comment_count: number;
  /** Filled in by the enrichment pipeline. Null until an experience is read. */
  insights: PostInsights | null;
  topics: string[];
  difficulty: number | null;
  round_count: number | null;
  outcome: Outcome | null;
  /** Upvotes minus downvotes. Members never see the two numbers separately. */
  score: number;
}

/** An experience on the trending page, carrying the viewer's own vote. */
export interface RankedPost extends Post {
  my_vote: VoteValue;
}

/** The vote split behind one experience. Administrators only. */
export interface VoteBreakdown {
  id: string;
  title: string;
  company_or_exam: string;
  upvotes: number;
  downvotes: number;
  score: number;
  created_at: string;
}

/** The public teaser shown on the homepage to signed-out visitors. */
export interface PostPreview {
  id: string;
  title: string;
  company_or_exam: string;
  category: Category;
  role: string | null;
  branch: string;
  graduation_year: number;
  excerpt: string;
  created_at: string;
  author_name: string;
  author_role: Role;
  comment_count: number;
}

/**
 * One row per experience, with no description. The assistant builds its
 * archive overview from these, so it can see every experience on the site
 * without pulling every description into the prompt.
 */
export interface PostDigest {
  company_or_exam: string;
  category: Category;
  role: string | null;
  branch: string;
  graduation_year: number;
  created_at: string;
  topics: string[];
  difficulty: number | null;
}

/** What the enrichment pipeline writes back. Any field may be null: the two
 *  halves (embedding, insights) succeed or fail independently. */
export interface PostEnrichment {
  embedding: string | null;
  insights: PostInsights | null;
  topics: string[] | null;
  difficulty: number | null;
  round_count: number | null;
  outcome: Outcome | null;
}

export interface PostInput {
  title: string;
  company_or_exam: string;
  description: string;
  category: Category;
  role: string | null;
  branch: string;
  graduation_year: number;
  tags: string[];
}

export interface Comment {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  created_at: string;
  author: PublicProfile;
}

export interface ConnectRequest {
  id: string;
  post_id: string;
  requester_id: string;
  recipient_id: string;
  status: ConnectStatus;
  created_at: string;
  updated_at: string;
  requester: PublicProfile;
  recipient: PublicProfile;
  post_title: string;
  /** Email of the other person. Only present once the request is accepted. */
  contact_email: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  reference_id: string | null;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface PostReport {
  id: string;
  post_id: string;
  reporter_id: string;
  reason: string;
  status: ReportStatus;
  created_at: string;
  reporter_name: string;
  post_title: string;
  post_author_name: string;
}

export interface PendingAlumni extends PublicProfile {
  email: string;
}

export interface FeedFilters {
  q?: string;
  company?: string;
  category?: Category;
  branch?: string;
  year?: number;
  sort?: "latest" | "helpful";
}

export interface AdminStats {
  users: number;
  verifiedAlumni: number;
  experiences: number;
  connectRequests: number;
}

/** Result shape returned by every server action that a form submits to. */
export interface ActionState {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
}
