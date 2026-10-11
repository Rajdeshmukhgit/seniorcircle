"use client";

import Link from "next/link";
import { useState } from "react";
import { buttonClass } from "@/components/ui/Button";
import { FormField, FormMessage } from "@/components/ui/FormField";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useFormAction } from "@/lib/hooks/useFormAction";
import { savePost } from "@/lib/actions/posts";
import { BRANCHES, CATEGORIES } from "@/lib/constants/options";
import { cn } from "@/lib/utils";
import type { Category, Post } from "@/types";

interface PostFormProps {
  /** Present when editing. */
  post?: Post;
  years: number[];
  defaults: { branch: string; graduation_year: number };
}

const rolePlaceholder: Record<Category, string> = {
  interview: "Software Engineer",
  internship: "SDE Intern",
  exam: "CSE paper, MBA entrance",
  certification: "Solutions Architect Associate",
};

export function PostForm({ post, years, defaults }: PostFormProps) {
  const { state, onSubmit, pending } = useFormAction(savePost);
  const [category, setCategory] = useState<Category>(post?.category ?? "interview");
  const [length, setLength] = useState(post?.description.length ?? 0);
  const errors = state.fieldErrors ?? {};
  const selectedYear = post?.graduation_year ?? defaults.graduation_year;
  const yearOptions = years.includes(selectedYear) ? years : [...years, selectedYear].sort((a, b) => b - a);
  const nameLabel = CATEGORIES.find((c) => c.value === category)?.nameLabel ?? "Company";

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      {post && <input suppressHydrationWarning type="hidden" name="id" value={post.id} />}

      <fieldset>
        <legend className="mb-2 text-[13.5px] font-semibold text-strong">What kind of experience is this?</legend>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {CATEGORIES.map((option) => (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-center text-[13.5px] font-semibold transition",
                category === option.value
                  ? "border-primary bg-primary/10 text-primary-text"
                  : "border-line bg-card text-soft hover:border-faint hover:text-ink",
              )}
            >
              <input suppressHydrationWarning
                type="radio"
                name="category"
                value={option.value}
                checked={category === option.value}
                onChange={() => setCategory(option.value)}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
        {errors.category && <p className="mt-1.5 text-[13px] text-danger">{errors.category}</p>}
      </fieldset>

      <FormField label="Title" htmlFor="title" error={errors.title} hint="Say what it was and where, for example “Barclays Software Engineer Interview Experience”.">
        <input suppressHydrationWarning id="title" name="title" defaultValue={post?.title} maxLength={140} required className="field-input" aria-invalid={Boolean(errors.title)} />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label={`${nameLabel} name`} htmlFor="company_or_exam" error={errors.company_or_exam}>
          <input suppressHydrationWarning
            id="company_or_exam"
            name="company_or_exam"
            defaultValue={post?.company_or_exam}
            maxLength={80}
            required
            placeholder={category === "exam" ? "GATE" : category === "certification" ? "AWS Certification" : "Barclays"}
            className="field-input"
            aria-invalid={Boolean(errors.company_or_exam)}
          />
        </FormField>
        <FormField label={category === "exam" || category === "certification" ? "Paper or track" : "Role"} htmlFor="role" error={errors.role} optional>
          <input suppressHydrationWarning id="role" name="role" defaultValue={post?.role ?? ""} maxLength={80} placeholder={rolePlaceholder[category]} className="field-input" />
        </FormField>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Your branch" htmlFor="branch" error={errors.branch}>
          <select suppressHydrationWarning id="branch" name="branch" defaultValue={post?.branch ?? defaults.branch} className="field-input">
            {BRANCHES.map((branch) => (
              <option key={branch}>{branch}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Your graduation year" htmlFor="graduation_year" error={errors.graduation_year}>
          <select suppressHydrationWarning
            id="graduation_year"
            name="graduation_year"
            defaultValue={selectedYear}
            className="field-input"
          >
            {yearOptions.map((year) => (
              <option key={year}>{year}</option>
            ))}
          </select>
        </FormField>
      </div>

      <FormField
        label="The experience"
        htmlFor="description"
        error={errors.description}
        hint={`Start a line with ## for a heading or - for a list item. Use **bold** for emphasis. ${length.toLocaleString("en-IN")} / 20,000`}
      >
        <textarea suppressHydrationWarning
          id="description"
          name="description"
          defaultValue={post?.description}
          onChange={(event) => setLength(event.target.value.length)}
          rows={16}
          maxLength={20000}
          required
          placeholder={"How the process went, round by round.\n\n## Online assessment\n- What was asked\n\n## What I would do differently"}
          className="field-input min-h-[280px] resize-y font-mono text-[13.5px] leading-relaxed"
          aria-invalid={Boolean(errors.description)}
        />
      </FormField>

      <FormField label="Tags" htmlFor="tags" error={errors.tags} hint="Up to 6, separated by commas. For example: on-campus, dsa, sql" optional>
        <input suppressHydrationWarning id="tags" name="tags" defaultValue={post?.tags.join(", ")} className="field-input" />
      </FormField>

      <FormMessage ok={state.ok} message={state.message} />

      <div className="flex flex-wrap items-center gap-2.5 border-t border-hairline pt-5">
        <SubmitButton pending={pending} variant="solid" pendingLabel={post ? "Saving" : "Publishing"}>
          {post ? "Save changes" : "Publish experience"}
        </SubmitButton>
        <Link href={post ? `/experiences/${post.id}` : "/feed"} className={buttonClass("outline")}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
