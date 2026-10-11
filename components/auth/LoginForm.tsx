"use client";

import Link from "next/link";
import { FormField, FormMessage } from "@/components/ui/FormField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useFormAction } from "@/lib/hooks/useFormAction";
import { signIn } from "@/lib/actions/auth";
import { authLink } from "./AuthShell";

export function LoginForm({ next }: { next: string }) {
  const { state, onSubmit, pending } = useFormAction(signIn);
  const errors = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <input suppressHydrationWarning type="hidden" name="next" value={next} />
      <FormField label="Email" htmlFor="email" error={errors.email}>
        <input suppressHydrationWarning id="email" name="email" type="email" autoComplete="email" required className="field-input" aria-invalid={Boolean(errors.email)} />
      </FormField>
      <FormField label="Password" htmlFor="password" error={errors.password}>
        <input suppressHydrationWarning
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="field-input"
          aria-invalid={Boolean(errors.password)}
        />
      </FormField>
      <div className="text-right text-[13.5px]">
        <Link href="/auth/forgot-password" className={authLink}>
          Forgot password?
        </Link>
      </div>
      {!state.fieldErrors && <FormMessage ok={state.ok} message={state.message} />}
      <SubmitButton pending={pending} variant="solid" className="w-full" pendingLabel="Signing in">
        Sign In
      </SubmitButton>
    </form>
  );
}
