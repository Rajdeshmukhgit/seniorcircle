"use client";

import { FormField, FormMessage } from "@/components/ui/FormField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useFormAction } from "@/lib/hooks/useFormAction";
import { requestPasswordReset, updatePassword } from "@/lib/actions/auth";

export function ForgotPasswordForm() {
  const { state, onSubmit, pending } = useFormAction(requestPasswordReset);
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormField label="Email" htmlFor="email" error={state.fieldErrors?.email}>
        <input suppressHydrationWarning id="email" name="email" type="email" autoComplete="email" required className="field-input" />
      </FormField>
      {!state.fieldErrors && <FormMessage ok={state.ok} message={state.message} />}
      <SubmitButton pending={pending} variant="solid" className="w-full" pendingLabel="Sending">
        Send reset link
      </SubmitButton>
    </form>
  );
}

export function ResetPasswordForm() {
  const { state, onSubmit, pending } = useFormAction(updatePassword);
  const errors = state.fieldErrors ?? {};
  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormField label="New password" htmlFor="password" error={errors.password} hint="At least 8 characters.">
        <input suppressHydrationWarning id="password" name="password" type="password" autoComplete="new-password" required minLength={8} className="field-input" />
      </FormField>
      <FormField label="Repeat new password" htmlFor="confirm" error={errors.confirm}>
        <input suppressHydrationWarning id="confirm" name="confirm" type="password" autoComplete="new-password" required className="field-input" />
      </FormField>
      {!state.fieldErrors && <FormMessage ok={state.ok} message={state.message} />}
      <SubmitButton pending={pending} variant="solid" className="w-full" pendingLabel="Saving">
        Save new password
      </SubmitButton>
    </form>
  );
}
