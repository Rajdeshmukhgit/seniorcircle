import "server-only";

/**
 * The model keys the site uses, in one place: the assistant streams answers
 * with them (lib/chat), and the enrichment pipeline embeds and reads
 * experiences with them (lib/ai). Server-only -- none of this reaches the
 * browser.
 */
export const aiConfig = {
  groqKey: process.env.GROQ_API_KEY?.trim() || "",
  // Groq retires models fairly often (llama-3.1-8b-instant went in August 2026).
  // If a reply ever says the model was decommissioned, set GROQ_MODEL in
  // .env.local to a current one from https://console.groq.com/docs/models.
  groqModel: process.env.GROQ_MODEL?.trim() || "openai/gpt-oss-20b",
  geminiKey: process.env.GEMINI_API_KEY?.trim() || "",
  geminiModel: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
  /**
   * Gemini's embedding model. Its output width must match the vector(768)
   * column in migration 0002 -- change one and you must change the other, and
   * re-embed every experience.
   */
  embedModel: process.env.GEMINI_EMBED_MODEL?.trim() || "text-embedding-004",
  embedDimensions: 768,
  /** Longest write-up handed to the embedding model, in characters. */
  embedChars: 8000,
  /** Give up on a model that has not answered within this time. */
  timeoutMs: 30_000,
  /**
   * Experiences processed by one click of the admin backfill. Small, because
   * the free tiers of both providers rate-limit bursts and the request has to
   * return.
   */
  backfillBatch: 5,
} as const;

/** True when at least one chat model can be called. */
export const isAiConfigured = Boolean(aiConfig.groqKey || aiConfig.geminiKey);

/** Embeddings come from Gemini, so semantic search needs that key specifically. */
export const isEmbeddingConfigured = Boolean(aiConfig.geminiKey);
