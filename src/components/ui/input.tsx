import type * as React from "react";

import { cn } from "@/lib/utils";

type InputProps = React.ComponentProps<"input"> & {
  ref?: React.Ref<HTMLInputElement>;
};

function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        "h-10 w-full min-w-0 rounded-lg border border-outline-variant bg-white px-3 text-body-sm text-on-surface transition-colors duration-150",
        "placeholder:text-outline",
        "focus-visible:border-primary",
        "aria-invalid:border-error",
        "disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:opacity-50",
        "file:me-3 file:h-full file:border-0 file:bg-transparent file:text-body-sm file:font-medium file:text-on-surface",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
