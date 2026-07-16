import { motion } from "framer-motion";
import { Award, Compass, Download, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCertificates } from "@/hooks/use-engagement";
import { formatDate } from "@/lib/format";
import { paths } from "@/routes/paths";
import type { Certificate } from "@/types";

export default function CertificatesPage() {
  const certificatesQuery = useCertificates();
  const certificates = certificatesQuery.data ?? [];

  return (
    <div>
      <PageHeader
        eyebrow="Achievements"
        title="Certificates"
        description="Every certificate you've earned by completing a course — download them for your records or share them with the world."
      />

      <motion.section
        aria-label="Earned certificates"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
      >
        {certificatesQuery.isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <CertificateCardSkeleton key={index} />
            ))}
          </div>
        ) : certificatesQuery.isError ? (
          <ErrorState
            title="Couldn't load your certificates"
            error={certificatesQuery.error}
            onRetry={() => {
              void certificatesQuery.refetch();
            }}
          />
        ) : certificates.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No certificates yet"
            description="Finish a course to earn your first certificate. Every completed course adds a verified credential to this shelf."
            action={
              <Button variant="secondary" asChild>
                <Link to={paths.courses}>
                  <Compass aria-hidden="true" />
                  Browse courses
                </Link>
              </Button>
            }
          />
        ) : (
          <>
            <p className="mb-4 font-mono text-label-sm text-on-surface-variant uppercase">
              {certificates.length} {certificates.length === 1 ? "certificate" : "certificates"} earned
            </p>

            <ul className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {certificates.map((certificate, index) => (
                <motion.li
                  key={certificate.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.3,
                    delay: Math.min(index * 0.06, 0.4),
                    ease: "easeOut",
                  }}
                  className="h-full"
                >
                  <CertificateCard certificate={certificate} />
                </motion.li>
              ))}
            </ul>
          </>
        )}
      </motion.section>
    </div>
  );
}

function CertificateCard({ certificate }: { certificate: Certificate }) {
  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-elevated">
      {/* Brand gradient strip — premium/achievement accent */}
      <div className="h-1.5 shrink-0 bg-gradient-brand" aria-hidden="true" />

      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 transition-transform duration-200 group-hover:scale-105">
            <Award className="size-6 text-primary" aria-hidden="true" />
          </div>
          <p className="pt-1 text-right font-mono text-label-sm text-on-surface-variant uppercase">
            {certificate.certificate_number}
          </p>
        </div>

        <h3 className="mt-5 font-display text-headline-md text-on-surface">
          {certificate.course.title}
        </h3>
        <p className="mt-1.5 font-mono text-label-sm text-on-surface-variant">
          Issued {formatDate(certificate.issued_at)}
        </p>

        <div className="mt-auto flex flex-wrap items-center gap-3 pt-6">
          <Button asChild size="sm">
            <a
              href={certificate.download_url}
              download
              aria-label={`Download certificate for ${certificate.course.title}`}
            >
              <Download aria-hidden="true" />
              Download
            </a>
          </Button>
          {certificate.preview_url ? (
            <Button asChild variant="secondary" size="sm">
              <a
                href={certificate.preview_url}
                target="_blank"
                rel="noreferrer"
                aria-label={`View certificate for ${certificate.course.title} in a new tab`}
              >
                <ExternalLink aria-hidden="true" />
                View
              </a>
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/** Loading card that mirrors the final certificate card layout. */
function CertificateCardSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card">
      <Skeleton className="h-1.5 shrink-0 rounded-none" />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <Skeleton className="size-12 rounded-xl" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="mt-5 h-7 w-4/5" />
        <Skeleton className="mt-2 h-4 w-36" />
        <div className="mt-auto flex items-center gap-3 pt-6">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  );
}
