import "server-only";
import { chatConfig } from "./config";
import type { ChatPrompt } from "./prompt";
import type { ChatEngine } from "./types";

/** Reads a server-sent-event response and yields the JSON payload of each event. */
async function* sseEvents(response: Response): AsyncGenerator<unknown> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const raw of lines) {
        const line = raw.trim();
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (!data || data === "[DONE]") continue;
        try {
          yield JSON.parse(data);
        } catch {
          // A partial or non-JSON keep-alive line. Skip it.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

async function failure(name: string, response: Response): Promise<Error> {
  const detail = (await response.text().catch(() => "")).slice(0, 200);
  return new Error(`${name} answered ${response.status}. ${detail}`);
}

async function* streamGroq(prompt: ChatPrompt, signal: AbortSignal): AsyncGenerator<string> {
  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${chatConfig.groqKey}` },
    body: JSON.stringify({
      model: chatConfig.groqModel,
      messages: [{ role: "system", content: prompt.system }, ...prompt.messages],
      temperature: chatConfig.temperature,
      max_tokens: chatConfig.maxTokens,
      stream: true,
    }),
  });
  if (!response.ok) throw await failure("Groq", response);

  for await (const event of sseEvents(response)) {
    const text = (event as { choices?: { delta?: { content?: string } }[] }).choices?.[0]?.delta?.content;
    if (text) yield text;
  }
}

async function* streamGemini(prompt: ChatPrompt, signal: AbortSignal): AsyncGenerator<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(chatConfig.geminiModel)}:streamGenerateContent?alt=sse`;
  const response = await fetch(url, {
    method: "POST",
    signal,
    headers: { "Content-Type": "application/json", "x-goog-api-key": chatConfig.geminiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: prompt.system }] },
      contents: prompt.messages.map((message) => ({
        role: message.role === "assistant" ? "model" : "user",
        parts: [{ text: message.content }],
      })),
      generationConfig: { temperature: chatConfig.temperature, maxOutputTokens: chatConfig.maxTokens },
    }),
  });
  if (!response.ok) throw await failure("Gemini", response);

  for await (const event of sseEvents(response)) {
    const parts = (event as { candidates?: { content?: { parts?: { text?: string }[] } }[] }).candidates?.[0]?.content?.parts;
    const text = parts?.map((part) => part.text ?? "").join("");
    if (text) yield text;
  }
}

export interface ChatProvider {
  engine: Exclude<ChatEngine, "archive">;
  stream: (prompt: ChatPrompt, signal: AbortSignal) => AsyncGenerator<string>;
}

/** Configured models in the order they are tried: Groq first, Gemini as the fallback. */
export function chatProviders(): ChatProvider[] {
  const providers: ChatProvider[] = [];
  if (chatConfig.groqKey) providers.push({ engine: "groq", stream: streamGroq });
  if (chatConfig.geminiKey) providers.push({ engine: "gemini", stream: streamGemini });
  return providers;
}
