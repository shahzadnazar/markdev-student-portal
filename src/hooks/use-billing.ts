import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { billingRepository } from "@/api/repositories";
import { qk } from "@/lib/query-keys";
import type { InvoiceListParams, SubmitFeePayload, TransactionListParams } from "@/types";

export function useBillingOverview() {
  return useQuery({ queryKey: qk.billing, queryFn: () => billingRepository.overview() });
}

export function useTransactions(params: TransactionListParams = {}) {
  return useQuery({
    queryKey: qk.billingTransactions(params),
    queryFn: () => billingRepository.transactions(params),
    placeholderData: (previous) => previous,
  });
}

export function useInvoices(params: InvoiceListParams = {}) {
  return useQuery({
    queryKey: qk.billingInvoices(params),
    queryFn: () => billingRepository.invoices(params),
    placeholderData: (previous) => previous,
  });
}

export function useSubmitFeePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invoiceId, payload }: { invoiceId: number; payload: SubmitFeePayload }) =>
      billingRepository.submitPayment(invoiceId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk.billing });
      toast.success("Receipt submitted — we'll notify you once it's reviewed.");
    },
  });
}
