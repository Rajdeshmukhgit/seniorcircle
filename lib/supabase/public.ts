import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * A Supabase client with no session: it reads only what the anon role may read
 * (for example the public post_previews view). Because it never touches
 * cookies, its results can be cached and shared between visitors.
 */
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
