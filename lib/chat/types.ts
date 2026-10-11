/** Shared by the chat API route and the chat widget. No server-only code here. */

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

/** An experience the answer drew on, shown as a link under the reply. */
export interface ChatSource {
  id: string;
  title: string;
  company: string;
  author: string;
  year: number;
}

/** Which engine produced the reply. "archive" means no AI model was reachable. */
export type ChatEngine = "groq" | "gemini" | "archive";

/** The API streams one of these per line (newline-delimited JSON). */
export type ChatEvent =
  | { type: "sources"; sources: ChatSource[] }
  | { type: "token"; text: string }
  | { type: "done"; engine: ChatEngine }
  | { type: "error"; message: string };

export const CHAT_LIMITS = {
  /** Longest single message, in characters. */
  messageLength: 1500,
  /** Most messages sent back to the server as conversation history. */
  historyMessages: 30,
} as const;
