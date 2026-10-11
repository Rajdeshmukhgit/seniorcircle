import { Inbox, Send } from "lucide-react";
import type { Metadata } from "next";
import { RequestCard } from "@/components/connections/RequestCard";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { canInteract } from "@/lib/auth/permissions";
import { requireUser } from "@/lib/auth/session";
import { getRepo } from "@/lib/data";

export const metadata: Metadata = { title: "Connections" };

const sectionHeading = "font-display text-[20px] font-bold tracking-[-0.025em] text-ink";

export default async function ConnectionsPage() {
  const user = await requireUser("/connections");
  const { incoming, outgoing } = await getRepo().listConnects(user.id);
  const pendingCount = incoming.filter((r) => r.status === "pending").length;
  // Requests still waiting for an answer come first.
  const sortedIncoming = [...incoming].sort((a, b) => Number(b.status === "pending") - Number(a.status === "pending"));

  return (
    <div className="mx-auto w-full max-w-[820px] px-4 pb-16 pt-24 sm:px-6 md:pt-28">
      <h1 className="font-display text-[34px] font-semibold leading-[1.1] tracking-[-0.05em] text-ink sm:text-[46px]">Connections</h1>
      <p className="mt-2 max-w-xl text-[15.5px] text-soft">
        When a request is accepted, each of you can see the other&apos;s email and take the conversation from there.
      </p>

      <section aria-labelledby="incoming" className="mt-9">
        <h2 id="incoming" className={sectionHeading}>
          Incoming Requests{pendingCount > 0 ? ` (${pendingCount} waiting)` : ""}
        </h2>
        <div className="mt-4">
          {sortedIncoming.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="You haven't received any connection requests yet."
              description="When someone reads one of your experiences and wants to talk, the request appears here."
            />
          ) : (
            <ul className="space-y-3">
              {sortedIncoming.map((request) => (
                <RequestCard key={request.id} request={request} direction="incoming" canRespond={canInteract(user)} />
              ))}
            </ul>
          )}
        </div>
      </section>

      <section aria-labelledby="outgoing" className="mt-10">
        <h2 id="outgoing" className={sectionHeading}>
          Sent Requests
        </h2>
        <div className="mt-4">
          {outgoing.length === 0 ? (
            <EmptyState
              icon={Send}
              title="You have not sent any requests"
              description="Open an experience and press Connect to reach its author."
              action={
                <ButtonLink href="/feed" variant="outline">
                  Browse experiences
                </ButtonLink>
              }
            />
          ) : (
            <ul className="space-y-3">
              {outgoing.map((request) => (
                <RequestCard key={request.id} request={request} direction="outgoing" canRespond={false} />
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
