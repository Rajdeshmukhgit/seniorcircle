"use client";

import { GraduationCap, School } from "lucide-react";
import { useState } from "react";
import { FormField, FormMessage } from "@/components/ui/FormField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useFormAction } from "@/lib/hooks/useFormAction";
import { signUp } from "@/lib/actions/auth";
import { BRANCHES } from "@/lib/constants/options";
import { cn } from "@/lib/utils";

type AccountType = "student" | "alumni";

interface SignupFormProps {
  initialType: AccountType;
  /** The college email domain, shown as a hint. */
  collegeDomain: string;
  studentYears: number[];
  alumniYears: number[];
}

const options = [
  { value: "student", label: "Student", description: "I study here now", icon: School },
  { value: "alumni", label: "Alumni", description: "I have graduated", icon: GraduationCap },
] as const;

export function SignupForm({ initialType, collegeDomain, studentYears, alumniYears }: SignupFormProps) {
  const { state, onSubmit, pending } = useFormAction(signUp);
  const [type, setType] = useState<AccountType>(initialType);
  const errors = state.fieldErrors ?? {};
  const isStudent = type === "student";
  const years = isStudent ? studentYears : alumniYears;

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <fieldset>
        <legend className="mb-2 text-[13.5px] font-semibold text-strong">I am a:</legend>
        <div className="grid grid-cols-2 gap-2.5">
          {options.map(({ value, label, description, icon: Icon }) => (
            <label
              key={value}
              className={cn(
                "flex cursor-pointer flex-col gap-1 rounded-xl border p-3.5 transition",
                type === value ? "border-primary bg-primary/10" : "border-line hover:border-faint",
              )}
            >
              <input suppressHydrationWarning
                type="radio"
                name="account_type"
                value={value}
                checked={type === value}
                onChange={() => setType(value)}
                className="sr-only"
              />
              <Icon className={cn("h-5 w-5", type === value ? "text-primary-text" : "text-faint")} aria-hidden />
              <span className="text-[15px] font-bold text-ink">{label}</span>
              <span className="text-[12.5px] leading-snug text-soft">{description}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {!isStudent && (
        <p className="shape-cut border border-line bg-tint [--cut:12px] [--r:12px] px-3.5 py-2.5 text-[13.5px] leading-snug text-soft">
          Alumni accounts are checked by an administrator. You can read straight away, and post and connect once you
          are approved.
        </p>
      )}

      <FormField label="Full name" htmlFor="name" error={errors.name}>
        <input suppressHydrationWarning id="name" name="name" autoComplete="name" required maxLength={80} className="field-input" aria-invalid={Boolean(errors.name)} />
      </FormField>

      <FormField
        label={isStudent ? "College email" : "Personal email"}
        htmlFor="email"
        error={errors.email}
        hint={
          isStudent
            ? `Must end in @${collegeDomain}, for example raj.deshmukh1@${collegeDomain}`
            : "Use an address you will keep after college."
        }
      >
        <input suppressHydrationWarning
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder={isStudent ? `name@${collegeDomain}` : undefined}
          className="field-input"
          aria-invalid={Boolean(errors.email)}
        />
      </FormField>

      <FormField label="Password" htmlFor="password" error={errors.password} hint="At least 8 characters.">
        <input suppressHydrationWarning
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className="field-input"
          aria-invalid={Boolean(errors.password)}
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Branch" htmlFor="branch" error={errors.branch}>
          <select suppressHydrationWarning id="branch" name="branch" defaultValue="" required className="field-input" aria-invalid={Boolean(errors.branch)}>
            <option value="" disabled>
              Choose
            </option>
            {BRANCHES.map((branch) => (
              <option key={branch}>{branch}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Graduation year" htmlFor="graduation_year" error={errors.graduation_year}>
          {/* The key resets the choice when switching between Student and Alumni. */}
          <select suppressHydrationWarning
            key={type}
            id="graduation_year"
            name="graduation_year"
            defaultValue=""
            required
            className="field-input"
            aria-invalid={Boolean(errors.graduation_year)}
          >
            <option value="" disabled>
              Choose
            </option>
            {years.map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>
        </FormField>
      </div>

      {!state.fieldErrors && <FormMessage ok={state.ok} message={state.message} />}

      <SubmitButton pending={pending} variant="solid" className="w-full" pendingLabel="Creating account">
        {isStudent ? "Create student account" : "Submit for verification"}
      </SubmitButton>
    </form>
  );
}
