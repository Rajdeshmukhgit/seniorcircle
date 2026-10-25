import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { DEMO_COOKIE } from "@/lib/auth/demo-cookie";

/** Everything under these paths needs a signed-in member. */
const PROTECTED_PREFIXES = ["/feed", "/experiences", "/profile", "/connections", "/notifications", "/admin"];

const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  let response = NextResponse.next({ request });
  let isSignedIn: boolean;

  if (supabaseConfigured) {
    const session = await updateSession(request);
    response = session.response;
    isSignedIn = session.isSignedIn;
  } else {
    isSignedIn = Boolean(request.cookies.get(DEMO_COOKIE)?.value);
  }

  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

  if (isProtected && !isSignedIn) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2)$).*)"],
};
