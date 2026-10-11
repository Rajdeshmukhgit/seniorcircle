import { z } from "zod";
import { embedQuery, toVectorLiteral } from "@/lib/ai/embed";
import { getCurrentUser } from "@/lib/auth/session";
import { buildArchiveOverview } from "@/lib/chat/archive";
import { chatConfig, isChatModelConfigured } from "@/lib/chat/config";
import { buildPrompt } from "@/lib/chat/prompt";
import { chatProviders } from "@/lib/chat/providers";
import { allowChatMessage } from "@/lib/chat/rate-limit";
import { fuse, keywords, rankPosts, toSource } from "@/lib/chat/retrieval";
import { CHAT_LIMITS, type ChatEngine, type ChatEvent } from "@/lib/chat/types";
import { getRepo } from "@/lib/data";
import { excerpt } from "@/lib/utils";
import type { Post } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(4000),
      }),
    )
    .min(1)
    .max(CHAT_LIMITS.historyMessages),
});

const refuse = (status: number, message: string) => Response.json({ message }, { status });

/**
 * Nearest experiences by meaning. Returns nothing -- and the caller falls back
 * to keywords alone -- when there is no embedding key, when Gemini cannot be
 * reached, or when nothing has been embedded yet.
 */
async function searchByMeaning(question: string, previous?: string): Promise<Post[]> {
  // A follow-up such as "what about the HR round?" carries almost no retrievable
  // content of its own, so it is embedded together with what came before it.
  const text = previous && keywords(question).length < 3 ? `${previous} ${question}` : question;

  try {
    const vector = await embedQuery(text);
    if (!vector) return [];
    return await getRepo().searchPostsByVector(
      toVectorLiteral(vector),
      chatConfig.candidatePool,
      chatConfig.minSimilarity,
    );
  } catch (error) {
    console.error("[chat] semantic search failed:", error);
    return [];
  }
}

/** What the member sees when no AI model can be reached: the matching experiences themselves. */
function archiveAnswer(posts: Post[]): string {
  const reason = isChatModelConfigured
    ? "I can't reach the AI model right now"
    : "The AI model isn't set up on this site yet";
  if (posts.length === 0) {
    return `${reason}, and no experience matched your question. Try the search on the Experiences page.`;
  }
  const list = posts.map((post) => `- **${post.title}**: ${excerpt(post.description, 150)}`).join("\n");
  return `${reason}, so here are the experiences that match your question:\n${list}`;
}

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return refuse(401, "Sign in to use the assistant.");

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return refuse(400, "That message could not be read. Please try again.");

  const history = parsed.data.messages;
  const question = history[history.length - 1];
  if (question.role !== "user") return refuse(400, "Send a question to get an answer.");
  if (question.content.length > CHAT_LIMITS.messageLength) {
    return refuse(400, `Keep your message under ${CHAT_LIMITS.messageLength} characters.`);
  }

  if (!allowChatMessage(user.id)) {
    return refuse(429, "You have asked a lot in a short time. Wait a few minutes and try again.");
  }

  // Read through the normal data layer, so the assistant only ever sees the
  // experiences this member is allowed to read. Two reads: the newest
  // experiences in full, to quote from, and a description-free digest of every
  // experience, so the assistant can answer questions about the archive as a
  // whole ("which companies have come to campus") that match no single post.
  const repo = getRepo();
  let posts: Post[] = [];
  let archive = "";
  try {
    const [recent, digests] = await Promise.all([
      repo.listPosts({}),
      repo.listPostDigests(chatConfig.archiveLimit),
    ]);
    posts = recent;
    archive = buildArchiveOverview(digests, digests.length >= chatConfig.archiveLimit);
  } catch (error) {
    console.error("[chat] could not read the archive:", error);
    // The assistant still answers general questions without it.
  }

  const previous = history.slice(0, -1).reverse().find((message) => message.role === "user");

  // Two retrievers, fused. Keyword scoring is exact -- it never misses a
  // company named outright -- but it only finds experiences that share words
  // with the question. Vector search finds the ones that share meaning:
  // "which companies ask system design" matches a write-up using neither word.
  const byKeyword = rankPosts(question.content, posts, chatConfig.candidatePool, previous?.content);
  const byMeaning = await searchByMeaning(question.content, previous?.content);
  const relevant =
    byMeaning.length > 0 ? fuse([byKeyword, byMeaning], chatConfig.maxSources) : byKeyword.slice(0, chatConfig.maxSources);
  const prompt = buildPrompt(user, history, relevant, archive);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatEvent) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          // The member closed the chat or pressed stop, so nobody is listening.
        }
      };
      send({ type: "sources", sources: relevant.map(toSource) });

      let engine: ChatEngine | null = null;
      const failures: string[] = [];

      for (const provider of chatProviders()) {
        const abort = new AbortController();
        const timer = setTimeout(() => abort.abort(), chatConfig.timeoutMs);
        const onClientAbort = () => abort.abort();
        request.signal.addEventListener("abort", onClientAbort);
        let started = false;

        try {
          for await (const text of provider.stream(prompt, abort.signal)) {
            started = true;
            send({ type: "token", text });
          }
          if (started) engine = provider.engine;
        } catch (error) {
          if (!request.signal.aborted) {
            console.error(`[chat] ${provider.engine} failed:`, error);
            failures.push(`${provider.engine}: ${error instanceof Error ? error.message : String(error)}`);
          }
          if (started) {
            // Part of an answer is already on screen, so do not start another model.
            engine = provider.engine;
            send({ type: "error", message: "The answer was cut off. Ask again to get the rest." });
          }
        } finally {
          clearTimeout(timer);
          request.signal.removeEventListener("abort", onClientAbort);
        }

        if (engine || request.signal.aborted) break;
      }

      if (!engine && !request.signal.aborted) {
        send({ type: "token", text: archiveAnswer(relevant) });
        engine = "archive";
        // While developing, show why the model could not be reached. In
        // production the member only sees the plain message above.
        if (failures.length > 0 && process.env.NODE_ENV !== "production") {
          send({ type: "error", message: failures.join(" | ").slice(0, 400) });
        }
      }

      if (engine) send({ type: "done", engine });
      try {
        controller.close();
      } catch {
        // Already closed by the browser.
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
