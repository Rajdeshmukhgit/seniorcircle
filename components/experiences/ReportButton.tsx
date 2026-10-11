"use client";

import { Flag } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormMessage } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { useFormAction } from "@/lib/hooks/useFormAction";
import { reportPost } from "@/lib/actions/reports";

export function ReportButton({ postId, alreadyReported }: { postId: string; alreadyReported: boolean }) {
  const [open, setOpen] = useState(false);
  const { state, onSubmit, pending } = useFormAction(reportPost);
  const reported = alreadyReported || state.ok;

  if (reported) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-faint">
        <Flag className="h-3.5 w-3.5" aria-hidden />
        Reported. An administrator will review it.
      </span>
    );
  }

  return (
    <>
      <button suppressHydrationWarning
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium text-faint transition hover:text-danger"
      >
        <Flag className="h-3.5 w-3.5" aria-hidden />
        Report this post
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Report this post">
        <form onSubmit={onSubmit} className="space-y-4">
          <input suppressHydrationWarning type="hidden" name="post_id" value={postId} />
          <div>
            <label htmlFor="report-reason" className="text-[14px] leading-relaxed text-soft">
              Tell the administrators what is wrong. They see your name with the report.
            </label>
            <textarea suppressHydrationWarning
              id="report-reason"
              name="reason"
              rows={4}
              maxLength={500}
              required
              placeholder="For example: this is spam, or it shares someone's private details."
              className="field-input mt-2.5 resize-none"
            />
          </div>
          <FormMessage ok={state.ok} message={state.message} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <SubmitButton pending={pending} variant="solid" pendingLabel="Sending">
              Send report
            </SubmitButton>
          </div>
        </form>
      </Modal>
    </>
  );
}
