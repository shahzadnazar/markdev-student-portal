import { get, getRaw, post } from "@/api/client";
import type {
  BillingOverview,
  Invoice,
  InvoiceListParams,
  Paginated,
  PaymentIntentResponse,
  Transaction,
  TransactionListParams,
} from "@/types";

export const billingRepository = {
  overview() {
    return get<BillingOverview>("/billing");
  },

  transactions(params: TransactionListParams = {}) {
    return getRaw<Paginated<Transaction>>("/billing/transactions", { params });
  },

  invoices(params: InvoiceListParams = {}) {
    return getRaw<Paginated<Invoice>>("/billing/invoices", { params });
  },

  /** Starts payment of an open invoice — may hand back a hosted checkout URL. */
  payInvoice(invoiceId: number | string) {
    return post<PaymentIntentResponse>(`/billing/invoices/${invoiceId}/pay`);
  },

  /** Retries a failed transaction. */
  retryTransaction(transactionId: number | string) {
    return post<PaymentIntentResponse>(`/billing/transactions/${transactionId}/retry`);
  },
};
