import { createRootRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { cn } from "@/lib/utils";
import { AuthGate } from "@/components/auth-gate";
import { useAuth } from "@/lib/auth";

const NAV = [
  { to: "/", label: "Today" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/health", label: "Health" },
  { to: "/nutrition", label: "Nutrition" },
  { to: "/money", label: "Money" },
  { to: "/time", label: "Time" },
  { to: "/goals", label: "Goals" },
  { to: "/insights", label: "Insights" },
  { to: "/history", label: "History" },
  { to: "/connections", label: "Connections" },
  { to: "/settings", label: "Settings" },
] as const;

function Wordmark() {
  return (
    <span className="shipper-theme-logo-lockup flex items-center gap-1">
      <img
        src="/logo.png"
        alt="Everything's Here"
        className="shipper-theme-logo -ml-1 h-8 w-8 md:h-9 md:w-9"
      />
      <span className="shipper-theme-wordmark hidden items-baseline gap-1.5 text-lg tracking-tight md:flex">
        <span data-logo-muted className="font-light text-foreground/70">Everything&rsquo;s</span>
        <span className="font-bold text-foreground">Here</span>
      </span>
    </span>
  );
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-all duration-200 hover:text-foreground hover:border-primary/40"
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.5 1.5M17.5 17.5L19 19M19 5l-1.5 1.5M6.5 17.5L5 19" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M21 12.8A8.5 8.5 0 1111.2 3a6.6 6.6 0 009.8 9.8z" />
        </svg>
      )}
    </button>
  );
}

function RootLayout() {
  const { profile, user, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="glass-nav sticky top-0 z-50 border-b border-border/70">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
          <Link to="/" className="shrink-0">
            <Wordmark />
          </Link>

          <nav className="hidden flex-1 items-center gap-0.5 overflow-x-auto lg:flex">
            {NAV.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="hidden max-w-44 truncate text-xs text-muted-foreground sm:block">
              {profile?.displayName || user?.email}
            </span>
            <ThemeToggle />
            <button
              type="button"
              onClick={() => void signOut()}
              className="hidden rounded-full border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
            >
              Sign out
            </button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle navigation"
              aria-expanded={open}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground lg:hidden"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M3 6h18M3 12h18M3 18h18" />}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div className="z-50 border-t border-border bg-background px-4 py-3 lg:hidden">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
              {NAV.map((item) => {
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>

      <footer className="mt-8 border-t border-border/70 py-8">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>
            Your data stays yours &mdash; encrypted, private per account, never sold and never used for targeted ads.
          </p>
          <p className="font-mono text-xs">Correlation &ne; causation &middot; not medical advice</p>
        </div>
      </footer>
    </div>
  );
}

function ProtectedRoot() {
  return <AuthGate><RootLayout /></AuthGate>;
}

export const Route = createRootRoute({ component: ProtectedRoot });
