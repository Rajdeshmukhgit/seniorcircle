/**
 * TEMPORARY diagnostic: times each step of reading from Supabase on the
 * deployed server. Returns timings only, no data. Delete this folder once the
 * slowdown is understood.
 */
import { lookup } from "node:dns/promises";
import { NextResponse } from "next/server";
import { getPublicPreviews } from "@/lib/data/cached";
import { createPublicClient } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

async function time<T>(fn: () => Promise<T>): Promise<{ ms: number; ok: boolean; note?: string }> {
  const start = performance.now();
  try {
    const value = await fn();
    const note = typeof value === "string" ? value : undefined;
    return { ms: Math.round(performance.now() - start), ok: true, note };
  } catch (error) {
    return { ms: Math.round(performance.now() - start), ok: false, note: String(error).slice(0, 160) };
  }
}

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  const host = url ? new URL(url).hostname : "";
  const headers = { apikey: key };

  const steps: Record<string, unknown> = {
    node: process.version,
    region: process.env.VERCEL_REGION ?? null,
    keyType: key.startsWith("sb_publishable_") ? "publishable" : key.startsWith("eyJ") ? "legacy-jwt" : "other",
  };
  steps.dns = await time(async () => (await lookup(host, { all: true })).map((a) => a.address).join(","));
  steps.rawHealth = await time(async () => String((await fetch(`${url}/auth/v1/health`, { headers, cache: "no-store" })).status));
  steps.rawRest1 = await time(async () => {
    const r = await fetch(`${url}/rest/v1/post_previews?select=id&limit=1`, { headers, cache: "no-store" });
    await r.text();
    return String(r.status);
  });
  steps.rawRest2 = await time(async () => {
    const r = await fetch(`${url}/rest/v1/post_previews?select=id&limit=1`, { headers, cache: "no-store" });
    await r.text();
    return String(r.status);
  });
  steps.supabaseJs = await time(async () => {
    const { error } = await createPublicClient().from("post_previews").select("id").limit(1);
    return error ? `error: ${error.message}` : "ok";
  });
  steps.cachedPreviews1 = await time(async () => String((await getPublicPreviews()).length));
  steps.cachedPreviews2 = await time(async () => String((await getPublicPreviews()).length));

  return NextResponse.json(steps, { headers: { "cache-control": "no-store" } });
}
