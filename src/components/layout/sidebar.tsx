import type { LucideIcon } from "lucide-react";
import {
  Award,
  BarChart3,
  Bookmark,
  BookOpen,
  NotebookPen,
  CalendarDays,
  ClipboardList,
  CreditCard,
  FileQuestion,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  Megaphone,
  Settings,
  Trophy,
  UserRound,
} from "lucide-react";
import { PanelLeftClose } from "lucide-react";
import { NavLink } from "react-router-dom";
import { paths } from "@/routes/paths";
import { cn } from "@/lib/utils";
import { BrandWordmark } from "./brand-mark";

interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    title: "Overview",
    items: [
      {
        label: "Dashboard",
        to: paths.dashboard,
        icon: LayoutDashboard,
        end: true,
      },
      { label: "Courses", to: paths.courses, icon: BookOpen },
      { label: "Calendar", to: paths.calendar, icon: CalendarDays },
    ],
  },
  {
    title: "Learning",
    items: [
      { label: "Assignments", to: paths.assignments, icon: ClipboardList },
      { label: "Quizzes", to: paths.quizzes, icon: FileQuestion },
      {
        label: "Notes",
        to: paths.notes,
        icon: NotebookPen,
      },
      { label: "Progress", to: paths.progress, icon: BarChart3 },
      { label: "Attendance", to: paths.attendance, icon: ListChecks },
      { label: "Certificates", to: paths.certificates, icon: Award },
    ],
  },
  {
    title: "Community",
    items: [
      { label: "Leaderboard", to: paths.leaderboard, icon: Trophy },
      { label: "Announcements", to: paths.announcements, icon: Megaphone },
      { label: "Bookmarks", to: paths.bookmarks, icon: Bookmark },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Payments", to: paths.payments, icon: CreditCard },
      { label: "Profile", to: paths.profile, icon: UserRound },
      { label: "Settings", to: paths.settings, icon: Settings },
      { label: "Help Center", to: paths.help, icon: HelpCircle },
    ],
  },
];

interface SidebarProps {
  /** Called after a nav item is chosen (used to close the mobile drawer). */
  onNavigate?: () => void;
  className?: string;
  /** Narrow to icons only. Desktop shell state; the drawer never collapses. */
  collapsed?: boolean;
  /** Omitted for the drawer, which has no collapse control. */
  onToggleCollapse?: () => void;
}

export function Sidebar({ onNavigate, className, collapsed = false, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className={cn(
        // Pure white, architectural 1px light-blue right border (per design doc).
        "flex h-full flex-col border-r border-primary/10 bg-white transition-[width] duration-200",
        collapsed ? "w-[76px]" : "w-sidebar",
        className,
      )}
    >
      <div className={cn("flex h-16 shrink-0 items-center", collapsed ? "justify-center px-2" : "px-6")}>
        {collapsed ? null : (
          <NavLink to={paths.dashboard} onClick={onNavigate} aria-label="MarkDev dashboard">
            <BrandWordmark />
          </NavLink>
        )}

        {/* Sits on the panel it controls. Desktop only — the mobile drawer
            slides away instead of collapsing. */}
        {onToggleCollapse ? (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "shrink-0 rounded-lg p-2 text-outline transition hover:bg-surface-ice hover:text-primary",
              collapsed ? "" : "ml-auto",
            )}
          >
            <PanelLeftClose
              className={cn("size-[18px] transition-transform duration-200", collapsed && "rotate-180")}
              aria-hidden="true"
            />
          </button>
        ) : null}
      </div>

      <nav
        className="scrollbar-thin flex-1 overflow-y-auto px-3 pt-2 pb-6"
        aria-label="Primary"
      >
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            {collapsed ? (
              <div className="mx-3 mb-1.5 h-px bg-outline-variant/50" aria-hidden="true" />
            ) : (
              <p className="mb-1.5 px-3 font-mono text-label-sm text-outline uppercase">
                {section.title}
              </p>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-body-sm font-medium transition-colors duration-150",
                        collapsed && "justify-center",
                        isActive
                          ? "bg-primary/[0.06] text-primary"
                          : "text-on-surface-variant hover:bg-surface-ice hover:text-on-surface",
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {/* Active state: 4px bar on the left edge, per design doc. */}
                        <span
                          aria-hidden="true"
                          className={cn(
                            "absolute top-1.5 bottom-1.5 -left-3 w-1 rounded-r-full bg-primary transition-opacity",
                            isActive ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <item.icon
                          className={cn(
                            "size-[18px] shrink-0 transition-colors",
                            isActive
                              ? "text-primary"
                              : "text-outline group-hover:text-on-surface-variant",
                          )}
                          aria-hidden="true"
                        />
                        {collapsed ? (
                          <span className="sr-only">{item.label}</span>
                        ) : (
                          item.label
                        )}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
