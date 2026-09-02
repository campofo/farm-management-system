import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Sprout,
  LayoutDashboard,
  Wheat,
  Wallet,
  Activity,
  LineChart,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { api, setToken } from "@/lib/api";
import { useAuthed } from "@/lib/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_app")({
  ssr: false,
  component: AppLayout,
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/crops", label: "Crops", icon: Sprout },
  { to: "/activities", label: "Activities", icon: Activity },
  { to: "/expenses", label: "Expenses", icon: Wallet },
  { to: "/harvests", label: "Harvests", icon: Wheat },
  { to: "/analytics", label: "Analytics", icon: LineChart },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

function AppLayout() {
  const authed = useAuthed();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (authed === false) {
      navigate({ to: "/login" });
    }
  }, [authed, navigate]);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ full_name: string; email: string }>("/api/auth/me"),
    enabled: authed === true,
    retry: false,
  });

  if (authed !== true) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  function signOut() {
    setToken(null);
    navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b bg-sidebar px-4 py-3 md:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-md gradient-primary">
            <Sprout className="size-4 text-primary-foreground" />
          </div>
          <span className="font-display font-semibold">FarmLedger</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setOpen((o) => !o)}>
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      <div className="md:flex">
        <aside
          className={cn(
            "border-r bg-sidebar md:sticky md:top-0 md:h-screen md:w-64 md:shrink-0",
            open ? "block" : "hidden md:block",
          )}
        >
          <div className="hidden items-center gap-2 px-6 py-6 md:flex">
            <div className="grid size-9 place-items-center rounded-lg gradient-primary shadow-elegant">
              <Sprout className="size-5 text-primary-foreground" />
            </div>
            <span className="font-display text-lg font-semibold">FarmLedger</span>
          </div>
          <nav className="space-y-1 px-3 py-4">
            {NAV.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft"
                      : "text-sidebar-foreground hover:bg-sidebar-accent",
                  )}
                >
                  <n.icon className="size-4" />
                  {n.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-auto border-t px-3 py-4">
            <div className="mb-2 px-3 text-xs text-muted-foreground">
              {me?.full_name ?? me?.email ?? "Signed in"}
            </div>
            <button
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 md:px-10 md:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
