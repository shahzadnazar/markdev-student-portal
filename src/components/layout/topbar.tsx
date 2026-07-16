import { Bell, LogOut, Menu, Search, Settings, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { useNotificationCounts } from "@/hooks/use-engagement";
import { initials } from "@/lib/format";
import { paths } from "@/routes/paths";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

interface TopbarProps {
  onOpenSidebar: () => void;
}

export function Topbar({ onOpenSidebar }: TopbarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { data: counts } = useNotificationCounts();
  const [query, setQuery] = useState("");

  const unread = counts?.unread ?? 0;

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    if (q.length === 0) return;
    navigate(`${paths.search}?q=${encodeURIComponent(q)}`);
    setQuery("");
  }

  async function handleLogout() {
    await logout();
    navigate(paths.login, { replace: true });
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-primary/10 bg-white/80 px-4 backdrop-blur-md md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
      >
        <Menu className="size-5" aria-hidden="true" />
      </Button>

      <form onSubmit={submitSearch} role="search" className="relative hidden max-w-md flex-1 sm:block">
        <Search
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-outline"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search courses, lessons, quizzes…"
          aria-label="Search"
          className="bg-surface-ice/60 pl-9"
        />
      </form>

      <div className="ml-auto flex items-center gap-1.5">
        <Button variant="ghost" size="icon" className="sm:hidden" asChild>
          <Link to={paths.search} aria-label="Search">
            <Search className="size-5" aria-hidden="true" />
          </Link>
        </Button>

        <Button variant="ghost" size="icon" className="relative" asChild>
          <Link to={paths.notifications} aria-label={`Notifications${unread > 0 ? ` (${unread} unread)` : ""}`}>
            <Bell className="size-5" aria-hidden="true" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 flex min-w-4 items-center justify-center rounded-full bg-error px-1 font-mono text-[10px] leading-4 font-semibold text-on-error">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </Link>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-1 flex items-center gap-2 rounded-full transition-opacity hover:opacity-85"
              aria-label="Account menu"
            >
              <Avatar className="size-9">
                <AvatarImage src={user?.avatar_url ?? undefined} alt="" />
                <AvatarFallback>{initials(user?.name)}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="truncate text-body-sm font-semibold text-on-surface">{user?.name}</p>
              <p className="truncate text-label-sm font-normal text-on-surface-variant">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => navigate(paths.profile)}>
              <UserRound className="size-4" aria-hidden="true" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => navigate(paths.settings)}>
              <Settings className="size-4" aria-hidden="true" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void handleLogout()}>
              <LogOut className="size-4" aria-hidden="true" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
