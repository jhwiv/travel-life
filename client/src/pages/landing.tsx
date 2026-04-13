import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Plane, TrainFront, BarChart3, Image, Globe, MapPin, Route, Sparkles, Plus, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { SmartFlightForm, type FlightFormData } from "@/components/smart-flight-form";
import { SmartTrainForm, type TrainFormData } from "@/components/smart-train-form";
import type { Trip } from "@shared/schema";

interface Analytics {
  totalTrips: number;
  totalFlights: number;
  totalTrains: number;
  totalDistance: number;
  totalDuration: number;
  uniqueCities: number;
  uniqueCountries: number;
  countries: string[];
}

const countryFlags: Record<string, string> = {
  "United States": "🇺🇸", US: "🇺🇸", USA: "🇺🇸",
  "United Kingdom": "🇬🇧", UK: "🇬🇧", England: "🇬🇧",
  France: "🇫🇷", Germany: "🇩🇪", Italy: "🇮🇹", Spain: "🇪🇸",
  Netherlands: "🇳🇱", Belgium: "🇧🇪", Switzerland: "🇨🇭",
  Austria: "🇦🇹", Portugal: "🇵🇹", Ireland: "🇮🇪",
  Sweden: "🇸🇪", Norway: "🇳🇴", Denmark: "🇩🇰", Finland: "🇫🇮",
  Poland: "🇵🇱", "Czech Republic": "🇨🇿", Czechia: "🇨🇿",
  Greece: "🇬🇷", Turkey: "🇹🇷", Japan: "🇯🇵",
  "South Korea": "🇰🇷", China: "🇨🇳", India: "🇮🇳",
  Australia: "🇦🇺", Canada: "🇨🇦", Mexico: "🇲🇽",
  Croatia: "🇭🇷", Aruba: "🇦🇼",
};

function getFlag(country: string) {
  return countryFlags[country] || "🏳️";
}

function formatDistance(miles: number) {
  if (miles >= 1000) return `${(miles / 1000).toFixed(1)}k`;
  return miles.toLocaleString();
}

function formatDuration(minutes: number) {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${minutes % 60}m`;
}

/** Animated world map SVG */
function WorldMapSVG() {
  return (
    <svg viewBox="0 0 800 400" className="absolute inset-0 w-full h-full opacity-[0.06]" aria-hidden>
      <g fill="none" stroke="rgba(139,92,246,0.4)" strokeWidth="1" strokeLinecap="round">
        <path d="M120,80 Q140,70 160,75 Q180,65 200,70 L220,80 Q240,75 250,85 L260,100 Q250,120 240,140 L230,160 Q220,170 200,175 L180,165 Q160,155 150,140 L140,120 Q130,100 120,80Z" />
        <path d="M210,200 Q220,190 230,195 L240,210 Q245,230 240,250 L235,270 Q230,280 220,285 L210,275 Q200,260 205,240 L208,220Z" />
        <path d="M370,70 Q380,65 395,68 L410,75 Q420,80 425,90 L420,105 Q415,115 405,118 L390,115 Q380,110 375,100 L370,85Z" />
        <path d="M380,140 Q390,135 400,138 L415,150 Q420,170 418,190 L410,210 Q400,225 390,230 L380,220 Q370,200 372,180 L375,160Z" />
        <path d="M440,60 Q470,50 500,55 L540,65 Q570,70 590,80 L600,95 Q595,110 580,120 L560,125 Q530,130 500,125 L470,115 Q450,105 440,90Z" />
        <path d="M580,220 Q600,215 620,220 L635,230 Q640,240 635,250 L620,255 Q600,258 585,250 L578,240 Q575,230 580,220Z" />
      </g>
      <g fill="none" strokeWidth="1" strokeDasharray="6,4">
        <path d="M180,100 Q300,30 400,85" stroke="rgba(139,92,246,0.2)" />
        <path d="M400,85 Q480,50 550,80" stroke="rgba(99,102,241,0.15)" />
        <path d="M180,100 Q350,180 400,140" stroke="rgba(6,182,212,0.15)" />
      </g>
      {[
        { x: 180, y: 100, color: "#8b5cf6" },
        { x: 400, y: 85, color: "#6366f1" },
        { x: 550, y: 80, color: "#06b6d4" },
        { x: 610, y: 235, color: "#f472b6" },
        { x: 230, y: 210, color: "#fb923c" },
        { x: 395, y: 170, color: "#a78bfa" },
      ].map((dot, i) => (
        <circle key={i} cx={dot.x} cy={dot.y} r="4" fill={dot.color} fillOpacity="0.5">
          <animate attributeName="r" values="4;6;4" dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

/* ---------- Smart Train Dialog ---------- */
function AddTrainDialog({ trigger }: { trigger: React.ReactNode }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data: TrainFormData) => {
      const res = await apiRequest("POST", "/api/trips", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      setDialogOpen(false);
      toast({ title: "Train ride added", description: "Your trip has been recorded." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrainFront className="w-5 h-5 text-amber-500" />
            Add Train Ride
          </DialogTitle>
        </DialogHeader>
        <SmartTrainForm
          onSubmit={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Smart Flight Dialog ---------- */
function AddFlightDialog({ trigger }: { trigger: React.ReactNode }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const createMutation = useMutation({
    mutationFn: async (data: FlightFormData) => {
      const res = await apiRequest("POST", "/api/trips", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trips"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics"] });
      setDialogOpen(false);
      toast({ title: "Flight added", description: "Your flight has been recorded." });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plane className="w-5 h-5 text-purple-400" />
            Add Flight
          </DialogTitle>
        </DialogHeader>
        <SmartFlightForm
          onSubmit={(data) => createMutation.mutate(data)}
          isPending={createMutation.isPending}
        />
      </DialogContent>
    </Dialog>
  );
}

export default function Landing() {
  const [, navigate] = useLocation();
  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/analytics"],
  });
  const { data: trips = [] } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const hasData = analytics && analytics.totalTrips > 0;
  const recentTrips = trips.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(165deg, #0a0a1a 0%, #1a1040 25%, #0f1628 50%, #0a1628 75%, #0a0a1a 100%)" }}>
      {/* Hero Section */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-5 py-6 sm:py-10 overflow-hidden">
        <WorldMapSVG />

        {/* Gradient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)" }} />
          <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)" }} />
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)" }} />
        </div>

        {/* Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.02]" aria-hidden>
          <defs>
            <pattern id="hero-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M80 0 L0 0 0 80" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#hero-grid)" />
        </svg>

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.2), rgba(99,102,241,0.15))", border: "1px solid rgba(139,92,246,0.2)" }}>
              <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8 text-purple-300" aria-label="Travel Life">
                <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 18 C10 14, 14 12, 16 10 C18 12, 22 14, 24 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <circle cx="16" cy="10" r="1.5" fill="currentColor" />
                <path d="M12 22 L16 16 L20 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <line x1="16" y1="16" x2="16" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight mb-4" style={{ background: "linear-gradient(135deg, #ffffff 0%, #e9d5ff 40%, #c4b5fd 60%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Travel Life
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-purple-200/40 max-w-xs sm:max-w-md mx-auto mb-8 leading-relaxed px-2">
            Track every flight and train ride. Visualize your journeys with stunning infographics.
          </p>

          {/* Primary action buttons */}
          <div className="flex flex-row items-center justify-center gap-3 mb-6 px-4">
            <AddFlightDialog
              trigger={
                <Button size="lg" className="gap-2 px-6 text-sm font-semibold shadow-lg flex-1 sm:flex-none rounded-xl" style={{ background: "linear-gradient(135deg, #7c3aed, #6366f1)", border: "none" }}>
                  <Plus className="w-4 h-4" />
                  <Plane className="w-4 h-4" />
                  Add Flight
                </Button>
              }
            />
            <AddTrainDialog
              trigger={
                <Button size="lg" className="gap-2 px-6 text-sm font-semibold shadow-lg flex-1 sm:flex-none rounded-xl" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", border: "none" }}>
                  <Plus className="w-4 h-4" />
                  <TrainFront className="w-4 h-4" />
                  Add Train
                </Button>
              }
            />
          </div>

          {/* Navigation buttons — always visible, functional */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6 px-4">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 px-3 sm:px-5 text-xs sm:text-sm font-semibold border-purple-400/20 text-white/70 hover:bg-purple-500/10 hover:text-white hover:border-purple-400/30 rounded-xl"
              onClick={() => navigate("/dashboard")}
              data-testid="nav-dashboard"
            >
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Dashboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 px-3 sm:px-5 text-xs sm:text-sm font-semibold border-purple-400/20 text-white/70 hover:bg-purple-500/10 hover:text-white hover:border-purple-400/30 rounded-xl"
              onClick={() => navigate("/infographics")}
              data-testid="nav-infographics"
            >
              <Image className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Infographics
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 px-3 sm:px-5 text-xs sm:text-sm font-semibold border-purple-400/20 text-white/70 hover:bg-purple-500/10 hover:text-white hover:border-purple-400/30 rounded-xl"
              onClick={() => navigate("/trips")}
              data-testid="nav-trips"
            >
              <Route className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              All Trips
            </Button>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-8 px-4">
            {[
              { icon: Plane, label: "Flights", color: "#8b5cf6", path: "/trips" },
              { icon: TrainFront, label: "Trains", color: "#fbbf24", path: "/trips" },
              { icon: BarChart3, label: "Analytics", color: "#06b6d4", path: "/dashboard" },
              { icon: Sparkles, label: "Infographics", color: "#c084fc", path: "/infographics" },
            ].map(({ icon: Icon, label, color, path }) => (
              <button
                key={label}
                onClick={() => navigate(path)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium text-white/60 hover:text-white/90 transition-colors cursor-pointer"
                style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.1)" }}
                data-testid={`pill-${label.toLowerCase()}`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color }} />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Stats section */}
        {hasData && analytics && (
          <div className="relative z-10 w-full max-w-4xl mx-auto">
            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { icon: Route, value: analytics.totalTrips, label: "Trips", color: "#8b5cf6", href: "/trips" },
                { icon: Plane, value: analytics.totalFlights, label: "Flights", color: "#6366f1", href: "/trips?filter=flight" },
                { icon: TrainFront, value: analytics.totalTrains, label: "Train Rides", color: "#fbbf24", href: "/trips?filter=train" },
                { icon: Globe, value: analytics.uniqueCountries, label: "Countries", color: "#c084fc", href: "/infographics" },
              ].map(({ icon: Icon, value, label, color, href }) => (
                <button
                  key={label}
                  onClick={() => navigate(href)}
                  className="relative rounded-2xl p-4 text-center backdrop-blur-md transition-all duration-200 hover:scale-[1.03] hover:brightness-125 active:scale-[0.97] cursor-pointer"
                  style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.1)" }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2.5" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <Icon className="w-5 h-5" style={{ color }} />
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-white">{value}</p>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium mt-0.5">{label}</p>
                </button>
              ))}
            </div>

            {/* Distance + Flags row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="rounded-2xl p-5 flex items-center gap-5 backdrop-blur-md" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.1)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(6,182,212,0.12)" }}>
                  <MapPin className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-white">
                    {formatDistance(analytics.totalDistance)} <span className="text-sm font-normal text-white/30">miles</span>
                  </p>
                  <p className="text-xs text-white/30">
                    {formatDuration(analytics.totalDuration)} travel time · {analytics.uniqueCities} cities
                  </p>
                </div>
              </div>

              {analytics.countries.length > 0 && (
                <div className="rounded-2xl p-5 flex items-center gap-3 backdrop-blur-md" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="flex flex-wrap gap-2">
                    {analytics.countries.map((c) => (
                      <span key={c} className="text-2xl drop-shadow-lg" title={c}>
                        {getFlag(c)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recent trips */}
            {recentTrips.length > 0 && (
              <div className="rounded-2xl p-5 backdrop-blur-md" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] text-white/30 uppercase tracking-wider font-medium">Recent Journeys</p>
                  <button onClick={() => navigate("/trips")} className="text-[11px] text-purple-400 hover:text-purple-300 cursor-pointer font-medium">
                    View all →
                  </button>
                </div>
                <div className="space-y-2">
                  {recentTrips.map((trip) => (
                    <div key={trip.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.03)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: trip.type === "flight" ? "rgba(139,92,246,0.12)" : "rgba(251,191,36,0.12)" }}>
                          {trip.type === "flight" ? (
                            <Plane className="w-4 h-4 text-purple-400" />
                          ) : (
                            <TrainFront className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{trip.departureCode} → {trip.arrivalCode}</p>
                          <p className="text-[11px] text-white/25">
                            {trip.departureCity} → {trip.arrivalCity}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-white/25 tabular-nums">
                        {new Date(trip.departureDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!hasData && (
          <div className="relative z-10 w-full max-w-md mx-auto text-center flex-1 flex items-center">
            <div className="rounded-2xl p-8 backdrop-blur-md w-full" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.1)" }}>
              <Globe className="w-12 h-12 text-purple-400/30 mx-auto mb-4" />
              <p className="text-white/40 text-sm leading-relaxed">
                Add your first flight or train ride to start tracking your journeys.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4 mt-auto" style={{ borderTop: "1px solid rgba(139,92,246,0.08)" }}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <p className="text-[10px] text-white/15 uppercase tracking-wider">Travel Life v3.0</p>
          <p className="text-[10px] text-white/15">Flights · Trains · Analytics</p>
        </div>
      </div>
    </div>
  );
}
