import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CornerDownRight, MessagesSquare, Reply, Send, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { ApiError } from "@/api/client";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { FormError, FormField } from "@/components/shared/form-field";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useAddComment, useLessonComments } from "@/hooks/use-catalog";
import { formatRelative, initials } from "@/lib/format";
import type { Comment } from "@/types";

const commentSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, "Write a comment before posting.")
    .max(2000, "Comments are limited to 2,000 characters."),
});

type CommentFormValues = z.infer<typeof commentSchema>;

/** Group a flat or nested comment payload into top-level threads (one reply level). */
function toThreads(comments: Comment[]): { comment: Comment; replies: Comment[] }[] {
  const repliesByParent = new Map<number, Comment[]>();
  for (const comment of comments) {
    if (comment.parent_id != null) {
      const bucket = repliesByParent.get(comment.parent_id) ?? [];
      bucket.push(comment);
      repliesByParent.set(comment.parent_id, bucket);
    }
  }
  return comments
    .filter((comment) => comment.parent_id == null)
    .map((comment) => ({
      comment,
      replies: comment.replies ?? repliesByParent.get(comment.id) ?? [],
    }));
}

interface CommentItemProps {
  comment: Comment;
  onReply?: (comment: Comment) => void;
}

function CommentItem({ comment, onReply }: CommentItemProps) {
  return (
    <article className="flex gap-3">
      <Avatar className="size-9">
        {comment.author.avatar_url ? (
          <AvatarImage src={comment.author.avatar_url} alt="" />
        ) : null}
        <AvatarFallback className="text-body-sm">{initials(comment.author.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-body-sm font-semibold text-on-surface">{comment.author.name}</span>
          <time dateTime={comment.created_at} className="font-mono text-label-sm text-outline">
            {formatRelative(comment.created_at)}
          </time>
        </div>
        <p className="mt-1 text-body-sm whitespace-pre-line text-on-surface-variant">
          {comment.body}
        </p>
        {onReply ? (
          <button
            type="button"
            onClick={() => onReply(comment)}
            className="mt-1.5 inline-flex items-center gap-1 rounded font-mono text-label-sm text-primary uppercase transition-colors duration-150 hover:text-primary-deep"
          >
            <Reply className="size-3.5" aria-hidden="true" />
            Reply
          </button>
        ) : null}
      </div>
    </article>
  );
}

function CommentsSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      {[0, 1, 2].map((row) => (
        <div key={row} className="flex gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Lesson discussion — composer with reply targeting plus the threaded list. */
export function CommentsSection({ lessonId }: { lessonId: string }) {
  const { user } = useAuth();
  const commentsQuery = useLessonComments(lessonId);
  const addComment = useAddComment(lessonId);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setFocus,
    formState: { errors, isSubmitting },
  } = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: { body: "" },
  });

  const startReply = (comment: Comment) => {
    setReplyingTo(comment);
    setFocus("body");
  };

  const onSubmit = handleSubmit(async (values) => {
    const wasReply = replyingTo != null;
    try {
      await addComment.mutateAsync({ body: values.body, parentId: replyingTo?.id });
      reset();
      setReplyingTo(null);
      toast.success(wasReply ? "Reply posted to the discussion." : "Comment posted to the discussion.");
    } catch (error) {
      if (error instanceof ApiError) {
        const bodyMessage = error.errors.body?.[0];
        if (bodyMessage) setError("body", { message: bodyMessage });
        setError("root", { message: error.message });
        toast.error(error.message);
      } else {
        setError("root", { message: "Your comment couldn't be posted. Please try again." });
        toast.error("Your comment couldn't be posted. Please try again.");
      }
    }
  });

  const threads = commentsQuery.data ? toThreads(commentsQuery.data) : [];

  return (
    <Card>
      <CardHeader>
        <p className="font-mono text-label-sm text-primary uppercase">Discussion</p>
        <CardTitle className="text-body-lg font-semibold">
          {commentsQuery.data
            ? `${commentsQuery.data.length} ${commentsQuery.data.length === 1 ? "comment" : "comments"}`
            : "Questions & notes"}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">
        <form onSubmit={(event) => void onSubmit(event)} noValidate className="flex gap-3">
          <Avatar className="mt-7 hidden size-9 sm:flex">
            {user?.avatar_url ? <AvatarImage src={user.avatar_url} alt="" /> : null}
            <AvatarFallback className="text-body-sm">{initials(user?.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 space-y-3">
            <FormError message={errors.root?.message} />

            {replyingTo ? (
              <div className="flex items-center gap-2 rounded-lg bg-secondary/10 px-3 py-1.5 text-body-sm text-secondary">
                <CornerDownRight className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="min-w-0 truncate">
                  Replying to <strong className="font-semibold">{replyingTo.author.name}</strong>
                </span>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  aria-label="Cancel reply"
                  className="ml-auto rounded p-0.5 transition-colors duration-150 hover:bg-secondary/10"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </div>
            ) : null}

            <FormField
              label={replyingTo ? `Reply to ${replyingTo.author.name}` : "Add to the discussion"}
              htmlFor="comment-body"
              error={errors.body?.message}
            >
              <Textarea
                id="comment-body"
                rows={3}
                placeholder={
                  replyingTo ? "Write your reply…" : "Ask a question or share what you've learned…"
                }
                aria-invalid={errors.body ? true : undefined}
                aria-describedby={errors.body ? "comment-body-error" : undefined}
                {...register("body")}
              />
            </FormField>

            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Spinner className="size-4 text-on-primary" aria-hidden="true" />
                    Posting…
                  </>
                ) : (
                  <>
                    <Send aria-hidden="true" />
                    {replyingTo ? "Post reply" : "Post comment"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {commentsQuery.isPending ? (
          <CommentsSkeleton />
        ) : commentsQuery.isError ? (
          <ErrorState
            error={commentsQuery.error}
            title="Comments failed to load"
            onRetry={() => {
              void commentsQuery.refetch();
            }}
            className="py-10"
          />
        ) : threads.length === 0 ? (
          <EmptyState
            icon={MessagesSquare}
            title="Start the discussion"
            description="Be the first to ask a question or share a takeaway from this lesson."
            className="py-10"
          />
        ) : (
          <ul className="space-y-6" aria-label="Comments">
            {threads.map(({ comment, replies }) => (
              <li key={comment.id}>
                <CommentItem comment={comment} onReply={startReply} />
                {replies.length > 0 ? (
                  <ul
                    className="mt-4 ml-4 space-y-4 border-l-2 border-outline-variant/50 pl-6 sm:ml-12 sm:pl-4"
                    aria-label={`Replies to ${comment.author.name}`}
                  >
                    {replies.map((reply) => (
                      <li key={reply.id}>
                        <CommentItem comment={reply} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
