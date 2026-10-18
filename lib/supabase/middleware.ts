import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session cookie and reports whether someone is
 * signed in. Called from middleware.ts on every matched request.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // getClaims() checks the session token's signature locally with the
  // project's cached public key, so it does not call Supabase Auth on every
  // page view the way getUser() did. It still refreshes an expired session,
  // and falls back to getUser() if the project signs tokens with a shared secret.
  const { data } = await supabase.auth.getClaims();

  return { response, isSignedIn: Boolean(data?.claims?.sub) };
}
