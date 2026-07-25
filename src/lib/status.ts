import type { VariantProps } from "class-variance-authority";
import type { badgeVariants } from "@/components/ui/badge";
import type { InvoiceStatus, TransactionStatus } from "@/types";

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>["variant"]>;

export interface StatusConfig {
  label: string;
  variant: BadgeVariant;
}

/**
 * Single source of truth for billing status labels + colors.
 * Every surface (list, dialog, cards) must render the SAME word for the
 * same status — see UI-UX-AUDIT.md A4 (list said "Active", dialog "Open").
 */
export const invoiceStatusConfig: Record<InvoiceStatus, StatusConfig> = {
  upcoming: { label: "Upcoming", variant: "neutral" },
  open: { label: "Open", variant: "primary" },
  pending: { label: "Under review", variant: "warning" },
  paid: { label: "Paid", variant: "success" },
  past_due: { label: "Past due", variant: "error" },
  void: { label: "Void", variant: "neutral" },
};

export const transactionStatusConfig: Record<TransactionStatus, StatusConfig> = {
  success: { label: "Verified", variant: "success" },
  pending: { label: "Under review", variant: "warning" },
  rejected: { label: "Rejected", variant: "error" },
  failed: { label: "Failed", variant: "error" },
  refunded: { label: "Refunded", variant: "neutral" },
};
