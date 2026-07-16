import { AnimatePresence, motion } from "framer-motion";
import { BookOpenText, ChevronDown, LifeBuoy, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";
import { useFaqs, useHelpArticles, useHelpCategories } from "@/hooks/use-engagement";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";
import { paths } from "@/routes/paths";

const PER_PAGE = 10;

export default function HelpCenterPage() {
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Debounce the search box into the articles query.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(draft.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [draft]);

  const categoriesQuery = useHelpCategories();
  const articlesQuery = useHelpArticles({
    page,
    per_page: PER_PAGE,
    search: search || undefined,
    category: category ?? undefined,
  });
  const faqsQuery = useFaqs();

  const articles = articlesQuery.data?.data ?? [];

  function selectCategory(slug: string | null) {
    setCategory(slug);
    setPage(1);
  }

  return (
    <div>
      <PageHeader
        eyebrow="Support"
        title="Help Center"
        description="Guides and answers from the MarkDev team."
      />

      {/* Hero search */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
        className="relative mb-6 max-w-2xl"
      >
        <Search
          className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-outline"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Search help articles…"
          aria-label="Search help articles"
          className="h-12 pl-12 text-body-md shadow-card"
        />
      </motion.div>

      {/* Category chips */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
        className="mb-8 flex flex-wrap gap-2"
      >
        <CategoryChip label="All" active={category === null} onClick={() => selectCategory(null)} />
        {categoriesQuery.isLoading &&
          Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-8 w-28 rounded-full" />
          ))}
        {(categoriesQuery.data ?? []).map((item) => (
          <CategoryChip
            key={item.id}
            label={item.name}
            count={item.articles_count}
            active={category === item.slug}
            onClick={() => selectCategory(item.slug)}
          />
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        {/* Articles */}
        <motion.section
          aria-label="Help articles"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
        >
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <BookOpenText className="size-4 text-primary" aria-hidden="true" />
              <h2 className="font-mono text-label-md text-on-surface uppercase">Articles</h2>
            </div>

            {articlesQuery.isLoading ? (
              <div className="space-y-5">
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} className="space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                ))}
              </div>
            ) : articlesQuery.isError ? (
              <ErrorState
                title="Couldn't load articles"
                error={articlesQuery.error}
                onRetry={() => {
                  void articlesQuery.refetch();
                }}
              />
            ) : articles.length === 0 ? (
              <EmptyState
                icon={LifeBuoy}
                title="No articles found"
                description={
                  search
                    ? `Nothing matches “${search}”. Try different keywords.`
                    : "Articles for this category are on their way."
                }
              />
            ) : (
              <>
                <ul
                  className={cn(
                    "divide-y divide-outline-variant/40 transition-opacity duration-200",
                    articlesQuery.isPlaceholderData && articlesQuery.isFetching && "opacity-60",
                  )}
                >
                  {articles.map((article) => (
                    <li key={article.id}>
                      <Link
                        to={paths.helpArticle(article.slug)}
                        className="group -mx-3 block rounded-xl px-3 py-4 transition-colors duration-150 hover:bg-surface-ice"
                      >
                        <h3 className="text-body-md font-semibold text-on-surface group-hover:text-primary">
                          {article.title}
                        </h3>
                        {article.excerpt && (
                          <p className="mt-1 line-clamp-2 text-body-sm text-on-surface-variant">
                            {article.excerpt}
                          </p>
                        )}
                        <p className="mt-2 flex items-center gap-2">
                          {article.category && <Badge variant="neutral">{article.category.name}</Badge>}
                          <span className="font-mono text-label-sm text-outline">
                            Updated {formatRelative(article.updated_at)}
                          </span>
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>

                {articlesQuery.data && (
                  <PaginationBar
                    meta={articlesQuery.data.meta}
                    onPageChange={setPage}
                    className="mt-6"
                  />
                )}
              </>
            )}
          </Card>
        </motion.section>

        {/* FAQs */}
        <motion.section
          aria-label="Frequently asked questions"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2, ease: "easeOut" }}
        >
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <LifeBuoy className="size-4 text-primary" aria-hidden="true" />
              <h2 className="font-mono text-label-md text-on-surface uppercase">FAQs</h2>
            </div>

            {faqsQuery.isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }, (_, index) => (
                  <Skeleton key={index} className="h-12 w-full rounded-xl" />
                ))}
              </div>
            ) : faqsQuery.isError ? (
              <p className="text-body-sm text-on-surface-variant">
                FAQs are unavailable right now.
              </p>
            ) : (faqsQuery.data ?? []).length === 0 ? (
              <p className="text-body-sm text-on-surface-variant">No FAQs published yet.</p>
            ) : (
              <ul className="divide-y divide-outline-variant/40">
                {(faqsQuery.data ?? []).map((faq) => {
                  const open = openFaq === faq.id;
                  return (
                    <li key={faq.id}>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(open ? null : faq.id)}
                        aria-expanded={open}
                        className="flex w-full items-center justify-between gap-3 py-3.5 text-left"
                      >
                        <span className="text-body-sm font-medium text-on-surface">{faq.question}</span>
                        <ChevronDown
                          className={cn(
                            "size-4 shrink-0 text-outline transition-transform duration-200",
                            open && "rotate-180 text-primary",
                          )}
                          aria-hidden="true"
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {open && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeOut" }}
                            className="overflow-hidden"
                          >
                            <p className="pb-4 text-body-sm text-on-surface-variant">{faq.answer}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </motion.section>
      </div>
    </div>
  );
}

function CategoryChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 font-mono text-label-sm uppercase transition-colors duration-150",
        active
          ? "bg-primary text-on-primary"
          : "bg-white text-on-surface-variant shadow-card hover:text-primary",
      )}
    >
      {label}
      {count != null && <span className={active ? "text-on-primary/70" : "text-outline"}>{count}</span>}
    </button>
  );
}
