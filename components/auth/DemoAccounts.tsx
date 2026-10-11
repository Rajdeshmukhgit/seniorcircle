import { ArrowRight } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { AuthorBadge } from "@/components/ui/Badges";
import { demoSignIn } from "@/lib/actions/auth";
import { demoStore } from "@/lib/data/mock";
import { demoPersonas } from "@/lib/mock/seed";

/** Demo mode only: one-click sign-in for each role, so every screen can be tried. */
export function DemoAccounts({ next }: { next: string }) {
  const profiles = demoStore().profiles;

  return (
    <div className="mt-6 border-t border-hairline pt-5">
      <h2 className="text-[13.5px] font-bold text-strong">Demo accounts</h2>
      <p className="mt-1 text-[13px] leading-snug text-faint">
        No database is connected, so there are no passwords. Pick a role to look around.
      </p>
      <ul className="mt-3 space-y-2">
        {demoPersonas.map((persona) => {
          const profile = profiles.find((p) => p.id === persona.id);
          if (!profile) return null;
          return (
            <li key={persona.id}>
              <form action={demoSignIn}>
                <input suppressHydrationWarning type="hidden" name="id" value={persona.id} />
                <input suppressHydrationWarning type="hidden" name="next" value={next} />
                <button suppressHydrationWarning
                  type="submit"
                  className="shape-cut group flex w-full items-center gap-3 border border-line bg-card px-3 py-2.5 [--cut:12px] [--r:12px] text-left transition hover:border-faint"
                >
                  <Avatar name={profile.name} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate text-[14px] font-semibold text-ink">{profile.name}</span>
                      <AuthorBadge role={profile.role} />
                    </span>
                    <span className="block text-[12.5px] leading-snug text-faint">{persona.blurb}</span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-faint transition group-hover:text-ink" aria-hidden />
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
