import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { billingRepository } from "@/api/repositories";
import { qk } from "@/lib/query-keys";
import type { InvoiceListParams, PaymentIntentResponse, TransactionListParams } from "@/types";

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

/**
 * Shared settlement handling: hosted checkouts redirect the whole page,
 * immediate settlements refresh the billing caches.
 */
function settle(queryClient: ReturnType<typeof useQueryClient>, response: PaymentIntentResponse) {
  if (response.checkout_url) {
    window.location.assign(response.checkout_url);
    return;
  }
  void queryClient.invalidateQueries({ queryKey: qk.billing });
  toast.success("Payment received — thank you!");
}

export function usePayInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invoiceId: number) => billingRepository.payInvoice(invoiceId),
    onSuccess: (response) => settle(queryClient, response),
  });
}

export function useRetryTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transactionId: number) => billingRepository.retryTransaction(transactionId),
    onSuccess: (response) => settle(queryClient, response),
  });
}
