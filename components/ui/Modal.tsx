"use client";

import { X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/** Built on the native <dialog>, so focus trapping and Escape come for free. */
export function Modal({ open, onClose, title, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className="w-[calc(100%-2rem)] max-w-md rounded-card border border-line bg-card p-0 text-ink shadow-float [--cut:36px]"
    >
      <div className="p-[22px]">
        <div className="flex items-start justify-between gap-4">
          <h2 className="font-display text-[21px] font-semibold tracking-[-0.035em]">{title}</h2>
          <button suppressHydrationWarning
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shape-cut -mr-1.5 -mt-1 flex h-8 w-8 items-center justify-center text-soft [--cut:8px] [--r:9px] hover:bg-tint hover:text-ink"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    </dialog>
  );
}
