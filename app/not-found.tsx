import { Compass } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-[560px] px-4 pb-16 pt-32">
      <EmptyState
        icon={Compass}
        title="This page does not exist"
        description="The link may be old, or the experience may have been removed."
        action={
          <ButtonLink href="/" variant="solid">
            Go to the homepage
          </ButtonLink>
        }
      />
    </div>
  );
}
