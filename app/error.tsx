"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto w-full max-w-[560px] px-4 pb-16 pt-32">
      <EmptyState
        icon={TriangleAlert}
        title="This page could not load"
        description="The server did not answer as expected. Your work has not been lost. Try again in a moment."
        action={
          <Button variant="solid" onClick={reset}>
            Try again
          </Button>
        }
      />
    </div>
  );
}
