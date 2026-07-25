import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  CalendarClock,
  CircleCheck,
  CreditCard,
  Download,
  GraduationCap,
  Wallet,
} from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useBillingOverview } from "@/hooks/use-billing";
import { formatDate, formatPercent } from "@/lib/format";
import { formatMoney } from "@/lib/format";
import type { BillingOverview, InstallmentInfo, Invoice } from "@/types";
import { FeeReceiptDialog } from "./fee-receipt-dialog";
import { InvoiceDialog } from "./invoice-dialog";
import { InvoicesCard } from "./invoices-card";
import { TransactionsCard } from "./transactions-card";

const cycleLabels: Record<string, string> = {
  annual: "Billed annually",
  monthly: "Billed monthly",
  one_time: "One-time fee",
};

export default function PaymentsPage() {
  const overviewQuery = useBillingOverview();
  const overview = overviewQuery.data;
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Payments"
        description="Your tuition, invoices and transaction history in one place."
        actions={
          overview?.statement_url ? (
            <Button variant="secondary" asChild>
              <a href={overview.statement_url} download>
                <Download className="size-4" aria-hidden="true" />
                Statement
              </a>
            </Button>
          ) : undefined
        }
      />

      {overviewQuery.isLoading ? (
        <BillingSkeleton />
      ) : overviewQuery.isError ? (
        <ErrorState
          title="Couldn't load your billing"
          error={overviewQuery.error}
          onRetry={() => {
            void overviewQuery.refetch();
          }}
        />
      ) : overview && (overview.billing_active || overview.total_amount > 0) ? (
        <div className="space-y-6">
          <BillingHero overview={overview} />
          {overview.admission ? (
            <AdmissionCard
              admission={overview.admission}
              currency={overview.currency}
              onPay={setPayingInvoice}
            />
          ) : null}
          <BillingStatCards overview={overview} onPay={setPayingInvoice} />
          {overview.installments ? (
            <InstallmentPlanCard info={overview.installments} currency={overview.currency} />
          ) : null}
          <div className="grid gap-6 xl:grid-cols-[1fr_24rem]">
            <TransactionsCard currency={overview.currency} />
            <InvoicesCard onPay={setPayingInvoice} onView={setViewingInvoice} />
          </div>
          <FeeReceiptDialog
            invoice={payingInvoice}
            overview={overview}
            onClose={() => setPayingInvoice(null)}
          />
          <InvoiceDialog invoice={viewingInvoice} onClose={() => setViewingInvoice(null)} />
        </div>
      ) : (
        <EmptyState
          icon={Wallet}
          title="No billing set up"
          description="You have no active fee plan. When tuition or course fees are assigned to your account, they'll appear here."
        />
      )}
    </div>
  );
}

/** Deep-blue account banner, per the payment dashboard design. */
function BillingHero({ overview }: { overview: BillingOverview }) {
  return (
    <motion.section
      aria-label="Account overview"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl bg-primary px-6 py-8 text-white shadow-elevated md:px-8 md:py-10"
    >
      {/* Decorative sheen and oversized watermark */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 h-full w-1/2 bg-gradient-to-l from-white/15 to-transparent"
      />
      <GraduationCap
        aria-hidden="true"
        className="pointer-events-none absolute -right-6 -bottom-8 size-48 text-white opacity-[0.06]"
      />

      <div className="relative flex flex-wrap items-center justify-between gap-8">
        <div className="flex items-center gap-5">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10">
            <GraduationCap className="size-7" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-display text-headline-md text-white md:text-headline-lg">
              {overview.plan_title ?? "Tuition & fees"}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-white/20 px-3 py-1 font-mono text-label-sm uppercase">
                Account overview
              </span>
              {overview.billing_active && (
                <span className="flex items-center gap-1.5 font-mono text-label-sm text-white/90 uppercase">
                  <BadgeCheck className="size-4" aria-hidden="true" />
                  Billing active
                </span>
              )}
              {overview.installments && (
                <span className="rounded-full bg-white/20 px-3 py-1 font-mono text-label-sm uppercase">
                  {overview.installments.paid_count}/{overview.installments.months} installments paid
                  · due day {overview.installments.due_day}
                </span>
              )}
            </div>
          </div>
        </div>

        <dl className="flex gap-10 text-left md:gap-12">
          <div>
            <dt className="font-mono text-label-sm text-white/70 uppercase">Total tuition</dt>
            <dd className="mt-1 font-display text-headline-md md:text-headline-lg">
              {formatMoney(overview.total_amount, overview.currency)}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-label-sm text-white/70 uppercase">Paid to date</dt>
            <dd className="mt-1 font-display text-headline-md md:text-headline-lg">
              {formatMoney(overview.paid_amount, overview.currency)}{" "}
              <span className="text-body-md text-white/60">
                ({formatPercent(overview.paid_percent)})
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </motion.section>
  );
}

/** The plan's terms and progress, mirroring the academy's installment rules. */
function InstallmentPlanCard({ info, currency }: { info: InstallmentInfo; currency: string }) {
  const percent = info.months > 0 ? Math.round((info.paid_count / info.months) * 100) : 0;
  const ordinal = (day: number) => {
    const suffix = day % 10 === 1 && day !== 11 ? "st" : day % 10 === 2 && day !== 12 ? "nd" : day % 10 === 3 && day !== 13 ? "rd" : "th";
    return `${day}${suffix}`;
  };

  return (
    <motion.section
      aria-label="Installment plan"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }}
    >
      <Card className="gap-0 p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-base font-semibold text-on-surface">Installment plan</h3>
            <p className="text-sm text-on-surface-variant">
              {info.months} monthly installments — each opens {info.activation_days} days before its due date.
            </p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 font-mono text-label-sm text-primary uppercase">
            {info.paid_count}/{info.months} paid
          </span>
        </div>

        <Progress value={percent} className="h-2" />

        <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
          <div>
            <dt className="font-mono text-label-sm text-on-surface-variant/70 uppercase">Due date</dt>
            <dd className="mt-0.5 font-medium text-on-surface">{ordinal(info.due_day)} of each month</dd>
          </div>
          <div>
            <dt className="font-mono text-label-sm text-on-surface-variant/70 uppercase">Grace period</dt>
            <dd className="mt-0.5 font-medium text-on-surface">{info.grace_days} days after due</dd>
          </div>
          <div>
            <dt className="font-mono text-label-sm text-on-surface-variant/70 uppercase">Late fine</dt>
            <dd className="mt-0.5 font-medium text-on-surface">
              {formatMoney(info.fine_per_day, currency)}/day after grace
            </dd>
          </div>
          <div>
            <dt className="font-mono text-label-sm text-on-surface-variant/70 uppercase">Fines so far</dt>
            <dd className={`mt-0.5 font-medium ${info.defaulted_fine_total > 0 ? "text-error" : "text-on-surface"}`}>
              {info.defaulted_fine_total > 0 ? formatMoney(info.defaulted_fine_total, currency) : "None"}
            </dd>
          </div>
        </dl>
      </Card>
    </motion.section>
  );
}

/** One-time admission charges (registration fee + advance first installment)
 *  called out separately so new students know exactly what to pay and why. */
function AdmissionCard({
  admission,
  currency,
  onPay,
}: {
  admission: NonNullable<BillingOverview["admission"]>;
  currency: string;
  onPay: (invoice: Invoice) => void;
}) {
  return (
    <motion.section
      aria-label="Confirm your admission"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.03, ease: "easeOut" }}
      className="rounded-3xl border border-secondary/25 bg-secondary/5 p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-label-sm text-secondary uppercase">Admission · one-time charges</p>
          <h2 className="mt-1 font-display text-headline-md text-on-surface">Confirm your admission</h2>
          <p className="mt-1 max-w-xl text-body-sm text-on-surface-variant">
            These two payments are collected once, on your admission day. Your monthly installments
            continue separately from next month.
          </p>
        </div>
        {admission.total_due > 0 && (
          <div className="rounded-2xl bg-white px-5 py-3 text-right shadow-card">
            <p className="font-mono text-label-sm text-on-surface-variant uppercase">Pay today</p>
            <p className="font-display text-headline-md text-secondary">
              {formatMoney(admission.total_due, currency)}
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        {admission.invoices.map((invoice) => {
          const isRegistration = invoice.type === "registration";
          const underReview = invoice.status === "pending";
          return (
            <div
              key={invoice.id}
              className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-card"
            >
              <div className="min-w-0">
                <p className="text-body-md font-semibold text-on-surface">
                  {isRegistration ? "Registration fee" : "1st installment — advance"}
                </p>
                <p className="mt-0.5 text-body-sm text-on-surface-variant">
                  {isRegistration
                    ? "One-time fee that confirms your registration."
                    : "Your first monthly fee, paid in advance at admission."}
                </p>
                <p className="mt-1 font-mono text-label-sm text-on-surface-variant">{invoice.number}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-display text-body-lg font-semibold text-on-surface">
                  {formatMoney(invoice.payable_total, invoice.currency)}
                </p>
                {underReview ? (
                  <span className="mt-1.5 inline-block rounded-full bg-warning-container/70 px-2.5 py-1 font-mono text-label-sm text-on-warning-container">
                    under review
                  </span>
                ) : (
                  <Button size="sm" className="mt-1.5" onClick={() => onPay(invoice)}>
                    Pay
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </motion.section>
  );
}

function BillingStatCards({
  overview,
  onPay,
}: {
  overview: BillingOverview;
  onPay: (invoice: Invoice) => void;
}) {
  const settled = overview.remaining_amount <= 0;
  const underReview = overview.pending_invoice !== null;
  const active = overview.next_invoice;
  const defaulted = active?.status === "past_due";
  const dueToday =
    !!active?.due_at && new Date(active.due_at).toDateString() === new Date().toDateString();
  const inGrace = active?.status === "open" && active.in_grace && !dueToday;
  const cycleLabel = overview.billing_cycle
    ? (cycleLabels[overview.billing_cycle] ?? overview.billing_cycle)
    : null;

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
      >
        <Card className="h-full p-6">
          <div className="flex items-start justify-between">
            <div className="flex size-11 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant">
              <Wallet className="size-5" aria-hidden="true" />
            </div>
            <span className="font-mono text-label-sm text-on-surface-variant uppercase">
              Total tuition
            </span>
          </div>
          <p className="mt-4 font-display text-headline-lg text-on-surface">
            {formatMoney(overview.total_amount, overview.currency)}
          </p>
          {cycleLabel && <p className="mt-1 text-body-sm text-on-surface-variant">{cycleLabel}</p>}
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
      >
        <Card className="h-full p-6">
          <div className="flex items-start justify-between">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CircleCheck className="size-5" aria-hidden="true" />
            </div>
            <span className="font-mono text-label-sm text-primary uppercase">Paid to date</span>
          </div>
          <p className="mt-4 font-display text-headline-lg text-primary">
            {formatMoney(overview.paid_amount, overview.currency)}
          </p>
          <Progress
            value={overview.paid_percent}
            className="mt-3"
            aria-label="Share of total fee covered"
          />
          <p className="mt-2 font-mono text-label-sm text-on-surface-variant">
            {formatPercent(overview.paid_percent)} of total fee covered
          </p>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
      >
        <Card className="h-full p-6">
          <div className="flex items-start justify-between">
            <div
              className={
                settled
                  ? "flex size-11 items-center justify-center rounded-xl bg-success-container text-success"
                  : "flex size-11 items-center justify-center rounded-xl bg-error-container text-error"
              }
            >
              <CalendarClock className="size-5" aria-hidden="true" />
            </div>
            <span
              className={
                settled
                  ? "font-mono text-label-sm text-success uppercase"
                  : "font-mono text-label-sm text-error uppercase"
              }
            >
              Remaining
            </span>
          </div>
          <p className="mt-4 font-display text-headline-lg text-on-surface">
            {formatMoney(overview.remaining_amount, overview.currency)}
          </p>
          {settled ? (
            <p className="mt-1 text-body-sm text-on-surface-variant">
              All settled — nothing due right now.
            </p>
          ) : (
            <>
              {overview.next_due_at && (
                <p className="mt-1 text-body-sm text-on-surface-variant">
                  {dueToday ? "Due today" : `Due by ${formatDate(overview.next_due_at)}`}
                </p>
              )}
              {underReview && (
                <p className="mt-2 rounded-lg bg-warning-container/60 px-3 py-2 text-body-sm text-on-warning-container">
                  {formatMoney(overview.pending_review_amount, overview.currency)} under review —
                  we'll notify you once it's verified.
                </p>
              )}
              {inGrace && (
                <p className="mt-2 rounded-lg bg-warning-container/60 px-3 py-2 text-body-sm text-on-warning-container">
                  <span className="font-semibold">Due date passed.</span> Pay now to avoid a fine of{" "}
                  {formatMoney(overview.installments?.fine_per_day ?? 0, overview.currency)}/day.
                </p>
              )}
              {defaulted && active && (
                <p className="mt-2 rounded-lg bg-error-container/60 px-3 py-2 text-body-sm text-on-error-container">
                  <span className="font-semibold">Defaulter:</span>{" "}
                  {formatMoney(active.fine_amount, active.currency)} fine added ({active.fine_days}{" "}
                  days) — {formatMoney(overview.installments?.fine_per_day ?? 0, overview.currency)}
                  /day keeps adding until you pay.
                </p>
              )}
              <Button
                className="mt-4 w-full"
                disabled={!overview.next_invoice}
                onClick={() => {
                  if (overview.next_invoice) onPay(overview.next_invoice);
                }}
              >
                <CreditCard className="size-4" aria-hidden="true" />
                Pay now
                <ArrowRight className="size-4" aria-hidden="true" />
              </Button>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

function BillingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-44 w-full rounded-3xl" />
      <div className="grid gap-6 md:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index} className="space-y-4 p-6">
            <div className="flex items-start justify-between">
              <Skeleton className="size-11 rounded-xl" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-40" />
          </Card>
        ))}
      </div>
      <Card className="space-y-4 p-6">
        <Skeleton className="h-6 w-48" />
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </Card>
    </div>
  );
}
