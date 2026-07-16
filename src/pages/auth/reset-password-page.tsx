import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, ShieldAlert } from "lucide-react";
import { useForm } from "react-hook-form";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { ApiError } from "@/api/client";
import { authRepository } from "@/api/repositories";
import { FormError, FormField } from "@/components/shared/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { paths } from "@/routes/paths";
import type { ResetPasswordPayload } from "@/types";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    password_confirmation: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.password === values.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords do not match",
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

const FIELD_NAMES = ["password", "password_confirmation"] as const;

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  if (!token || !email) {
    return <InvalidLinkPanel />;
  }

  return <ResetPasswordForm token={token} email={email} />;
}

/** Shown when the URL is missing its token or email query params. */
function InvalidLinkPanel() {
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
          className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-error-container"
        >
          <ShieldAlert className="size-8 text-error" aria-hidden="true" />
        </motion.div>

        <p className="mt-6 font-mono text-label-sm text-error uppercase">Invalid link</p>
        <h1 className="mt-2 font-display text-headline-lg text-on-surface">
          This reset link won't work
        </h1>
        <p className="mt-3 text-body-md text-on-surface-variant">
          The link is missing its security token or email address — it may have been truncated by
          your email client, or it has expired. Request a fresh one to continue.
        </p>

        <Button size="lg" className="mt-8 w-full" asChild>
          <Link to={paths.forgotPassword}>
            Request a new link
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3, ease: "easeOut" }}
        className="mt-6 text-center text-body-sm text-on-surface-variant"
      >
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

function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", password_confirmation: "" },
  });

  const mutation = useMutation({
    mutationFn: (payload: ResetPasswordPayload) => authRepository.resetPassword(payload),
    onSuccess: () => {
      toast.success("Password updated. Sign in with your new password.");
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        for (const field of FIELD_NAMES) {
          const message = error.errors[field]?.[0];
          if (message) setError(field, { message });
        }
        // Token/email problems come back keyed on those fields — surface them at the root.
        const rootMessage = error.errors.token?.[0] ?? error.errors.email?.[0] ?? error.message;
        setError("root", { message: rootMessage });
        if (error.status !== 422) {
          toast.error(error.message);
        }
      } else {
        setError("root", { message: "Something went wrong. Please try again." });
        toast.error("Could not reset your password. Please try again.");
      }
    },
  });

  const onSubmit = handleSubmit((values) => {
    mutation.mutate({ email, token, ...values });
  });

  if (mutation.isSuccess) {
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
            <CheckCircle2 className="size-8 text-success" aria-hidden="true" />
          </motion.div>

          <p className="mt-6 font-mono text-label-sm text-primary uppercase">All set</p>
          <h1 className="mt-2 font-display text-headline-lg text-on-surface">Password reset</h1>
          <p className="mt-3 text-body-md text-on-surface-variant">
            Your password for <span className="font-medium text-on-surface">{email}</span> has been
            updated. Sign in with your new password to get back to learning.
          </p>

          <Button size="lg" className="mt-8 w-full" asChild>
            <Link to={paths.login}>
              <ArrowLeft aria-hidden="true" />
              Back to sign in
            </Link>
          </Button>
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
          <h1 className="mt-2 font-display text-headline-lg text-on-surface">Choose a new password</h1>
          <p className="mt-2 text-body-md text-on-surface-variant">
            Setting a new password for{" "}
            <span className="font-medium text-on-surface">{email}</span>. Make it at least 8
            characters.
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

          <FormField
            label="New password"
            htmlFor="password"
            error={errors.password?.message}
            hint="At least 8 characters."
          >
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="New password"
                className="pr-11"
                aria-invalid={errors.password ? true : undefined}
                aria-describedby={errors.password ? "password-error" : undefined}
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-lg text-outline transition-colors duration-150 hover:text-on-surface"
              >
                {showPassword ? (
                  <EyeOff className="size-4" aria-hidden="true" />
                ) : (
                  <Eye className="size-4" aria-hidden="true" />
                )}
              </button>
            </div>
          </FormField>

          <FormField
            label="Confirm new password"
            htmlFor="password_confirmation"
            error={errors.password_confirmation?.message}
          >
            <Input
              id="password_confirmation"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat the new password"
              aria-invalid={errors.password_confirmation ? true : undefined}
              aria-describedby={
                errors.password_confirmation ? "password_confirmation-error" : undefined
              }
              {...register("password_confirmation")}
            />
          </FormField>

          <Button type="submit" size="lg" className="w-full" disabled={mutation.isPending}>
            {mutation.isPending ? (
              <>
                <Spinner className="text-on-primary" aria-hidden="true" />
                Resetting password…
              </>
            ) : (
              <>
                <KeyRound aria-hidden="true" />
                Reset password
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
        Remembered your password?{" "}
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
