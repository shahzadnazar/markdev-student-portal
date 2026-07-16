import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, MailCheck, Send } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { ApiError } from "@/api/client";
import { authRepository } from "@/api/repositories";
import { FormError, FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { paths } from "@/routes/paths";
import type { ForgotPasswordPayload } from "@/types";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const mutation = useMutation({
    mutationFn: (payload: ForgotPasswordPayload) => authRepository.forgotPassword(payload),
    onSuccess: (_data, variables) => {
      setSubmittedEmail(variables.email);
      toast.success(`Reset link sent to ${variables.email}.`);
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        const emailMessage = error.errors.email?.[0];
        if (emailMessage) setError("email", { message: emailMessage });
        setError("root", { message: error.message });
        if (error.status !== 422) {
          toast.error(error.message);
        }
      } else {
        setError("root", { message: "Something went wrong. Please try again." });
        toast.error("Could not send the reset link. Please try again.");
      }
    },
  });

  const onSubmit = handleSubmit((values) => {
    mutation.mutate(values);
  });

  if (submittedEmail) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="rounded-2xl bg-white p-6 text-center shadow-card sm:p-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
            className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-success-container"
          >
            <MailCheck className="size-8 text-success" aria-hidden="true" />
          </motion.div>

          <p className="mt-6 font-mono text-label-sm text-primary uppercase">Email sent</p>
          <h1 className="mt-2 font-display text-headline-lg text-on-surface">Check your inbox</h1>
          <p className="mt-3 text-body-md text-on-surface-variant">
            If an account exists for{" "}
            <span className="font-medium text-on-surface">{submittedEmail}</span>, a password reset
            link is on its way. It may take a minute — check your spam folder too.
          </p>

          <div className="mt-8 space-y-3">
            <Button size="lg" className="w-full" asChild>
              <Link to={paths.login}>
                <ArrowLeft aria-hidden="true" />
                Back to sign in
              </Link>
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              onClick={() => {
                setSubmittedEmail(null);
                mutation.reset();
              }}
            >
              Use a different email
            </Button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
    >
      <div className="rounded-2xl bg-white p-6 shadow-card sm:p-8">
        {/* Heading block */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: "easeOut" }}
        >
          <p className="font-mono text-label-sm text-primary uppercase">Password recovery</p>
          <h1 className="mt-2 font-display text-headline-lg text-on-surface">Forgot your password?</h1>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Enter the email on your account and we'll send you a link to reset your password.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.16, ease: "easeOut" }}
          className="mt-8 space-y-5"
          onSubmit={(event) => void onSubmit(event)}
          noValidate
        >
          <FormError message={errors.root?.message} />

          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={errors.email ? true : undefined}
              aria-describedby={errors.email ? "email-error" : undefined}
              {...register("email")}
            />
          </FormField>

          <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Spinner className="text-on-primary" aria-hidden="true" />
                Sending link…
              </>
            ) : (
              <>
                <Send aria-hidden="true" />
                Send reset link
              </>
            )}
          </Button>
        </motion.form>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
        className="mt-6 text-center text-body-sm text-on-surface-variant"
      >
        Remembered it after all?{" "}
        <Link
          to={paths.login}
          className="font-medium text-primary transition-colors duration-150 hover:text-primary-deep hover:underline"
        >
          Back to sign in
        </Link>
      </motion.p>
    </motion.div>
  );
}
