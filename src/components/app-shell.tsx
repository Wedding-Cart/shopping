import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  ListChecks,
  CalendarHeart,
  Users,
  Trash2,
  Activity,
  Settings as SettingsIcon,
  Sun,
  Moon,
  LogOut,
  Sparkles,
  Menu,
  MoreVertical,
  Wallet,
} from "lucide-react";
import { type ReactNode } from "react";
import { QuickAddFab } from "./quick-add-fab";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  adminOnly?: boolean;
}

const NAV: NavItem[] = [
  { to: "/", label: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { to: "/items", label: "আইটেম", icon: ListChecks },
  { to: "/events", label: "অনুষ্ঠান", icon: CalendarHeart },
  { to: "/members", label: "সদস্য", icon: Users },
  { to: "/recycle", label: "রিসাইকেল বিন", icon: Trash2, adminOnly: true },
  { to: "/activity", label: "কার্যকলাপ", icon: Activity, adminOnly: true },
  { to: "/settings", label: "সেটিংস", icon: SettingsIcon, adminOnly: true },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { userName, isAdmin, user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const visibleNav = NAV.filter((n) => !n.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-border/60 backdrop-blur-xl bg-background/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="মেনু খুলুন">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetHeader className="p-4">
                <SheetTitle className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-lg gradient-gold">
                    <Sparkles className="h-4 w-4 text-gold-foreground" />
                  </span>
                  বিবাহ পরিকল্পনা
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-1 px-2 pb-6">
                {visibleNav.map((n) => {
                  const active = pathname === n.to;
                  const Icon = n.icon;
                  return (
                    <Link
                      key={n.to}
                      to={n.to}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${active ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                    >
                      <Icon className="h-4 w-4" />
                      {n.label}
                    </Link>
                  );
                })}
                <Link
                  to="/wedding-expenses"
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${pathname === "/wedding-expenses" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
                >
                  <Wallet className="h-4 w-4" />
                  বিয়ের খরচ
                </Link>
              </nav>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg gradient-gold shadow-soft">
              <Sparkles className="h-4 w-4 text-gold-foreground" />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">
              বিবাহ পরিকল্পনা
            </span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 md:flex">
            {visibleNav.map((n) => {
              const active = pathname === n.to;
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
                >
                  <Icon className="h-4 w-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="থিম পরিবর্তন">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="আরও মেনু">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuLabel>আরও</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/wedding-expenses" className="flex items-center">
                    <Wallet className="mr-2 h-4 w-4" />
                    বিয়ের খরচ
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2 pl-2 pr-3">
                  <span className="grid h-8 w-8 place-items-center rounded-full gradient-emerald text-xs font-semibold text-primary-foreground">
                    {(userName || user?.email || "U").slice(0, 1).toUpperCase()}
                  </span>
                  <span className="hidden text-sm sm:inline">{userName || user?.email}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="font-medium">{userName || "অতিথি"}</span>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                    {isAdmin && (
                      <span className="mt-1 inline-flex w-fit items-center rounded-full bg-gold/20 px-2 py-0.5 text-[10px] font-medium text-gold">
                        অ্যাডমিন
                      </span>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()}>
                  <LogOut className="mr-2 h-4 w-4" />
                  সাইন আউট
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>

      <QuickAddFab />

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-border/60 bg-background/90 backdrop-blur-xl md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-4 px-2 py-2">
          {visibleNav.slice(0, 4).map((n) => {
            const active = pathname === n.to;
            const Icon = n.icon;
            return (
              <Link
                key={n.to}
                to={n.to}
                className={`flex flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] transition-colors ${active ? "text-primary" : "text-muted-foreground"}`}
              >
                <Icon className="h-5 w-5" />
                {n.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
