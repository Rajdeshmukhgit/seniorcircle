import { ShieldX } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Not allowed" };

export default function UnauthorizedPage() {
  return (
    <div className="mx-auto w-full max-w-[560px] px-4 pb-16 pt-32">
      <EmptyState
        icon={ShieldX}
        title="You do not have access to this page"
        description="This area is for administrators, or for the person who wrote the post."
        action={
          <ButtonLink href="/feed" variant="solid">
            Back to experiences
          </ButtonLink>
        }
      />
    </div>
  );
}
