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
  Scale,
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
import { initials } from "@/lib/format";
import { useAuth } from "@/context/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
      { label: "Rules & Regulations", to: paths.rules, icon: Scale },
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
  const { user } = useAuth();

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

      {/* Current student — a link to their own profile.

          The sidebar already lists Profile under Account, and the topbar
          avatar opens it too. This is the third door on purpose: the name and
          role at the foot of a sidebar reads as clickable, and on the admin
          side it now is, so leaving this one inert would be the odd one out.
          It carries no id — the profile page reads whoever is signed in. */}
      <NavLink
        to={paths.profile}
        onClick={onNavigate}
        aria-label="Your profile"
        title={collapsed ? "Your profile" : undefined}
        className={({ isActive }) =>
          cn(
            "group relative flex shrink-0 items-center border-t border-primary/10 px-6 py-4 transition-colors duration-150",
            "focus-visible:ring-4 focus-visible:ring-primary/25 focus-visible:outline-none focus-visible:ring-inset",
            collapsed ? "justify-center gap-0 px-2" : "gap-3",
            isActive ? "bg-primary/[0.06]" : "hover:bg-surface-ice",
          )
        }
      >
        {({ isActive }) => (
          <>
            {/* The same 4px bar the nav items use, so the footer reads as part
                of the same list rather than a separate thing that highlights. */}
            <span
              aria-hidden="true"
              className={cn(
                "absolute top-3 bottom-3 left-0 w-1 rounded-r-full bg-primary transition-opacity",
                isActive ? "opacity-100" : "opacity-0",
              )}
            />
            <Avatar className="size-9 shrink-0">
              <AvatarImage src={user?.avatar_url ?? undefined} alt="" />
              <AvatarFallback>{initials(user?.name)}</AvatarFallback>
            </Avatar>
            {collapsed ? null : (
              <span className="min-w-0 leading-tight">
                <span
                  className={cn(
                    "block truncate text-body-sm font-semibold",
                    isActive ? "text-primary" : "text-on-surface",
                  )}
                >
                  {user?.name}
                </span>
                {/* The account's own roles, not a hardcoded "Student" — the
                    admin sidebar shows the same field, and a label that is
                    right by assumption is wrong the day it is not. */}
                <span className="block truncate font-mono text-label-sm text-outline uppercase">
                  {user?.roles?.join(", ") || "member"}
                </span>
              </span>
            )}
          </>
        )}
      </NavLink>
    </aside>
  );
}
