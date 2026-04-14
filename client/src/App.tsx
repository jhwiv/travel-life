import { Switch, Route, Router, Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
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
  Home,
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

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 lg:hidden rounded-xl p-2 shadow-sm"
        style={{ background: "rgba(26,16,64,0.95)", border: "1px solid rgba(139,92,246,0.15)" }}
        data-testid="button-mobile-menu"
      >
        {mobileOpen ? <X className="w-5 h-5 text-white/80" /> : <Menu className="w-5 h-5 text-white/80" />}
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full w-[220px] flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "linear-gradient(180deg, #12082e 0%, #0e0a20 50%, #0a0a1a 100%)",
          borderRight: "1px solid rgba(139,92,246,0.1)",
        }}
      >
        {/* Brand */}
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <div className="flex items-center gap-2.5 px-5 h-14 cursor-pointer hover:bg-purple-500/5 transition-colors" style={{ borderBottom: "1px solid rgba(139,92,246,0.08)" }}>
            <div className="text-purple-400">
              <TravelLifeLogo />
            </div>
            <span className="text-sm font-bold tracking-tight text-white">Travel Life</span>
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
                      ? "bg-purple-500/15 text-purple-300"
                      : "text-white/50 hover:bg-white/5 hover:text-white/70"
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

        {/* Footer */}
        <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(139,92,246,0.08)" }}>
          <Link href="/" onClick={() => setMobileOpen(false)}>
            <div className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-[13px] font-medium text-white/40 hover:bg-white/5 hover:text-white/60 transition-colors cursor-pointer">
              <Home className="w-[18px] h-[18px]" />
              Home
            </div>
          </Link>
          <p className="text-[9px] text-white/15 uppercase tracking-[0.15em] mt-2 px-3">
            Travel Life v3.0
          </p>
        </div>
      </aside>
    </>
  );
}

/** Pages that use sidebar layout */
function WithSidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "linear-gradient(165deg, #0a0a1a 0%, #1a1040 30%, #0f1628 60%, #0a0a1a 100%)" }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <AuthProvider>
            <Toaster />
            <Router hook={useHashLocation}>
              <Switch>
                <Route path="/" component={Landing} />
                <Route path="/dashboard">
                  {() => <WithSidebar><Dashboard /></WithSidebar>}
                </Route>
                <Route path="/trips">
                  {() => <WithSidebar><Trips /></WithSidebar>}
                </Route>
                <Route path="/infographics">
                  {() => <WithSidebar><Infographics /></WithSidebar>}
                </Route>
                <Route component={NotFound} />
              </Switch>
            </Router>
          </AuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
