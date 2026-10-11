"use client";

import { useEffect, useRef } from "react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useFormAction } from "@/lib/hooks/useFormAction";
import { addComment } from "@/lib/actions/comments";

export function CommentForm({ postId }: { postId: string }) {
  const { state, onSubmit, pending } = useFormAction(addComment);
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the box once the comment has been posted.
  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} onSubmit={onSubmit}>
      <input suppressHydrationWarning type="hidden" name="post_id" value={postId} />
      <label htmlFor="comment-body" className="sr-only">
        Add a comment
      </label>
      <textarea suppressHydrationWarning
        id="comment-body"
        name="body"
        rows={3}
        maxLength={2000}
        required
        placeholder="Ask a question or add what you know"
        className="field-input resize-y"
      />
      <div className="mt-2.5 flex items-center justify-between gap-3">
        <p role="alert" className="text-[13px] text-danger">
          {!state.ok ? state.message : ""}
        </p>
        <SubmitButton pending={pending} variant="solid" pendingLabel="Posting">
          Post comment
        </SubmitButton>
      </div>
    </form>
  );
}
