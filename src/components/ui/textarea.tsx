import type * as React from "react";

import { cn } from "@/lib/utils";

type TextareaProps = React.ComponentProps<"textarea"> & {
  ref?: React.Ref<HTMLTextAreaElement>;
};

function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "min-h-24 w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-body-sm text-on-surface transition-colors duration-150",
        "placeholder:text-outline",
        "focus-visible:border-primary",
        "aria-invalid:border-error",
        "disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
