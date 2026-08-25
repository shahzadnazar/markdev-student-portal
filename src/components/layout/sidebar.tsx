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
  FolderOpen,
} from "lucide-react";
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
      { label: "Study materials", to: paths.materials, icon: FolderOpen },
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
}

export function Sidebar({ onNavigate, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        // Pure white, 280px, architectural 1px light-blue right border (per design doc).
        "flex h-full w-sidebar flex-col border-r border-primary/10 bg-white",
        className,
      )}
    >
      <div className="flex h-16 shrink-0 items-center px-6">
        <NavLink
          to={paths.dashboard}
          onClick={onNavigate}
          aria-label="MarkDev dashboard"
        >
          <BrandWordmark />
        </NavLink>
      </div>

      <nav
        className="scrollbar-thin flex-1 overflow-y-auto px-3 pt-2 pb-6"
        aria-label="Primary"
      >
        {sections.map((section) => (
          <div key={section.title} className="mb-6">
            <p className="mb-1.5 px-3 font-mono text-label-sm text-outline uppercase">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-body-sm font-medium transition-colors duration-150",
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
                        {item.label}
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
