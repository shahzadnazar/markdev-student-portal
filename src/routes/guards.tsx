import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { PageLoader } from "@/components/shared/page-loader";
import { paths } from "./paths";

/** Wraps the authenticated app: waits for session bootstrap, else → login. */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <PageLoader fullScreen />;
  }

  if (status === "guest") {
    return <Navigate to={paths.login} state={{ from: location }} replace />;
  }

  return <Outlet />;
}

/** Wraps guest-only pages (login etc.): authenticated users → dashboard. */
export function RequireGuest() {
  const { status } = useAuth();

  if (status === "loading") {
    return <PageLoader fullScreen />;
  }

  if (status === "authenticated") {
    return <Navigate to={paths.dashboard} replace />;
  }

  return <Outlet />;
}
