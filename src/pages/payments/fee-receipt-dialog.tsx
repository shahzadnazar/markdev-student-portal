import { zodResolver } from "@hookform/resolvers/zod";
import { CircleHelp, FileText, Phone, UploadCloud, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { z } from "zod";
import { ApiError } from "@/api/client";
import { FormError, FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useSubmitFeePayment } from "@/hooks/use-billing";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BillingOverview, Invoice } from "@/types";

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/webp", "application/pdf"];

const today = () => new Date().toISOString().slice(0, 10);

const schema = z.object({
  channel: z.string().min(1, "Choose where you paid"),
  payer_name: z.string().trim().optional(),
  reference_no: z.string().trim().optional(),
  payment_date: z
    .string()
    .min(1, "Tell us when you made the payment")
    .refine((value) => value <= today(), {
      message: "The payment date cannot be in the future",
    }),
  notes: z.string().trim().max(500, "Keep notes under 500 characters").optional(),
  receipt: z
    .instanceof(File, { message: "Attach your payment receipt" })
    .refine((file) => ACCEPTED_TYPES.includes(file.type), "Use a PNG, JPG, WEBP or PDF file")
    .refine((file) => file.size <= MAX_RECEIPT_BYTES, "The receipt must be 5MB or smaller"),
});

type FormValues = z.infer<typeof schema>;

interface FeeReceiptDialogProps {
  invoice: Invoice | null;
  overview: BillingOverview;
  onClose: () => void;
}

/** The "Fee Receipt" submission modal — proof of payment goes in, status starts pending. */
export function FeeReceiptDialog({ invoice, overview, onClose }: FeeReceiptDialogProps) {
  const submitFee = useSubmitFeePayment();
  const [rootError, setRootError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { channel: "", payer_name: "", reference_no: "", payment_date: today(), notes: "" },
  });

  const receipt = form.watch("receipt") as File | undefined;

  // Configured accounts (JazzCash, bank …) win over the legacy free-form
  // channel list; the select then carries the method id.
  const methods = overview.payment_methods ?? [];
  const usingMethods = methods.length > 0;
  const selectedMethod = usingMethods
    ? methods.find((method) => String(method.id) === form.watch("channel"))
    : undefined;
  // Cash is handed over at the counter — no account to show; the paper
  // fee receipt's number is what identifies the payment instead.
  const isCash = selectedMethod?.channel === "cash_deposit";

  // Live preview of the attached receipt.
  const previewUrl = useMemo(
    () => (receipt && receipt.type.startsWith("image/") ? URL.createObjectURL(receipt) : null),
    [receipt],
  );
  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  // Reset the form whenever a different invoice opens the dialog.
  useEffect(() => {
    if (invoice) {
      form.reset({ channel: "", payer_name: "", reference_no: "", payment_date: today(), notes: "" });
      setRootError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice?.id]);

  if (!invoice) return null;

  const isRegistration = invoice.type === "registration";
  const isAdvance = (invoice.title ?? "").toLowerCase().includes("advance");

  function attachFile(file: File | undefined) {
    if (!file) return;
    form.setValue("receipt", file, { shouldValidate: true });
  }

  function handleSubmit(values: FormValues) {
    setRootError(null);
    if (isCash && !values.reference_no?.trim()) {
      form.setError("reference_no", { message: "Enter the receipt number from your fee receipt" });
      return;
    }
    submitFee.mutate(
      {
        invoiceId: invoice!.id,
        payload: {
          ...(usingMethods
            ? { payment_method_id: Number(values.channel) }
            : { channel: values.channel }),
          payer_name: values.payer_name || undefined,
          reference_no: values.reference_no || undefined,
          payment_date: values.payment_date,
          notes: values.notes || undefined,
          receipt: values.receipt,
        },
      },
      {
        onSuccess: onClose,
        onError: (error) => {
          if (error instanceof ApiError) {
            setRootError(error.message);
            for (const [field, messages] of Object.entries(error.errors)) {
              form.setError(field as FieldPath<FormValues>, { message: messages[0] });
            }
          } else {
            setRootError("Couldn't submit your receipt. Please try again.");
          }
        },
      },
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
              <FileText className="size-5 text-primary" aria-hidden="true" />
            </span>
            <div>
              <DialogTitle>Fee receipt</DialogTitle>
              <DialogDescription>{overview.plan_title ?? invoice.title}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form noValidate onSubmit={form.handleSubmit(handleSubmit)} className="mt-2">
          <FormError message={rootError} />

          <div className="mt-2 grid gap-6 md:grid-cols-2">
            {/* Left: receipt details + assistance */}
            <div className="space-y-5">
              <div className="rounded-2xl border border-primary/15 bg-surface-ice/60 p-5">
                <p className="border-b border-outline-variant/40 pb-3 font-mono text-label-sm text-primary uppercase">
                  Receipt details
                </p>
                {(isRegistration || isAdvance) && (
                  <p
                    className={cn(
                      "mt-4 rounded-lg px-3 py-2 text-body-sm",
                      isRegistration ? "bg-secondary/10 text-secondary" : "bg-primary/10 text-primary",
                    )}
                  >
                    {isRegistration
                      ? "One-time registration fee — paying this confirms your admission."
                      : "First monthly installment, paid in advance on your admission day."}
                  </p>
                )}
                <dl className="mt-4 space-y-4">
                  <div>
                    <dt className="font-mono text-label-sm text-on-surface-variant">Invoice</dt>
                    <dd className="mt-0.5 text-body-md font-semibold text-on-surface">
                      {invoice.title ?? invoice.number}
                    </dd>
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <dt className="font-mono text-label-sm text-on-surface-variant">Number</dt>
                      <dd className="mt-0.5 font-mono text-body-sm text-on-surface">{invoice.number}</dd>
                    </div>
                    <div className="text-right">
                      <dt className="font-mono text-label-sm text-on-surface-variant">Total payable</dt>
                      <dd className="mt-0.5 font-display text-headline-md text-primary">
                        {formatMoney(invoice.payable_total, invoice.currency)}
                      </dd>
                    </div>
                  </div>
                  {invoice.fine_amount > 0 && (
                    <p className="rounded-lg bg-error-container/50 px-3 py-2 text-body-sm text-on-error-container">
                      Includes a defaulter fine of{" "}
                      <span className="font-semibold">{formatMoney(invoice.fine_amount, invoice.currency)}</span>{" "}
                      ({invoice.fine_days} {invoice.fine_days === 1 ? "day" : "days"} overdue) on top of the{" "}
                      {formatMoney(invoice.amount, invoice.currency)} installment.
                    </p>
                  )}
                </dl>
              </div>

              <div className="rounded-2xl bg-surface-container-low/70 p-5">
                <p className="flex items-center gap-2 font-mono text-label-md text-primary">
                  <CircleHelp className="size-4" aria-hidden="true" />
                  Need assistance?
                </p>
                <p className="mt-2 text-body-sm text-on-surface-variant">
                  If you face any issue during the payment process, reach out to our support team.
                </p>
                {overview.support_phone && (
                  <p className="mt-3 flex items-center gap-2 font-mono text-body-md font-semibold text-primary">
                    <Phone className="size-4" aria-hidden="true" />
                    {overview.support_phone}
                  </p>
                )}
              </div>
            </div>

            {/* Right: the submission form */}
            <div className="space-y-4">
              <p className="font-mono text-label-sm text-primary uppercase">
                1 · {isCash ? "Cash payment" : "Pay to this account"}
              </p>
              <FormField
                label="Payment method"
                htmlFor="fee-channel"
                error={form.formState.errors.channel?.message}
              >
                <Select
                  value={form.watch("channel")}
                  onValueChange={(value) =>
                    form.setValue("channel", value, { shouldValidate: form.formState.isSubmitted })
                  }
                >
                  <SelectTrigger id="fee-channel" aria-label="Payment method">
                    <SelectValue placeholder="Choose a payment method…" />
                  </SelectTrigger>
                  <SelectContent>
                    {usingMethods
                      ? methods.map((method) => (
                          <SelectItem key={method.id} value={String(method.id)}>
                            {method.name}
                          </SelectItem>
                        ))
                      : overview.payment_channels.map((channel) => (
                          <SelectItem key={channel.value} value={channel.value}>
                            {channel.label}
                          </SelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </FormField>

              {selectedMethod && isCash && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="font-mono text-label-sm text-primary uppercase">Pay at the counter</p>
                  <p className="mt-2 text-body-sm text-on-surface">
                    Hand the cash to the academy counter — you'll get a{" "}
                    <span className="font-semibold">fee receipt</span>. Enter its receipt number
                    below and attach a photo of it.
                  </p>
                  {selectedMethod.instructions && (
                    <p className="mt-2.5 border-t border-primary/10 pt-2.5 text-body-sm text-on-surface-variant">
                      {selectedMethod.instructions}
                    </p>
                  )}
                </div>
              )}

              {selectedMethod && !isCash && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="font-mono text-label-sm text-primary uppercase">Pay into this account</p>
                  <dl className="mt-2.5 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-body-sm text-on-surface-variant">Account title</dt>
                      <dd className="text-right text-body-sm font-semibold text-on-surface">
                        {selectedMethod.account_title}
                      </dd>
                    </div>
                    <div className="flex items-baseline justify-between gap-3">
                      <dt className="text-body-sm text-on-surface-variant">Account number</dt>
                      <dd className="text-right font-mono text-body-md font-semibold text-primary">
                        {selectedMethod.account_number}
                      </dd>
                    </div>
                    {selectedMethod.bank_name && (
                      <div className="flex items-baseline justify-between gap-3">
                        <dt className="text-body-sm text-on-surface-variant">Bank</dt>
                        <dd className="text-right text-body-sm text-on-surface">{selectedMethod.bank_name}</dd>
                      </div>
                    )}
                  </dl>
                  {selectedMethod.instructions && (
                    <p className="mt-2.5 border-t border-primary/10 pt-2.5 text-body-sm text-on-surface-variant">
                      {selectedMethod.instructions}
                    </p>
                  )}
                </div>
              )}

              <p className="pt-1 font-mono text-label-sm text-primary uppercase">2 · Submit your receipt</p>
              {/* Receipt dropzone with preview */}
              <div className="space-y-1.5">
                <p className="text-body-sm font-medium text-on-surface">Attach receipt</p>
                {receipt ? (
                  <div className="relative overflow-hidden rounded-xl border border-outline-variant/60">
                    {previewUrl ? (
                      <img src={previewUrl} alt="Receipt preview" className="max-h-56 w-full bg-surface-ice object-contain" />
                    ) : (
                      <div className="flex items-center gap-3 bg-surface-ice/70 p-4">
                        <FileText className="size-8 shrink-0 text-primary" aria-hidden="true" />
                        <div className="min-w-0">
                          <p className="truncate text-body-sm font-medium text-on-surface">{receipt.name}</p>
                          <p className="font-mono text-label-sm text-on-surface-variant">
                            PDF · {(receipt.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        form.resetField("receipt");
                        if (fileInputRef.current) fileInputRef.current.value = "";
                      }}
                      className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-error"
                      aria-label="Remove receipt"
                    >
                      <X className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragging(false);
                      attachFile(event.dataTransfer.files?.[0]);
                    }}
                    className={cn(
                      "flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                      dragging
                        ? "border-primary bg-primary/5"
                        : "border-outline-variant bg-surface-ice/50 hover:border-primary/50",
                    )}
                  >
                    <span className="flex size-12 items-center justify-center rounded-full bg-white shadow-card">
                      <UploadCloud className="size-5 text-primary" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-body-sm font-medium text-on-surface">
                      Drop file here or click to upload
                    </span>
                    <span className="text-body-sm text-on-surface-variant">
                      Supported formats: PNG, JPG, PDF (max 5MB)
                    </span>
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES.join(",")}
                  className="sr-only"
                  aria-label="Attach receipt"
                  onChange={(event) => attachFile(event.target.files?.[0] ?? undefined)}
                />
                {form.formState.errors.receipt && (
                  <p role="alert" className="text-body-sm text-error">
                    {form.formState.errors.receipt.message as string}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  label="Payment date"
                  htmlFor="fee-date"
                  error={form.formState.errors.payment_date?.message}
                >
                  <Input
                    id="fee-date"
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    {...form.register("payment_date")}
                  />
                </FormField>
                <FormField
                  label="Payer name (optional)"
                  htmlFor="fee-payer"
                  error={form.formState.errors.payer_name?.message}
                >
                  <Input id="fee-payer" placeholder="Name on the payment" {...form.register("payer_name")} />
                </FormField>
              </div>

              <FormField
                label={isCash ? "Receipt number" : "Transaction reference (optional)"}
                htmlFor="fee-reference"
                error={form.formState.errors.reference_no?.message}
                hint={
                  isCash
                    ? "The number printed on the fee receipt you got at the counter."
                    : "If your slip shows a TID / reference number, add it here."
                }
              >
                <Input
                  id="fee-reference"
                  placeholder={isCash ? "e.g. RCP-1042" : "e.g. JC-4598812"}
                  {...form.register("reference_no")}
                />
              </FormField>

              <FormField label="Notes (optional)" htmlFor="fee-notes" error={form.formState.errors.notes?.message}>
                <Textarea id="fee-notes" rows={2} placeholder="Anything the reviewer should know…" {...form.register("notes")} />
              </FormField>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 border-t border-outline-variant/40 pt-5">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitFee.isPending}
              className="bg-success hover:bg-success/90"
            >
              {submitFee.isPending && <Spinner className="size-4 text-on-primary" />}
              Submit fee receipt
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
