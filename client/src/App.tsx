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
import MapPage from "@/pages/map";
import {
  LayoutDashboard,
  Route as RouteIcon,
  Image,
  Menu,
  X,
  Home,
  Map,
  Plane,
  TrainFront,
  Plus,
  MapPin,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { getTrips, computeAnalytics } from "@/lib/static-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SmartFlightForm, type FlightFormData } from "@/components/smart-flight-form";
import { SmartTrainForm, type TrainFormData } from "@/components/smart-train-form";
import { addTrip } from "@/lib/static-data";
import { useToast } from "@/hooks/use-toast";

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
  { path: "/", label: "Home", icon: Home },
  { path: "/map", label: "Map", icon: Map },
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/trips", label: "Trips", icon: RouteIcon },
  { path: "/infographics", label: "Infographics", icon: Image },
];

function Sidebar() {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toast } = useToast();
  const [flightOpen, setFlightOpen] = useState(false);
  const [trainOpen, setTrainOpen] = useState(false);

  const analytics = computeAnalytics();
  const trips = getTrips();
  const recentFlight = trips.find((t: any) => t.type === "flight");

  const handleAddFlight = (data: FlightFormData) => {
    addTrip(data);
    setFlightOpen(false);
    toast({ title: "Flight added" });
  };

  const handleAddTrain = (data: TrainFormData) => {
    addTrip(data);
    setTrainOpen(false);
    toast({ title: "Train ride added" });
  };

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 lg:hidden rounded-xl p-2 shadow-sm"
        style={{ background: "rgba(15,23,42,0.95)", border: "1px solid rgba(13,148,136,0.15)" }}
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
          "fixed top-0 left-0 z-40 h-full w-[240px] flex flex-col transition-transform duration-200 lg:translate-x-0 lg:static",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{
          background: "linear-gradient(180deg, #0F172A 0%, #0B1120 50%, #091018 100%)",
          borderRight: "1px solid rgba(13,148,136,0.1)",
        }}
      >
        {/* Brand */}
        <Link href="/" onClick={() => setMobileOpen(false)}>
          <div className="flex items-center gap-2.5 px-5 h-14 cursor-pointer hover:bg-teal-500/5 transition-colors" style={{ borderBottom: "1px solid rgba(13,148,136,0.08)" }}>
            <div className="text-teal-400">
              <TravelLifeLogo />
            </div>
            <span className="text-sm font-bold tracking-tight text-white font-display">Travel Life</span>
          </div>
        </Link>

        {/* Mini travel summary */}
        <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(13,148,136,0.08)" }}>
          <div className="glass-card !p-3 !rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] uppercase tracking-wider text-teal-300/50 font-medium">Travel Summary</span>
              <Plane className="w-3 h-3 text-teal-400/40" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-lg font-bold text-white tabular-nums font-display">{analytics.totalFlights}</p>
                <p className="text-[9px] text-white/30">Flights</p>
              </div>
              <div>
                <p className="text-lg font-bold text-white tabular-nums font-display">
                  {analytics.totalDistance >= 1000 ? `${(analytics.totalDistance / 1000).toFixed(1)}k` : analytics.totalDistance}
                </p>
                <p className="text-[9px] text-white/30">Miles</p>
              </div>
            </div>
            {recentFlight && (
              <div className="mt-2 pt-2 flex items-center gap-1.5" style={{ borderTop: "1px solid rgba(13,148,136,0.1)" }}>
                <MapPin className="w-3 h-3 text-teal-400/50" />
                <span className="text-[10px] text-white/40 truncate">
                  {(recentFlight as any).departureCode} → {(recentFlight as any).arrivalCode}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 px-3 space-y-1">
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
                      ? "bg-teal-500/15 text-teal-300"
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

        {/* Quick-action buttons */}
        <div className="px-3 pb-3 space-y-1.5">
          <Dialog open={flightOpen} onOpenChange={setFlightOpen}>
            <DialogTrigger asChild>
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium text-amber-300/70 hover:bg-amber-500/10 hover:text-amber-300 transition-all cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
                <Plane className="w-3.5 h-3.5" />
                Add Flight
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-[#0F172A] border-teal-500/15 text-white">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-white">
                  <Plane className="w-5 h-5 text-teal-400" />
                  Add Flight
                </DialogTitle>
              </DialogHeader>
              <SmartFlightForm onSubmit={handleAddFlight} isPending={false} />
            </DialogContent>
          </Dialog>
          <Dialog open={trainOpen} onOpenChange={setTrainOpen}>
            <DialogTrigger asChild>
              <button className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[12px] font-medium text-amber-300/70 hover:bg-amber-500/10 hover:text-amber-300 transition-all cursor-pointer">
                <Plus className="w-3.5 h-3.5" />
                <TrainFront className="w-3.5 h-3.5" />
                Add Train
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-[#0F172A] border-teal-500/15 text-white">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-white">
                  <TrainFront className="w-5 h-5 text-amber-400" />
                  Add Train Ride
                </DialogTitle>
              </DialogHeader>
              <SmartTrainForm onSubmit={handleAddTrain} isPending={false} />
            </DialogContent>
          </Dialog>
        </div>

        {/* Branding footer */}
        <div className="px-3 py-3" style={{ borderTop: "1px solid rgba(13,148,136,0.08)" }}>
          <div className="flex items-center gap-2 px-3">
            <div className="w-5 h-5 rounded flex items-center justify-center bg-teal-500/10">
              <TravelLifeLogo className="w-3 h-3 text-teal-400/40" />
            </div>
            <p className="text-[8px] text-white/15 uppercase tracking-[0.15em]">
              Grand Loop Studio
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

/** Pages that use sidebar layout */
function WithSidebar({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "linear-gradient(165deg, #0F172A 0%, #0B1929 30%, #0F172A 60%, #091018 100%)" }}>
      <Sidebar />
      <main className="flex-1 overflow-y-auto animate-page-enter">
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
                <Route path="/map">
                  {() => <WithSidebar><MapPage /></WithSidebar>}
                </Route>
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
