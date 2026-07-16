import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  /** react-hook-form field error message. */
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}

/** Label + control + validation message, wired for accessibility. */
export function FormField({ label, htmlFor, error, hint, children, className }: FormFieldProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-body-sm text-error">
          {error}
        </p>
      ) : hint ? (
        <p className="text-body-sm text-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
}

/** Root-level (non-field) form error banner. */
export function FormError({ message }: { message: string | null | undefined }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="rounded-lg border border-error/20 bg-error-container/50 px-4 py-3 text-body-sm text-on-error-container"
    >
      {message}
    </div>
  );
}
