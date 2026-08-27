import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnnouncementPopup } from "@/components/announcements/announcement-popup";
import { useLiveAnnouncements } from "@/hooks/use-engagement";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

/**
 * Authenticated shell: fixed 280px sidebar (desktop), slide-in drawer
 * (mobile), sticky topbar, and a fluid main column capped at 1440px.
 */
export function AppShell() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const { data: live } = useLiveAnnouncements();

  // Close the mobile drawer on any route change.
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen bg-surface-ice">
      {/* Desktop sidebar */}
      <div className="fixed inset-y-0 left-0 z-40 hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile drawer — Radix dialog gives focus trap, Escape and aria-modal */}
      <DialogPrimitive.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden" />
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className="fixed inset-y-0 left-0 z-50 transition-transform duration-200 data-[state=closed]:-translate-x-full data-[state=open]:translate-x-0 lg:hidden"
          >
            <DialogPrimitive.Title className="sr-only">Navigation</DialogPrimitive.Title>
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-sidebar">
        <Topbar onOpenSidebar={() => setDrawerOpen(true)} />
        <main className="mx-auto w-full max-w-shell flex-1 px-4 py-6 md:px-6 md:py-8">
          <Outlet />
        </main>
      </div>

      {/* Instructor announcements arrive here, over whatever page is open. */}
      <AnnouncementPopup items={live?.popup ?? []} />
    </div>
  );
}
