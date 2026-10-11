"use client";

import { Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { deletePost } from "@/lib/actions/posts";

export function DeletePostButton({ postId, title }: { postId: string; title: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="danger" size="sm" onClick={() => setOpen(true)}>
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
        Delete
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} title="Delete this experience?">
        <p className="text-[14.5px] leading-relaxed text-soft">
          “{title}” will be removed along with its comments and connect requests. This cannot be undone.
        </p>
        <form action={deletePost} className="mt-5 flex justify-end gap-2">
          <input suppressHydrationWarning type="hidden" name="id" value={postId} />
          <Button variant="outline" onClick={() => setOpen(false)}>
            Keep it
          </Button>
          <SubmitButton variant="danger" pendingLabel="Deleting">
            Delete experience
          </SubmitButton>
        </form>
      </Modal>
    </>
  );
}
