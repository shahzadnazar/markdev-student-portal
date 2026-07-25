import { motion } from "framer-motion";
import { Download, Eye, FileText, RotateCcw } from "lucide-react";
import { useState } from "react";
import { ErrorState } from "@/components/shared/error-state";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PaginationBar } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useInvoices } from "@/hooks/use-billing";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/types";
import type { VariantProps } from "class-variance-authority";

const PER_PAGE = 5;

const statusConfig: Record<
  InvoiceStatus,
  { label: string; variant: NonNullable<VariantProps<typeof badgeVariants>["variant"]> }
> = {
  upcoming: { label: "Upcoming", variant: "neutral" },
  open: { label: "Active", variant: "primary" },
  pending: { label: "Under review", variant: "warning" },
  paid: { label: "Paid", variant: "success" },
  past_due: { label: "Past due", variant: "error" },
  void: { label: "Void", variant: "neutral" },
};

interface InvoicesCardProps {
  onPay: (invoice: Invoice) => void;
  onView: (invoice: Invoice) => void;
}

export function InvoicesCard({ onPay, onView }: InvoicesCardProps) {
  const [page, setPage] = useState(1);
  const invoicesQuery = useInvoices({ page, per_page: PER_PAGE });
  const invoices = invoicesQuery.data?.data ?? [];

  return (
    <motion.section
      aria-label="Invoices"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25, ease: "easeOut" }}
    >
      <Card className="p-6">
        <h2 className="font-display text-headline-md text-on-surface">Installments</h2>
        <p className="mt-1 mb-5 text-body-sm text-on-surface-variant">
          Only the current installment is payable — future months open 5 days before their due date.
        </p>

        {invoicesQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : invoicesQuery.isError ? (
          <ErrorState
            title="Couldn't load invoices"
            error={invoicesQuery.error}
            onRetry={() => {
              void invoicesQuery.refetch();
            }}
          />
        ) : invoices.length === 0 ? (
          <p className="rounded-xl border border-dashed border-outline-variant px-4 py-8 text-center text-body-sm text-on-surface-variant">
            No invoices issued yet.
          </p>
        ) : (
          <>
            <ul
              className={cn(
                "space-y-3 transition-opacity duration-200",
                invoicesQuery.isPlaceholderData && invoicesQuery.isFetching && "opacity-60",
              )}
            >
              {invoices.map((invoice) => (
                <InvoiceRow key={invoice.id} invoice={invoice} onPay={onPay} onView={onView} />
              ))}
            </ul>
            {invoicesQuery.data && (
              <PaginationBar meta={invoicesQuery.data.meta} onPageChange={setPage} className="mt-5" />
            )}
          </>
        )}
      </Card>
    </motion.section>
  );
}

function InvoiceRow({
  invoice,
  onPay,
  onView,
}: {
  invoice: Invoice;
  onPay: (invoice: Invoice) => void;
  onView: (invoice: Invoice) => void;
}) {
  const status = statusConfig[invoice.status];
  const payable = invoice.status === "open" || invoice.status === "past_due";
  const rejected = invoice.latest_submission?.status === "rejected" && payable;
  const upcoming = invoice.status === "upcoming";
  // Say what the invoice IS — the plan/course name is obvious from context.
  const rowLabel =
    invoice.type === "registration"
      ? "Registration fee — confirms admission"
      : (invoice.title ?? "").includes("—")
        ? (invoice.title ?? "").split("—").slice(1).join("—").trim()
        : invoice.title;

  return (
    <li
      className={cn(
        "rounded-xl border border-outline-variant/40 p-4",
        upcoming && "opacity-60",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            <FileText className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-mono text-label-md text-on-surface">{invoice.number}</p>
            {rowLabel && (
              <p
                className={cn(
                  "truncate text-body-sm",
                  invoice.type === "registration"
                    ? "font-medium text-secondary"
                    : "text-on-surface-variant",
                )}
                title={invoice.title ?? undefined}
              >
                {rowLabel}
              </p>
            )}
          </div>
        </div>
        <Badge variant={status.variant} className="shrink-0">
          {status.label}
        </Badge>
      </div>

      {invoice.status === "pending" && invoice.latest_submission && (
        <p className="mt-3 rounded-lg bg-warning-container/60 px-3 py-2 text-body-sm text-on-warning-container">
          Receipt {invoice.latest_submission.reference_no} submitted{" "}
          {formatDate(invoice.latest_submission.created_at)} — awaiting verification.
        </p>
      )}

      {invoice.status === "open" &&
        invoice.in_grace &&
        (invoice.due_at && new Date(invoice.due_at).toDateString() === new Date().toDateString() ? (
          <p className="mt-3 rounded-lg bg-primary/10 px-3 py-2 text-body-sm text-primary">
            <span className="font-semibold">Due today.</span>
            {invoice.type === "registration"
              ? " Paying this confirms your admission."
              : " Pay today to stay on schedule."}
          </p>
        ) : (
          <p className="mt-3 rounded-lg bg-warning-container/60 px-3 py-2 text-body-sm text-on-warning-container">
            <span className="font-semibold">Due date passed.</span> Pay now to avoid the daily
            defaulter fine.
          </p>
        ))}

      {invoice.status === "past_due" && invoice.fine_amount > 0 && (
        <p className="mt-3 rounded-lg bg-error-container/60 px-3 py-2 text-body-sm text-on-error-container">
          <span className="font-semibold">Defaulter fine:</span>{" "}
          {formatMoney(invoice.fine_amount, invoice.currency)} added ({invoice.fine_days}{" "}
          {invoice.fine_days === 1 ? "day" : "days"} overdue) — total payable{" "}
          <span className="font-semibold">{formatMoney(invoice.payable_total, invoice.currency)}</span>.
        </p>
      )}

      {rejected && (
        <p className="mt-3 rounded-lg bg-error-container/60 px-3 py-2 text-body-sm text-on-error-container">
          <span className="font-semibold">Rejected:</span> {invoice.latest_submission?.rejection_reason}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-body-md font-semibold text-on-surface">
            {formatMoney(payable ? invoice.payable_total : invoice.amount, invoice.currency)}
          </p>
          <p className="font-mono text-label-sm text-on-surface-variant">
            {invoice.status === "paid" && invoice.paid_at
              ? `Paid ${formatDate(invoice.paid_at)}`
              : upcoming && invoice.activates_at
                ? `Opens ${formatDate(invoice.activates_at)} · due ${formatDate(invoice.due_at)}`
                : invoice.due_at
                  ? `Due ${formatDate(invoice.due_at)}`
                  : `Issued ${formatDate(invoice.issued_at)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => onView(invoice)}
            aria-label={`View invoice ${invoice.number}`}
          >
            <Eye className="size-4" aria-hidden="true" />
          </Button>
          {invoice.download_url && (
            <Button variant="ghost" size="icon" className="size-8" asChild>
              <a href={invoice.download_url} download aria-label={`Download invoice ${invoice.number}`}>
                <Download className="size-4" aria-hidden="true" />
              </a>
            </Button>
          )}
          {payable && (
            <Button variant="success" size="sm" onClick={() => onPay(invoice)}>
              {rejected && <RotateCcw className="size-4" aria-hidden="true" />}
              {rejected ? "Resubmit" : "Pay"}
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
