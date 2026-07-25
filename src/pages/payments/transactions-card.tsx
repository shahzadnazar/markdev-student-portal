import { transactionStatusConfig } from "@/lib/status";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Banknote, CreditCard, Landmark, Receipt, ReceiptText, Wallet } from "lucide-react";
import { useState } from "react";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PaginationBar } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTransactions } from "@/hooks/use-billing";
import { formatDate, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { PaymentMethodType, Transaction, TransactionStatus } from "@/types";

const PER_PAGE = 8;

type StatusFilter = TransactionStatus | "all";

const methodIcons: Record<PaymentMethodType, LucideIcon> = {
  card: CreditCard,
  bank_transfer: Landmark,
  wallet: Wallet,
  cash: Banknote,
  other: Receipt,
};

const statusConfig = transactionStatusConfig;

export function TransactionsCard({ currency }: { currency: string }) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);

  const transactionsQuery = useTransactions({
    page,
    per_page: PER_PAGE,
    status: status === "all" ? undefined : status,
  });

  const transactions = transactionsQuery.data?.data ?? [];

  return (
    <motion.section
      aria-label="Payment history"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2, ease: "easeOut" }}
    >
      <Card className="p-5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-headline-md text-on-surface">Payment history</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              Tracking all transactions for the current academic year.
            </p>
          </div>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value as StatusFilter);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40" aria-label="Filter by status">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Under review</SelectItem>
              <SelectItem value="success">Verified</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {transactionsQuery.isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center gap-4 py-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-32 flex-1" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            ))}
          </div>
        ) : transactionsQuery.isError ? (
          <ErrorState
            title="Couldn't load transactions"
            error={transactionsQuery.error}
            onRetry={() => {
              void transactionsQuery.refetch();
            }}
          />
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title={status === "all" ? "No transactions yet" : "No matching transactions"}
            description={
              status === "all"
                ? "Payments you make will appear here with their receipts."
                : "Try a different status filter."
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div
              className={cn(
                "hidden overflow-x-auto md:block transition-opacity duration-200",
                transactionsQuery.isPlaceholderData && transactionsQuery.isFetching && "opacity-60",
              )}
            >
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant/40">
                    {["Transaction ID", "Date", "Method", "Amount", "Status", ""].map(
                      (heading, index) => (
                        <th
                          key={index}
                          scope="col"
                          className="pb-3 pl-2 font-mono text-label-sm font-medium text-on-surface-variant uppercase first:pl-0"
                        >
                          {heading || <span className="sr-only">Actions</span>}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {transactions.map((transaction) => (
                    <TransactionRow key={transaction.id} transaction={transaction} currency={currency} />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile stacked rows */}
            <ul className="space-y-3 md:hidden">
              {transactions.map((transaction) => (
                <TransactionMobileRow key={transaction.id} transaction={transaction} currency={currency} />
              ))}
            </ul>

            {transactionsQuery.data && (
              <PaginationBar
                meta={transactionsQuery.data.meta}
                onPageChange={setPage}
                className="mt-6"
              />
            )}
          </>
        )}
      </Card>
    </motion.section>
  );
}

function TransactionActions({ transaction }: { transaction: Transaction }) {
  if (transaction.receipt_url) {
    return (
      <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-8" asChild>
              <a
                href={transaction.receipt_url}
                target="_blank"
                rel="noreferrer"
                aria-label={`Receipt for ${transaction.reference}`}
              >
                <ReceiptText className="size-4" aria-hidden="true" />
              </a>
            </Button>
          </TooltipTrigger>
          <TooltipContent>View receipt</TooltipContent>
      </Tooltip>
    );
  }

  return null;
}

function MethodCell({ transaction }: { transaction: Transaction }) {
  const MethodIcon = methodIcons[transaction.method.type];
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <MethodIcon className="size-4" aria-hidden="true" />
      </span>
      <span className="text-body-sm text-on-surface">{transaction.method.label}</span>
    </span>
  );
}

function TransactionRow({ transaction, currency }: { transaction: Transaction; currency: string }) {
  const status = statusConfig[transaction.status];
  return (
    <tr>
      <td className="py-4 pr-2 font-mono text-label-md text-on-surface">#{transaction.reference}</td>
      <td className="py-4 pr-2 pl-2 text-body-sm text-on-surface-variant">
        {formatDate(transaction.created_at)}
      </td>
      <td className="py-4 pr-2 pl-2">
        <MethodCell transaction={transaction} />
      </td>
      <td className="py-4 pr-2 pl-2 text-body-sm font-semibold text-on-surface">
        {formatMoney(transaction.amount, transaction.currency || currency)}
      </td>
      <td className="py-4 pr-2 pl-2">
        <Badge variant={status.variant}>{status.label}</Badge>
        {transaction.status === "rejected" && transaction.rejection_reason && (
          <p className="mt-1 max-w-48 text-label-sm text-error" title={transaction.rejection_reason}>
            {transaction.rejection_reason}
          </p>
        )}
      </td>
      <td className="py-4 pl-2 text-right">
        <TransactionActions transaction={transaction} />
      </td>
    </tr>
  );
}

function TransactionMobileRow({
  transaction,
  currency,
}: {
  transaction: Transaction;
  currency: string;
}) {
  const status = statusConfig[transaction.status];
  return (
    <li className="rounded-xl border border-outline-variant/40 p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-label-md text-on-surface">#{transaction.reference}</span>
        <Badge variant={status.variant}>{status.label}</Badge>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3">
        <MethodCell transaction={transaction} />
        <span className="text-body-md font-semibold text-on-surface">
          {formatMoney(transaction.amount, transaction.currency || currency)}
        </span>
      </div>
      {transaction.status === "rejected" && transaction.rejection_reason && (
        <p className="mt-2 rounded-lg bg-error-container/50 px-3 py-2 text-label-sm text-on-error-container">
          {transaction.rejection_reason}
        </p>
      )}
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="font-mono text-label-sm text-on-surface-variant">
          {formatDate(transaction.created_at)}
        </span>
        <TransactionActions transaction={transaction} />
      </div>
    </li>
  );
}
