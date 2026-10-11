import "server-only";
import { chatConfig } from "./config";

// In memory, per server process. Enough to stop one member draining the free
// API quota. A multi-instance deployment would move this to the database.
const globalHits = globalThis as unknown as { __chatHits?: Map<string, number[]> };
const hits = (globalHits.__chatHits ??= new Map<string, number[]>());

/** Records one question for this member. Returns false when they are over the limit. */
export function allowChatMessage(userId: string, now = Date.now()): boolean {
  const { max, windowMs } = chatConfig.rateLimit;
  const recent = (hits.get(userId) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= max) {
    hits.set(userId, recent);
    return false;
  }
  recent.push(now);
  hits.set(userId, recent);
  return true;
}
