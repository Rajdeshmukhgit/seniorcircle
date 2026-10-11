import { FlaskConical } from "lucide-react";
import { isDemoMode } from "@/lib/config";

/** Tells visitors the data is mock data. Disappears once Supabase is connected. */
export function DemoBanner() {
  if (!isDemoMode) return null;
  return (
    <div className="px-2.5 pt-3 sm:px-4 sm:pt-4">
      <p className="glass shape-cut mx-auto flex max-w-wide items-start gap-2.5 px-4 py-3 text-[13px] leading-snug text-soft [--cut:14px] [--r:16px] sm:px-6">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0 text-primary-text" aria-hidden />
        Demo mode: this site is running on sample data that resets when the server restarts. Add Supabase keys to
        .env.local to use a real database.
      </p>
    </div>
  );
}
