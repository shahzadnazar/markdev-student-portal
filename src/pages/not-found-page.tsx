import { Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { paths } from "@/routes/paths";
import { Button } from "@/components/ui/button";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="mb-6 flex size-16 items-center justify-center rounded-2xl bg-primary/10">
        <Compass className="size-8 text-primary" aria-hidden="true" />
      </div>
      <p className="font-mono text-label-sm text-primary uppercase">Error 404</p>
      <h1 className="mt-2 font-display text-headline-lg text-on-surface">Page not found</h1>
      <p className="mt-2 max-w-md text-body-md text-on-surface-variant">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Button className="mt-8" asChild>
        <Link to={paths.dashboard}>Back to dashboard</Link>
      </Button>
    </div>
  );
}
