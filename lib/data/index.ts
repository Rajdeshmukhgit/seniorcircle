import "server-only";
import { isDemoMode } from "@/lib/config";
import { mockRepo } from "./mock";
import type { Repo } from "./repo";
import { supabaseRepo } from "./supabase";

/** The data source for this deployment: Supabase when configured, demo data otherwise. */
export function getRepo(): Repo {
  return isDemoMode ? mockRepo : supabaseRepo;
}
