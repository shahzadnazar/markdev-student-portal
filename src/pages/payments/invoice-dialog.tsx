import { invoiceStatusConfig } from "@/lib/status";
import { Download, Layers } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { formatDate, formatMoney } from "@/lib/format";
import type { Invoice } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const statusConfig = invoiceStatusConfig;

interface InvoiceDialogProps {
  invoice: Invoice | null;
  onClose: () => void;
}

/** The invoice viewer modal — gradient header, line item, totals, status. */
export function InvoiceDialog({ invoice, onClose }: InvoiceDialogProps) {
  const { user } = useAuth();

  if (!invoice) return null;

  const paid = invoice.status === "paid";
  const status = statusConfig[invoice.status];
  const submission = invoice.latest_submission;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        {/* Gradient header */}
        <div className="bg-gradient-brand px-6 py-6 text-white">
          <p className="flex items-center gap-2 font-mono text-label-sm text-white/80 uppercase">
            <Layers className="size-4" aria-hidden="true" />
            Invoice
          </p>
          <DialogTitle className="mt-1 font-display text-headline-lg text-white">
            {invoice.number}
          </DialogTitle>
        </div>

        <div className="relative px-6 pt-5 pb-6">
          {/* Watermark */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 flex rotate-[-20deg] items-center justify-center font-display text-5xl font-black tracking-widest text-primary/[0.04] select-none"
          >
            MARKDEV
          </span>

          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-label-sm text-outline uppercase">Billed to</p>
                <p className="mt-1 font-display text-body-lg font-bold text-on-surface">{user?.name}</p>
                {paid && submission && (
                  <p className="mt-0.5 text-body-sm text-on-surface-variant">
                    Paid via {submission.method.label}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-mono text-label-sm text-outline uppercase">Date issued</p>
                <p className="mt-1 font-display text-body-lg font-bold text-on-surface">
                  {formatDate(invoice.issued_at)}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between gap-4 border-b border-outline-variant/40 pb-3">
                <p className="text-body-md text-on-surface">{invoice.title ?? "Course fee"}</p>
                <p className="font-mono text-body-md text-on-surface">
                  {formatMoney(invoice.amount, invoice.currency)}
                </p>
              </div>
              {invoice.fine_amount > 0 && (
                <div className="flex items-center justify-between gap-4 border-b border-outline-variant/40 pb-3">
                  <p className="text-body-md text-error">Defaulter fine ({invoice.fine_days} days)</p>
                  <p className="font-mono text-body-md text-error">
                    {formatMoney(invoice.fine_amount, invoice.currency)}
                  </p>
                </div>
              )}
              <div className="flex items-center justify-between gap-4 border-b border-outline-variant/40 pb-3">
                <p className="text-body-md text-on-surface-variant">Remaining fee</p>
                <p className="font-mono text-body-md text-on-surface-variant">
                  {formatMoney(paid ? 0 : invoice.payable_total, invoice.currency)}
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-4">
              <p className="font-display text-body-lg font-bold text-on-surface">Total paid</p>
              <p className="font-display text-headline-md text-primary">
                {formatMoney(paid ? invoice.amount : 0, invoice.currency)}
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-4">
              <p className="text-body-md text-on-surface-variant">Status</p>
              <Badge variant={status.variant}>{status.label}</Badge>
            </div>

            {invoice.status === "pending" && submission && (
              <p className="mt-4 rounded-xl bg-warning-container/60 px-4 py-3 text-body-sm text-on-warning-container">
                Your receipt ({submission.reference_no}) is being verified by the finance team.
              </p>
            )}
            {submission?.status === "rejected" && invoice.status !== "paid" && (
              <p className="mt-4 rounded-xl bg-error-container/60 px-4 py-3 text-body-sm text-on-error-container">
                <span className="font-semibold">Last submission rejected:</span>{" "}
                {submission.rejection_reason}
              </p>
            )}

            <div className="mt-6 flex gap-3">
              {invoice.download_url && (
                <Button className="flex-1" asChild>
                  <a href={invoice.download_url} download>
                    <Download className="size-4" aria-hidden="true" />
                    Download invoice
                  </a>
                </Button>
              )}
              <Button variant={invoice.download_url ? "secondary" : "primary"} className="flex-1" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
