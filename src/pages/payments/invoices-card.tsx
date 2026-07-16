import { motion } from "framer-motion";
import { Download, FileText } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/error-state";
import { Badge, type badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PaginationBar } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useInvoices, usePayInvoice } from "@/hooks/use-billing";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Invoice, InvoiceStatus } from "@/types";
import type { VariantProps } from "class-variance-authority";

const PER_PAGE = 5;

const statusConfig: Record<
  InvoiceStatus,
  { label: string; variant: NonNullable<VariantProps<typeof badgeVariants>["variant"]> }
> = {
  open: { label: "Open", variant: "primary" },
  paid: { label: "Paid", variant: "success" },
  past_due: { label: "Past due", variant: "error" },
  void: { label: "Void", variant: "neutral" },
};

export function InvoicesCard() {
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
        <h2 className="font-display text-headline-md text-on-surface">Invoices</h2>
        <p className="mt-1 mb-5 text-body-sm text-on-surface-variant">
          Every invoice issued to your account.
        </p>

        {invoicesQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-xl" />
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
                <InvoiceRow key={invoice.id} invoice={invoice} />
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

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const payInvoice = usePayInvoice();
  const status = statusConfig[invoice.status];
  const payable = invoice.status === "open" || invoice.status === "past_due";

  return (
    <li className="rounded-xl border border-outline-variant/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
            <FileText className="size-4" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="truncate font-mono text-label-md text-on-surface">{invoice.number}</p>
            {invoice.title && (
              <p className="truncate text-body-sm text-on-surface-variant">{invoice.title}</p>
            )}
          </div>
        </div>
        <Badge variant={status.variant} className="shrink-0">
          {status.label}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-body-md font-semibold text-on-surface">
            {formatMoney(invoice.amount, invoice.currency)}
          </p>
          <p className="font-mono text-label-sm text-on-surface-variant">
            {invoice.status === "paid" && invoice.paid_at
              ? `Paid ${formatDate(invoice.paid_at)}`
              : invoice.due_at
                ? `Due ${formatDate(invoice.due_at)}`
                : `Issued ${formatDate(invoice.issued_at)}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {invoice.download_url && (
            <Button variant="ghost" size="icon" className="size-8" asChild>
              <a href={invoice.download_url} download aria-label={`Download invoice ${invoice.number}`}>
                <Download className="size-4" aria-hidden="true" />
              </a>
            </Button>
          )}
          {payable && (
            <Button
              size="sm"
              disabled={payInvoice.isPending}
              onClick={() =>
                payInvoice.mutate(invoice.id, {
                  onError: () => toast.error("Couldn't start the payment. Please try again."),
                })
              }
            >
              {payInvoice.isPending && <Spinner className="size-4 text-on-primary" />}
              Pay
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
