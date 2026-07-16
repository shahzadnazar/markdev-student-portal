import { motion } from "framer-motion";
import { BellRing, Globe } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useSettings, useUpdateSettings } from "@/hooks/use-engagement";
import type { NotificationPreferences, UserSettings } from "@/types";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ur", label: "اردو (Urdu)" },
];

const NOTIFICATION_ROWS: ReadonlyArray<{
  key: keyof NotificationPreferences;
  label: string;
  description: string;
}> = [
  {
    key: "email_announcements",
    label: "Announcements",
    description: "Email me when an instructor posts an announcement.",
  },
  {
    key: "email_assignment_graded",
    label: "Grades",
    description: "Email me when an assignment or quiz is graded.",
  },
  {
    key: "email_due_reminders",
    label: "Due-date reminders",
    description: "Email me before assignments and quizzes are due.",
  },
  {
    key: "email_new_content",
    label: "New content",
    description: "Email me when new lessons are added to my courses.",
  },
  {
    key: "push_announcements",
    label: "Push announcements",
    description: "Send announcements to this device as push notifications.",
  },
  {
    key: "push_due_reminders",
    label: "Push reminders",
    description: "Send due-date reminders to this device.",
  },
];

export default function SettingsPage() {
  const settingsQuery = useSettings();
  const updateSettings = useUpdateSettings();

  const settings = settingsQuery.data;

  const timezones = useMemo(() => {
    const all = Intl.supportedValuesOf("timeZone");
    const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const pinned = ["UTC", local].filter(
      (zone, index, self) => self.indexOf(zone) === index && all.includes(zone),
    );
    return { pinned, all: all.filter((zone) => !pinned.includes(zone)) };
  }, []);

  function save(patch: Partial<UserSettings>, options?: { silent?: boolean }) {
    updateSettings.mutate(patch, {
      onSuccess: () => {
        if (!options?.silent) toast.success("Settings saved");
      },
      onError: () => toast.error("Couldn't save your settings. Please try again."),
    });
  }

  return (
    <div>
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Language, timezone and how MarkDev keeps you informed."
      />

      {settingsQuery.isLoading ? (
        <div className="max-w-3xl space-y-6">
          <Card className="space-y-5 p-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </Card>
          <Card className="space-y-5 p-6">
            <Skeleton className="h-4 w-32" />
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-72 max-w-full" />
                </div>
                <Skeleton className="h-6 w-10 rounded-full" />
              </div>
            ))}
          </Card>
        </div>
      ) : settingsQuery.isError ? (
        <ErrorState
          title="Couldn't load your settings"
          error={settingsQuery.error}
          onRetry={() => {
            void settingsQuery.refetch();
          }}
        />
      ) : settings ? (
        <div className="max-w-3xl space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
          >
            <Card className="p-6">
              <div className="mb-5 flex items-center gap-2.5">
                <Globe className="size-4 text-primary" aria-hidden="true" />
                <h2 className="font-mono text-label-md text-on-surface uppercase">Preferences</h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="settings-timezone">Timezone</Label>
                  <Select
                    value={settings.timezone}
                    onValueChange={(value) => save({ timezone: value })}
                    disabled={updateSettings.isPending}
                  >
                    <SelectTrigger id="settings-timezone" aria-label="Timezone">
                      <SelectValue placeholder="Select a timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.pinned.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                      <SelectSeparator />
                      {timezones.all.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="settings-language">Language</Label>
                  <Select
                    value={settings.language}
                    onValueChange={(value) => save({ language: value })}
                    disabled={updateSettings.isPending}
                  >
                    <SelectTrigger id="settings-language" aria-label="Language">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((language) => (
                        <SelectItem key={language.value} value={language.value}>
                          {language.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
          >
            <Card className="p-6">
              <div className="mb-2 flex items-center gap-2.5">
                <BellRing className="size-4 text-primary" aria-hidden="true" />
                <h2 className="font-mono text-label-md text-on-surface uppercase">Notifications</h2>
              </div>
              <p className="mb-4 text-body-sm text-on-surface-variant">
                Choose what MarkDev is allowed to send you.
              </p>

              <div>
                {NOTIFICATION_ROWS.map((row, index) => (
                  <div key={row.key}>
                    {index > 0 && <Separator />}
                    <div className="flex items-center justify-between gap-4 py-4">
                      <div className="min-w-0">
                        <Label htmlFor={`pref-${row.key}`} className="cursor-pointer">
                          {row.label}
                        </Label>
                        <p className="mt-0.5 text-body-sm text-on-surface-variant">{row.description}</p>
                      </div>
                      <Switch
                        id={`pref-${row.key}`}
                        checked={settings.notifications[row.key]}
                        disabled={updateSettings.isPending}
                        onCheckedChange={(checked) =>
                          save(
                            { notifications: { ...settings.notifications, [row.key]: checked } },
                            { silent: true },
                          )
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      ) : null}
    </div>
  );
}
