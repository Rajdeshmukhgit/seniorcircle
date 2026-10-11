"use client";

import { LoaderCircle } from "lucide-react";
import type { ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "./Button";

interface SubmitButtonProps extends ComponentProps<typeof Button> {
  /** Shown while the form is being submitted, e.g. "Saving". */
  pendingLabel?: string;
  /** Set this when the form is submitted through useFormAction instead of `action`. */
  pending?: boolean;
}

/** A submit button that disables itself and shows progress while its form is pending. */
export function SubmitButton({ children, pendingLabel, pending: pendingProp, disabled, ...props }: SubmitButtonProps) {
  const status = useFormStatus();
  const pending = pendingProp ?? status.pending;
  return (
    <Button type="submit" disabled={pending || disabled} aria-busy={pending} {...props}>
      {pending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
