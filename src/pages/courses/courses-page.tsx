import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Compass, Search, SearchX } from "lucide-react";
import { CourseCard, CourseCardSkeleton } from "@/components/shared/course-card";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PaginationBar } from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCategories, useCourses } from "@/hooks/use-catalog";
import { cn } from "@/lib/utils";
import type { CourseLevel } from "@/types";

const PER_PAGE = 12;
const SEARCH_DEBOUNCE_MS = 350;

type LevelFilter = CourseLevel | "all";
type CatalogScope = "all" | "enrolled";

const levelOptions: ReadonlyArray<{ value: LevelFilter; label: string }> = [
  { value: "all", label: "All levels" },
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export default function CoursesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [scope, setScope] = useState<CatalogScope>("all");
  const [page, setPage] = useState(1);

  // Debounce the raw search input into the query param; new searches restart at page 1.
  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [searchInput]);

  const categoriesQuery = useCategories();
  const coursesQuery = useCourses({
    page,
    per_page: PER_PAGE,
    search: search || undefined,
    category: category === "all" ? undefined : category,
    level: level === "all" ? undefined : level,
    enrolled: scope === "enrolled" ? true : undefined,
  });

  const hasRefinements = search !== "" || category !== "all" || level !== "all";
  const hasActiveFilters = hasRefinements || scope === "enrolled";

  const resetFilters = () => {
    setSearchInput("");
    setSearch("");
    setCategory("all");
    setLevel("all");
    setScope("all");
    setPage(1);
  };

  const handlePageChange = (nextPage: number) => {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const courses = coursesQuery.data?.data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Courses"
        description="Browse the full course library, filter it down to what matters, and jump back into anything you're enrolled in."
      />

      {/* Filter bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
      >
        <Card className="mb-8">
          <CardContent>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-outline"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search courses…"
                  aria-label="Search courses"
                  className="pl-9"
                />
              </div>

              <Select
                value={category}
                onValueChange={(value) => {
                  setCategory(value);
                  setPage(1);
                }}
                disabled={categoriesQuery.isLoading}
              >
                <SelectTrigger className="lg:w-52" aria-label="Filter by category">
                  <SelectValue
                    placeholder={categoriesQuery.isLoading ? "Loading categories…" : "Category"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {(categoriesQuery.data ?? []).map((cat) => (
                    <SelectItem key={cat.id} value={cat.slug}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={level}
                onValueChange={(value) => {
                  setLevel(value as LevelFilter);
                  setPage(1);
                }}
              >
                <SelectTrigger className="lg:w-44" aria-label="Filter by level">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {levelOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Tabs
                value={scope}
                onValueChange={(value) => {
                  setScope(value as CatalogScope);
                  setPage(1);
                }}
                className="shrink-0"
              >
                <TabsList aria-label="Filter by enrollment">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="enrolled">Enrolled</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {categoriesQuery.isError ? (
              <p className="mt-3 text-body-sm text-on-surface-variant" role="alert">
                Couldn't load categories.{" "}
                <button
                  type="button"
                  onClick={() => {
                    void categoriesQuery.refetch();
                  }}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Try again
                </button>
              </p>
            ) : null}
          </CardContent>
        </Card>
      </motion.div>

      {/* Results */}
      <motion.section
        aria-label="Course results"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
      >
        {coursesQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <CourseCardSkeleton key={index} />
            ))}
          </div>
        ) : coursesQuery.isError ? (
          <ErrorState
            title="Couldn't load courses"
            error={coursesQuery.error}
            onRetry={() => {
              void coursesQuery.refetch();
            }}
          />
        ) : !coursesQuery.data || coursesQuery.data.data.length === 0 ? (
          scope === "enrolled" && !hasRefinements ? (
            <EmptyState
              icon={Compass}
              title="You're not enrolled in any courses yet"
              description="Head over to the full catalog and enroll in a course — it will show up here so you can pick up where you left off."
              action={
                <Button variant="secondary" onClick={() => setScope("all")}>
                  Browse all courses
                </Button>
              }
            />
          ) : hasActiveFilters ? (
            <EmptyState
              icon={SearchX}
              title="No courses match your filters"
              description="Try a different search term or loosen the category and level filters to see more of the catalog."
              action={
                <Button variant="secondary" onClick={resetFilters}>
                  Clear filters
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={Compass}
              title="No courses published yet"
              description="The catalog is being prepared. New courses are on their way — check back soon."
            />
          )
        ) : (
          <>
            <p className="mb-4 font-mono text-label-sm text-on-surface-variant uppercase">
              {coursesQuery.data.meta.total}{" "}
              {coursesQuery.data.meta.total === 1 ? "course" : "courses"}
              {hasActiveFilters ? " found" : ""}
            </p>
            <div
              className={cn(
                "grid grid-cols-1 gap-6 transition-opacity duration-200 sm:grid-cols-2 xl:grid-cols-3",
                coursesQuery.isPlaceholderData && coursesQuery.isFetching && "opacity-60",
              )}
            >
              {courses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
            <PaginationBar
              meta={coursesQuery.data.meta}
              onPageChange={handlePageChange}
              className="mt-8"
            />
          </>
        )}
      </motion.section>
    </div>
  );
}
