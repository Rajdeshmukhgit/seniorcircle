"use client";

import { FormField, FormMessage } from "@/components/ui/FormField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useFormAction } from "@/lib/hooks/useFormAction";
import { updateProfile } from "@/lib/actions/profile";
import { BRANCHES } from "@/lib/constants/options";

export function ProfileForm({ name, branch }: { name: string; branch: string }) {
  const { state, onSubmit, pending } = useFormAction(updateProfile);
  const errors = state.fieldErrors ?? {};

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Full name" htmlFor="name" error={errors.name}>
          <input suppressHydrationWarning id="name" name="name" defaultValue={name} required maxLength={80} className="field-input" />
        </FormField>
        <FormField label="Branch" htmlFor="branch" error={errors.branch}>
          <select suppressHydrationWarning id="branch" name="branch" defaultValue={branch} className="field-input">
            {BRANCHES.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </FormField>
      </div>
      <p className="text-[13px] text-faint">Your email, role and graduation year are set at signup and cannot be changed here.</p>
      {!state.fieldErrors && <FormMessage ok={state.ok} message={state.message} />}
      <SubmitButton pending={pending} variant="solid" pendingLabel="Saving">
        Save changes
      </SubmitButton>
    </form>
  );
}
