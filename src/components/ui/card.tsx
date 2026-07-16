import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Card — primary container. White surface, 16px radius, primary-tinted
 * "glow" shadow, 24px inner rhythm (per docs/DESIGN.md).
 *
 * The card is a flex column with a 24px gap and 24px vertical padding;
 * sections (`CardHeader` / `CardContent` / `CardFooter`) only add
 * horizontal padding, so `Card` + `CardContent` alone yields 24px of
 * padding on every side.
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex flex-col gap-6 rounded-2xl bg-white py-6 text-on-surface shadow-card",
        className,
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-1.5 px-6", className)} {...props} />;
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("font-display text-headline-md text-on-surface", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("text-body-sm text-on-surface-variant", className)} {...props} />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("px-6", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex items-center gap-2 px-6", className)} {...props} />;
}

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
