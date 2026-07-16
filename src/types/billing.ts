import type { ListParams } from "./api";

export type PaymentMethodType = "card" | "bank_transfer" | "wallet" | "cash" | "other";

export interface PaymentMethodSummary {
  type: PaymentMethodType;
  /** Card brand when type is card, e.g. "Visa". */
  brand: string | null;
  /** Last four digits when type is card. */
  last4: string | null;
  /** Human label the API pre-renders, e.g. "Visa •••• 4242" or "Bank Transfer". */
  label: string;
}

export type TransactionStatus = "success" | "pending" | "failed" | "refunded";

export interface Transaction {
  id: number;
  /** Public reference, e.g. "TRX-99201". */
  reference: string;
  invoice_id: number | null;
  description: string | null;
  method: PaymentMethodSummary;
  amount: number;
  /** ISO 4217, e.g. "USD". */
  currency: string;
  status: TransactionStatus;
  created_at: string;
  receipt_url: string | null;
}

export type InvoiceStatus = "open" | "paid" | "past_due" | "void";

export interface Invoice {
  id: number;
  /** Public number, e.g. "INV-2026-0042". */
  number: string;
  title: string | null;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  issued_at: string;
  due_at: string | null;
  paid_at: string | null;
  download_url: string | null;
}

export interface BillingOverview {
  /** What the student is billed for, e.g. "Advanced Web Development". */
  plan_title: string | null;
  /** e.g. "annual", "monthly", "one_time". */
  billing_cycle: string | null;
  billing_active: boolean;
  currency: string;
  total_amount: number;
  paid_amount: number;
  remaining_amount: number;
  /** Percentage 0–100 of the total already covered. */
  paid_percent: number;
  next_due_at: string | null;
  /** The invoice "Pay Now" should settle, when one is open. */
  next_invoice: Invoice | null;
  /** Downloadable account statement (PDF), when available. */
  statement_url: string | null;
}

export interface TransactionListParams extends ListParams {
  status?: TransactionStatus;
  from?: string;
  to?: string;
}

export interface InvoiceListParams extends ListParams {
  status?: InvoiceStatus;
}

/** Response of pay/retry: either a hosted checkout redirect or a settled transaction. */
export interface PaymentIntentResponse {
  checkout_url: string | null;
  transaction: Transaction | null;
}
