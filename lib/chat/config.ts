import "server-only";
import { aiConfig, isAiConfigured } from "@/lib/ai/config";

/**
 * The assistant uses the same model pairing as the Reflex Loop voice agent it
 * is adapted from: Groq for speed, with Gemini as the fallback. The keys and
 * model names live in lib/ai/config.ts, shared with the enrichment pipeline.
 */
export const chatConfig = {
  ...aiConfig,
  temperature: 0.5,
  maxTokens: 500,
  /** How many experiences are handed to the model as reference material. */
  maxSources: 4,
  /**
   * Candidates each retriever returns before the two are fused. Wider than
   * maxSources so the fusion has something to choose between.
   */
  candidatePool: 10,
  /** Below this cosine similarity a vector match is noise, not a match. */
  minSimilarity: 0.3,
  /** Characters of each experience included in the prompt. */
  sourceChars: 1200,
  /**
   * Rows pulled for the archive overview. These carry no description, so this
   * can be far larger than maxSources without crowding the prompt.
   */
  archiveLimit: 1000,
  /** Companies and exams named in the overview, most experiences first. */
  maxArchiveNames: 120,
  /** Topics named in the overview, most asked first. */
  maxArchiveTopics: 25,
  /** Recent messages kept word for word; older ones are folded into a summary. */
  keepMessages: 8,
  /** Per-member limit: this many questions per window. */
  rateLimit: { max: 20, windowMs: 5 * 60_000 },
} as const;

/** True when at least one AI model can be called. */
export const isChatModelConfigured = isAiConfigured;
