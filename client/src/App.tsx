import { Switch, Route, Router, Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider, useTheme } from "@/components/theme-provider";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import Trips from "@/pages/trips";
import Infographics from "@/pages/infographics";
import {
  LayoutDashboard,
  Route as RouteIcon,
  Image,
  Menu,
  X,
  Sun,
  Moon,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

function TravelLifeLogo({ className = "w-7 h-7" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className={className}
      aria-label="Travel Life"
    >
      <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M8 18 C10 14, 14 12, 16 10 C18 12, 22 14, 24 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="16" cy="10" r="1.5" fill="currentColor" />
      <path
        d="M12 22 L16 16 L20 22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <line
        x1="16"
        y1="16"
        x2="16"
        y2="22"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/trips", label: "Trips", icon: RouteIcon },
  { path: "/infographics", label: "Infographics", icon: Image },
];

function Sidebar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 lg:hidden bg-background/90 backdrop-blur border rounded-xl p-2 shadow-sm"
        data-testid="button-mobile-menu"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-[220px] bg-sidebar/95 backdrop-blur-md border-r border-sidebar-border flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Brand */}
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <div className="flex items-center gap-2.5 px-5 h-14 border-b border-sidebar-border cursor-pointer hover:bg-sidebar-accent/50 transition-colors">
            <div className="text-primary">
              <TravelLifeLogo />
            </div>
            <span className="text-sm font-bold tracking-tight">Travel Life</span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => setMobileOpen(false)}
              >
                <div
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all cursor-pointer",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent/70"
                  )}
                  data-testid={`nav-${item.label.toLowerCase()}`}
                >
                  <item.icon className="w-[18px] h-[18px]" />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer with dark mode toggle */}
        <div className="px-3 py-3 border-t border-sidebar-border">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-sidebar-foreground hover:bg-sidebar-accent/70 transition-colors"
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? (
              <Sun className="w-[18px] h-[18px]" />
            ) : (
              <Moon className="w-[18px] h-[18px]" />
            )}
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          <p className="text-[9px] text-muted-foreground uppercase tracking-[0.15em] mt-2 px-3 opacity-60">
            Travel Life v2.0
          </p>
        </div>
      </aside>
    </>
  );
}

/** Pages that use sidebar layout */
function WithSidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function DashboardPage() {
  return <WithSidebar><Dashboard /></WithSidebar>;
}
function TripsPage() {
  return <WithSidebar><Trips /></WithSidebar>;
}
function InfographicsPage() {
  return <WithSidebar><Infographics /></WithSidebar>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <Toaster />
          <Router hook={useHashLocation}>
            <Switch>
              <Route path="/" component={Landing} />
              <Route path="/dashboard" component={DashboardPage} />
              <Route path="/trips" component={TripsPage} />
              <Route path="/infographics" component={InfographicsPage} />
              <Route component={NotFound} />
            </Switch>
          </Router>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
