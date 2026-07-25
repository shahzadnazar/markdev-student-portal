import { Outlet } from "react-router-dom";
import { BrandMark } from "./brand-mark";

/** Centered portal sign-in: brand on top, form card, no marketing panel. */
export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-ice px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <BrandMark />
        <div className="leading-tight">
          <p className="font-display text-body-lg font-bold tracking-tight text-on-surface">MarkDev</p>
          <p className="font-mono text-label-sm text-primary uppercase">Student portal</p>
        </div>
      </div>

      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card sm:p-8">
        <Outlet />
      </div>

      <p className="mt-6 text-body-sm text-on-surface-variant">
        Trouble signing in? Contact the academy front desk.
      </p>
    </div>
  );
}
