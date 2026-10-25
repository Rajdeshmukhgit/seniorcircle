import { hostname } from "node:os";
import { NextResponse } from "next/server";
import { APP_VERSION, SITE_NAME } from "@/lib/constants/site";

// Health check used by the Kubernetes readiness/liveness probes and by the
// Jenkins "Verify" stage. It never touches the database, so it answers even
// when Supabase is slow, and it reports which pod served the request.
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    app: SITE_NAME,
    version: APP_VERSION,
    pod: hostname(),
    time: new Date().toISOString(),
  });
}
