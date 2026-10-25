// Unit tests for the shared helpers in lib/utils.ts.
// Run with `npm test` (Node's built-in test runner, no extra dependencies).
import { test } from "node:test";
import assert from "node:assert/strict";
import { cn, excerpt, initials, plural, readingMinutes, timeAgo } from "../lib/utils.ts";

test("cn joins class names and skips falsy parts", () => {
  assert.equal(cn("a", false, null, "b", undefined), "a b");
});

test("initials uses first and last word", () => {
  assert.equal(initials("Raj Deshmukh"), "RD");
  assert.equal(initials("raj"), "R");
  assert.equal(initials("   "), "?");
});

test("plural picks the right form", () => {
  assert.equal(plural(1, "comment"), "1 comment");
  assert.equal(plural(3, "comment"), "3 comments");
});

test("readingMinutes is at least one minute", () => {
  assert.equal(readingMinutes("short text"), 1);
  assert.equal(readingMinutes("word ".repeat(600)), 3);
});

test("excerpt strips markdown and trims to length", () => {
  assert.equal(excerpt("## Title\n**bold** text"), "Title bold text");
  const long = excerpt("x".repeat(300), 10);
  assert.equal(long, "xxxxxxxxxx…");
});

test("timeAgo describes recent times", () => {
  const now = new Date("2026-10-25T12:00:00Z");
  assert.equal(timeAgo("2026-10-25T11:59:30Z", now), "just now");
  assert.equal(timeAgo("2026-10-25T11:30:00Z", now), "30 min ago");
  assert.equal(timeAgo("2026-10-24T12:00:00Z", now), "1 day ago");
});
