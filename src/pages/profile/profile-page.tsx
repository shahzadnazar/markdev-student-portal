import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Camera, KeyRound, UserRound } from "lucide-react";
import { useRef, useState } from "react";
import { useForm, type FieldPath } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ApiError } from "@/api/client";
import { authRepository } from "@/api/repositories";
import { FormError, FormField } from "@/components/shared/form-field";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { formatDate, initials } from "@/lib/format";
import type { User } from "@/types";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const profileSchema = z.object({
  name: z.string().trim().min(2, "Your name must be at least 2 characters"),
  headline: z.string().trim().max(120, "Keep your headline under 120 characters").optional(),
  phone: z.string().trim().max(30, "That phone number looks too long").optional(),
  bio: z.string().trim().max(500, "Keep your bio under 500 characters").optional(),
});

const passwordSchema = z
  .object({
    current_password: z.string().min(1, "Enter your current password"),
    password: z.string().min(8, "Use at least 8 characters"),
    password_confirmation: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.password === values.password_confirmation, {
    message: "Passwords don't match",
    path: ["password_confirmation"],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

interface UserCardProps {
  user: User;
  setUser: (user: User) => void;
}

export default function ProfilePage() {
  const { user, setUser } = useAuth();

  if (!user) return null;

  return (
    <div>
      <PageHeader eyebrow="Account" title="Profile" description="How you appear across MarkDev." />

      <div className="grid gap-6 lg:grid-cols-[22rem_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
        >
          <IdentityCard user={user} setUser={setUser} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
          className="space-y-6"
        >
          <ProfileDetailsCard user={user} setUser={setUser} />
          <ChangePasswordCard />
        </motion.div>
      </div>
    </div>
  );
}

function IdentityCard({ user, setUser }: UserCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarMutation = useMutation({
    mutationFn: (file: File) => authRepository.updateAvatar(file),
    onSuccess: (updated) => {
      setUser(updated);
      toast.success("Profile photo updated");
    },
    onError: (error) => {
      toast.error(error instanceof ApiError ? error.message : "Couldn't update your photo");
    },
  });

  function handleFileChange(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Please choose an image under 2 MB");
      return;
    }
    avatarMutation.mutate(file);
  }

  return (
    <Card className="flex flex-col items-center p-6 text-center">
      <div className="relative">
        <Avatar className="size-20 text-headline-md">
          <AvatarImage src={user.avatar_url ?? undefined} alt="" />
          <AvatarFallback>{initials(user.name)}</AvatarFallback>
        </Avatar>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          aria-label="Upload profile photo"
          onChange={(event) => {
            handleFileChange(event.target.files);
            event.target.value = "";
          }}
        />
        <Button
          variant="primary"
          size="icon"
          className="absolute -right-1 -bottom-1 size-8 rounded-full shadow-elevated"
          onClick={() => fileInputRef.current?.click()}
          disabled={avatarMutation.isPending}
          aria-label="Change profile photo"
        >
          {avatarMutation.isPending ? (
            <Spinner className="size-4 text-on-primary" />
          ) : (
            <Camera className="size-4" aria-hidden="true" />
          )}
        </Button>
      </div>

      <h2 className="mt-4 font-display text-headline-md text-on-surface">{user.name}</h2>
      <p className="text-body-sm text-on-surface-variant">{user.email}</p>
      {user.headline && <p className="mt-2 text-body-sm text-on-surface-variant">{user.headline}</p>}

      {user.roles.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {user.roles.map((role) => (
            <Badge key={role} variant="secondary" className="capitalize">
              {role}
            </Badge>
          ))}
        </div>
      )}

      <p className="mt-6 font-mono text-label-sm text-outline uppercase">
        Member since {formatDate(user.created_at)}
      </p>
    </Card>
  );
}

function ProfileDetailsCard({ user, setUser }: UserCardProps) {
  const [rootError, setRootError] = useState<string | null>(null);
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      headline: user.headline ?? "",
      phone: user.phone ?? "",
      bio: user.bio ?? "",
    },
  });

  const bioLength = form.watch("bio")?.length ?? 0;

  const mutation = useMutation({
    mutationFn: (values: ProfileValues) =>
      authRepository.updateProfile({
        name: values.name,
        headline: values.headline || null,
        phone: values.phone || null,
        bio: values.bio || null,
      }),
    onSuccess: (updated) => {
      setUser(updated);
      setRootError(null);
      form.reset({
        name: updated.name,
        headline: updated.headline ?? "",
        phone: updated.phone ?? "",
        bio: updated.bio ?? "",
      });
      toast.success("Profile updated");
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setRootError(error.message);
        for (const [field, messages] of Object.entries(error.errors)) {
          form.setError(field as FieldPath<ProfileValues>, { message: messages[0] });
        }
      } else {
        setRootError("Couldn't save your profile. Please try again.");
      }
    },
  });

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <UserRound className="size-4 text-primary" aria-hidden="true" />
        <h2 className="font-mono text-label-md text-on-surface uppercase">Profile details</h2>
      </div>

      <form
        noValidate
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="space-y-5"
      >
        <FormError message={rootError} />

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField label="Full name" htmlFor="profile-name" error={form.formState.errors.name?.message}>
            <Input id="profile-name" autoComplete="name" {...form.register("name")} />
          </FormField>
          <FormField label="Phone" htmlFor="profile-phone" error={form.formState.errors.phone?.message}>
            <Input
              id="profile-phone"
              type="tel"
              autoComplete="tel"
              placeholder="+92 300 0000000"
              {...form.register("phone")}
            />
          </FormField>
        </div>

        <FormField
          label="Headline"
          htmlFor="profile-headline"
          error={form.formState.errors.headline?.message}
          hint="A short line shown under your name, e.g. “Full-stack developer”."
        >
          <Input id="profile-headline" {...form.register("headline")} />
        </FormField>

        <FormField
          label="Bio"
          htmlFor="profile-bio"
          error={form.formState.errors.bio?.message}
          hint={`${bioLength}/500 characters`}
        >
          <Textarea id="profile-bio" rows={4} {...form.register("bio")} />
        </FormField>

        <div className="flex justify-end">
          <Button type="submit" disabled={!form.formState.isDirty || mutation.isPending}>
            {mutation.isPending && <Spinner className="size-4 text-on-primary" />}
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  );
}

function ChangePasswordCard() {
  const [rootError, setRootError] = useState<string | null>(null);
  const form = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { current_password: "", password: "", password_confirmation: "" },
  });

  const mutation = useMutation({
    mutationFn: (values: PasswordValues) => authRepository.changePassword(values),
    onSuccess: () => {
      setRootError(null);
      form.reset();
      toast.success("Password changed");
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setRootError(error.message);
        for (const [field, messages] of Object.entries(error.errors)) {
          form.setError(field as FieldPath<PasswordValues>, { message: messages[0] });
        }
      } else {
        setRootError("Couldn't change your password. Please try again.");
      }
    },
  });

  return (
    <Card className="p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <KeyRound className="size-4 text-primary" aria-hidden="true" />
        <h2 className="font-mono text-label-md text-on-surface uppercase">Change password</h2>
      </div>

      <form
        noValidate
        onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        className="space-y-5"
      >
        <FormError message={rootError} />

        <FormField
          label="Current password"
          htmlFor="current-password"
          error={form.formState.errors.current_password?.message}
        >
          <Input
            id="current-password"
            type="password"
            autoComplete="current-password"
            {...form.register("current_password")}
          />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          <FormField
            label="New password"
            htmlFor="new-password"
            error={form.formState.errors.password?.message}
          >
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              {...form.register("password")}
            />
          </FormField>
          <FormField
            label="Confirm new password"
            htmlFor="confirm-password"
            error={form.formState.errors.password_confirmation?.message}
          >
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              {...form.register("password_confirmation")}
            />
          </FormField>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending && <Spinner className="size-4 text-on-primary" />}
            Update password
          </Button>
        </div>
      </form>
    </Card>
  );
}
