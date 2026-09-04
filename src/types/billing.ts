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

export type TransactionStatus = "success" | "pending" | "rejected" | "failed" | "refunded";

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
  payer_name: string | null;
  bank_name: string | null;
  reference_no: string | null;
  payment_date: string | null;
  notes: string | null;
  submitted_by_student: boolean;
  rejection_reason: string | null;
  reviewed_at: string | null;
}

export type InvoiceStatus = "upcoming" | "open" | "pending" | "paid" | "past_due" | "void";

export interface Invoice {
  id: number;
  /** Public number, e.g. "INV-2026-0042". */
  number: string;
  /** "installment" for plan installments, "registration" for the admission fee. */
  type?: "installment" | "registration";
  /** 1-based installment position when part of a monthly plan. */
  sequence_no: number | null;
  title: string | null;
  amount: number;
  /** Accrued late-payment fine so far. Not the absence fine. */
  fine_amount: number;
  fine_days: number;
  /** Fine for absences beyond the monthly allowance. */
  absence_fine_amount: number;
  /** Credited back when an absence was corrected after being billed. */
  absence_fine_credit: number;
  /** Everything above netted off — what the student actually pays. */
  payable_total: number;
  currency: string;
  status: InvoiceStatus;
  issued_at: string;
  /** When the installment opens for payment. */
  activates_at: string | null;
  due_at: string | null;
  /** Due date passed but still inside the warning window. */
  in_grace: boolean;
  days_overdue: number;
  paid_at: string | null;
  download_url: string | null;
  /** Most recent student fee submission, when the endpoint includes it. */
  latest_submission?: Transaction | null;
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
  /** Sum of invoices currently under admin review. */
  pending_review_amount: number;
  /** The invoice whose submission is being reviewed, if any. */
  pending_invoice: Invoice | null;
  /** Accounts a student can pay into (JazzCash, bank transfer, ...). */
  payment_channels: PaymentChannel[];
  /** Configured accounts with full details, scoped to the plan's course. */
  payment_methods?: PaymentMethodInfo[];
  support_phone: string | null;
  /** Academy name from Settings — printed on the invoice header. */
  site_name: string | null;
  /** Present when the plan is a monthly installment schedule. */
  installments: InstallmentInfo | null;
  /** Unsettled one-time admission charges (registration fee + advance 1st installment). */
  admission?: { invoices: Invoice[]; total_due: number } | null;
}

export interface InstallmentInfo {
  months: number;
  due_day: number;
  fine_per_day: number;
  grace_days: number;
  activation_days: number;
  paid_count: number;
  defaulted_fine_total: number;
}

export interface PaymentChannel {
  value: string;
  label: string;
}

export interface PaymentMethodInfo {
  id: number;
  name: string;
  channel: string;
  channel_label: string;
  account_title: string;
  account_number: string;
  bank_name: string | null;
  instructions: string | null;
}

export interface SubmitFeePayload {
  /** Legacy free-form channel — used when no configured method is chosen. */
  channel?: string;
  /** Configured payment method the student paid into. */
  payment_method_id?: number;
  payer_name?: string;
  reference_no?: string;
  payment_date?: string;
  notes?: string;
  receipt: File;
}

export interface TransactionListParams extends ListParams {
  status?: TransactionStatus;
  from?: string;
  to?: string;
}

export interface InvoiceListParams extends ListParams {
  status?: InvoiceStatus;
}
