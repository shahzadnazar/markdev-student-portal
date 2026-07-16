import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { ErrorState } from "@/components/shared/error-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useHelpArticle } from "@/hooks/use-engagement";
import { formatDate } from "@/lib/format";
import { paths } from "@/routes/paths";

const richTextClasses =
  "space-y-4 text-body-md text-on-surface [&_a]:text-primary [&_a]:underline [&_h2]:font-display [&_h2]:text-headline-md [&_h3]:font-display [&_h3]:text-body-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_pre]:rounded-xl [&_pre]:bg-inverse-surface [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-body-sm [&_pre]:text-inverse-on-surface [&_pre]:overflow-x-auto [&_code]:font-mono";

export default function HelpArticlePage() {
  const { slug } = useParams<{ slug: string }>();
  const articleQuery = useHelpArticle(slug ?? "");

  return (
    <div className="mx-auto max-w-3xl">
      <Button variant="ghost" size="sm" className="mb-6 -ml-2 text-on-surface-variant" asChild>
        <Link to={paths.help}>
          <ChevronLeft className="size-4" aria-hidden="true" />
          Help Center
        </Link>
      </Button>

      {articleQuery.isLoading ? (
        <Card className="space-y-4 p-6 md:p-8">
          <Skeleton className="h-5 w-24 rounded-full" />
          <Skeleton className="h-9 w-4/5" />
          <Skeleton className="h-4 w-40" />
          <Separator className="my-2" />
          <div className="space-y-3">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className={index % 3 === 2 ? "h-4 w-2/3" : "h-4 w-full"} />
            ))}
          </div>
        </Card>
      ) : articleQuery.isError ? (
        <ErrorState
          title="Couldn't load this article"
          error={articleQuery.error}
          onRetry={() => {
            void articleQuery.refetch();
          }}
        />
      ) : articleQuery.data ? (
        <motion.article
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <Card className="p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-3">
              {articleQuery.data.category && (
                <Badge variant="neutral">{articleQuery.data.category.name}</Badge>
              )}
              <span className="font-mono text-label-sm text-outline">
                Updated {formatDate(articleQuery.data.updated_at)}
              </span>
            </div>

            <h1 className="mt-4 font-display text-headline-lg text-on-surface">
              {articleQuery.data.title}
            </h1>

            <Separator className="my-6" />

            {articleQuery.data.body ? (
              <div
                className={richTextClasses}
                dangerouslySetInnerHTML={{ __html: articleQuery.data.body }}
              />
            ) : (
              <p className="text-body-md text-on-surface-variant">
                {articleQuery.data.excerpt ?? "This article has no content yet."}
              </p>
            )}
          </Card>
        </motion.article>
      ) : null}
    </div>
  );
}
