import { useEffect, useState } from "react";
import { NotebookPen, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useLessonPrivateNote, useSavePrivateNote } from "@/hooks/use-catalog";
import { formatDateTime } from "@/lib/format";

/**
 * The student's own notebook for this lesson.
 *
 * Sits beside the discussion, and the difference between the two has to be
 * obvious at a glance — one is the cohort's, one is not. Hence the plain
 * statement under the title rather than a lock icon: a student about to type
 * something candid should be able to read the rule, not infer it.
 *
 * WHO CAN READ THIS: the student, and academy administrators. Classmates and
 * instructors cannot — the API scopes every student query to the signed-in
 * user — but a super-admin has a read-only oversight page, and every time one
 * opens a note an audit row is written naming them, the student and the
 * lesson.
 *
 * That sentence used to say "nobody else, including an admin", which stopped
 * being true when the oversight page was added. The wording on screen is the
 * promise the product makes; when the promise changes, this changes with it in
 * the same commit.
 */
export function PrivateNotesCard({ lessonId }: { lessonId: string }) {
  const noteQuery = useLessonPrivateNote(lessonId);
  const saveNote = useSavePrivateNote(lessonId);

  const [draft, setDraft] = useState("");
  const [loaded, setLoaded] = useState(false);

  // Seed the box once, when the note first arrives. Syncing on every render
  // would overwrite what the student is in the middle of typing.
  useEffect(() => {
    if (!loaded && noteQuery.data) {
      setDraft(noteQuery.data.body);
      setLoaded(true);
    }
  }, [loaded, noteQuery.data]);

  const saved = noteQuery.data?.body ?? "";
  const dirty = loaded && draft !== saved;

  const save = () => {
    saveNote.mutate(draft, {
      onSuccess: () => toast.success("Notes saved."),
      onError: () => toast.error("Couldn't save your notes. Please try again."),
    });
  };

  return (
    <Card>
      <CardHeader>
        <p className="flex items-center gap-2 font-mono text-label-sm text-primary uppercase">
          <NotebookPen className="size-4" aria-hidden="true" />
          Private notes
        </p>
        <CardTitle>Just for you</CardTitle>
        <p className="text-body-sm text-on-surface-variant">
          Visible to you and academy administrators. Your classmates and instructors cannot see them.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {noteQuery.isLoading ? (
          <Skeleton className="h-32 w-full rounded-xl" />
        ) : (
          <>
            <Textarea
              id={`private-note-${lessonId}`}
              rows={6}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Anything worth remembering from this lesson…"
              aria-label="Your private notes for this lesson"
            />
            <div className="flex items-center justify-between gap-3">
              <p className="font-mono text-label-sm text-on-surface-variant">
                {dirty ? (
                  "Unsaved changes"
                ) : noteQuery.data?.updated_at ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="size-3.5 text-success" aria-hidden="true" />
                    Saved {formatDateTime(noteQuery.data.updated_at)}
                  </span>
                ) : (
                  "Not saved yet"
                )}
              </p>
              <Button size="sm" onClick={save} disabled={!dirty || saveNote.isPending}>
                {saveNote.isPending ? <Spinner className="size-4 text-on-primary" /> : null}
                Save notes
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
