import { get, getRaw, post } from "@/api/client";
import type {
  BillingOverview,
  Invoice,
  InvoiceListParams,
  Paginated,
  SubmitFeePayload,
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

  /** Uploads proof of payment; the submission awaits admin verification. */
  submitPayment(invoiceId: number | string, payload: SubmitFeePayload) {
    const form = new FormData();
    if (payload.payment_method_id) {
      form.append("payment_method_id", String(payload.payment_method_id));
    } else if (payload.channel) {
      form.append("channel", payload.channel);
    }
    if (payload.payer_name) form.append("payer_name", payload.payer_name);
    if (payload.reference_no) form.append("reference_no", payload.reference_no);
    if (payload.payment_date) form.append("payment_date", payload.payment_date);
    if (payload.notes) form.append("notes", payload.notes);
    form.append("receipt", payload.receipt);
    return post<Transaction>(`/billing/invoices/${invoiceId}/submissions`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
