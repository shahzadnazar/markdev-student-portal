import { cva, type VariantProps } from "class-variance-authority";
import type * as React from "react";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-xl border p-4 text-body-sm [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:size-5 [&>svg~*]:pl-8",
  {
    variants: {
      variant: {
        info: "border-primary/20 bg-primary-container/40 text-on-primary-container [&>svg]:text-primary",
        success:
          "border-success/20 bg-success-container text-on-success-container [&>svg]:text-success",
        warning:
          "border-warning/20 bg-warning-container text-on-warning-container [&>svg]:text-warning",
        error:
          "border-error/20 bg-error-container text-on-error-container [&>svg]:text-error",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  },
);

type AlertProps = React.ComponentProps<"div"> & VariantProps<typeof alertVariants>;

function Alert({ className, variant, ...props }: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mb-1 font-medium", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("text-body-sm opacity-90", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
