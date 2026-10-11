import type { ReactNode } from "react";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
}

/** Label, control, hint and error for one form control. */
export function FormField({ label, htmlFor, error, hint, optional, children }: FormFieldProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 flex items-baseline justify-between text-[13.5px] font-semibold text-strong">
        {label}
        {optional && <span className="text-[12.5px] font-normal text-faint">Optional</span>}
      </label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1.5 text-[13px] leading-snug text-danger">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[13px] leading-snug text-faint">{hint}</p>
      ) : null}
    </div>
  );
}

/** Banner for a form-level success or failure message. */
export function FormMessage({ ok, message }: { ok: boolean; message?: string }) {
  if (!message) return null;
  return (
    <p
      role={ok ? "status" : "alert"}
      className={
        ok
          ? "shape-cut border border-line bg-tint [--cut:12px] [--r:12px] px-3.5 py-2.5 text-[13.5px] leading-snug text-success"
          : "shape-cut border border-line bg-tint [--cut:12px] [--r:12px] px-3.5 py-2.5 text-[13.5px] leading-snug text-danger"
      }
    >
      {message}
    </p>
  );
}
