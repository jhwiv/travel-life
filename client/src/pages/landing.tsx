import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Plane, TrainFront, Globe, MapPin, Route, Plus, ArrowRight } from "lucide-react";
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
import { getTrips, addTrip, computeAnalytics } from "@/lib/static-data";
import FlightMap from "@/components/flight-map";

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
  "United States": "\u{1F1FA}\u{1F1F8}", US: "\u{1F1FA}\u{1F1F8}", USA: "\u{1F1FA}\u{1F1F8}",
  "United Kingdom": "\u{1F1EC}\u{1F1E7}", UK: "\u{1F1EC}\u{1F1E7}", England: "\u{1F1EC}\u{1F1E7}",
  France: "\u{1F1EB}\u{1F1F7}", Germany: "\u{1F1E9}\u{1F1EA}", Italy: "\u{1F1EE}\u{1F1F9}", Spain: "\u{1F1EA}\u{1F1F8}",
  Netherlands: "\u{1F1F3}\u{1F1F1}", Belgium: "\u{1F1E7}\u{1F1EA}", Switzerland: "\u{1F1E8}\u{1F1ED}",
  Austria: "\u{1F1E6}\u{1F1F9}", Portugal: "\u{1F1F5}\u{1F1F9}", Ireland: "\u{1F1EE}\u{1F1EA}",
  Sweden: "\u{1F1F8}\u{1F1EA}", Norway: "\u{1F1F3}\u{1F1F4}", Denmark: "\u{1F1E9}\u{1F1F0}", Finland: "\u{1F1EB}\u{1F1EE}",
  Poland: "\u{1F1F5}\u{1F1F1}", "Czech Republic": "\u{1F1E8}\u{1F1FF}", Czechia: "\u{1F1E8}\u{1F1FF}",
  Greece: "\u{1F1EC}\u{1F1F7}", Turkey: "\u{1F1F9}\u{1F1F7}", Japan: "\u{1F1EF}\u{1F1F5}",
  "South Korea": "\u{1F1F0}\u{1F1F7}", China: "\u{1F1E8}\u{1F1F3}", India: "\u{1F1EE}\u{1F1F3}",
  Australia: "\u{1F1E6}\u{1F1FA}", Canada: "\u{1F1E8}\u{1F1E6}", Mexico: "\u{1F1F2}\u{1F1FD}",
  Croatia: "\u{1F1ED}\u{1F1F7}", Aruba: "\u{1F1E6}\u{1F1FC}",
};

function getFlag(country: string) {
  return countryFlags[country] || "\u{1F3F3}\u{FE0F}";
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

/** Count-up animation hook */
function useCountUp(target: number, duration: number = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return value;
}

/* HeroFlightMap replaced by shared FlightMap component */

/* ---------- Smart Train Dialog ---------- */
function AddTrainDialog({ trigger, onAdded }: { trigger: React.ReactNode; onAdded: () => void }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSubmit = (data: any) => {
    addTrip(data);
    setDialogOpen(false);
    onAdded();
    toast({ title: "Train ride added", description: "Your trip has been recorded." });
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto bg-[#0F172A] border-teal-500/15 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <TrainFront className="w-5 h-5 text-amber-400" />
            Add Train Ride
          </DialogTitle>
        </DialogHeader>
        <SmartTrainForm onSubmit={handleSubmit} isPending={false} />
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Smart Flight Dialog ---------- */
function AddFlightDialog({ trigger, onAdded }: { trigger: React.ReactNode; onAdded: () => void }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSubmit = (data: any) => {
    addTrip(data);
    setDialogOpen(false);
    onAdded();
    toast({ title: "Flight added", description: "Your flight has been recorded." });
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-[#0F172A] border-teal-500/15 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Plane className="w-5 h-5 text-teal-400" />
            Add Flight
          </DialogTitle>
        </DialogHeader>
        <SmartFlightForm onSubmit={handleSubmit} isPending={false} />
      </DialogContent>
    </Dialog>
  );
}

/** Animated stat number */
function AnimatedStat({ value, suffix }: { value: number; suffix?: string }) {
  const animated = useCountUp(value);
  return <>{animated.toLocaleString()}{suffix}</>;
}

export default function Landing() {
  const [, navigate] = useLocation();
  const [version, setVersion] = useState(0);

  const analytics = computeAnalytics() as unknown as Analytics;
  const trips = getTrips() as unknown as Trip[];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = version;

  const onAdded = () => setVersion((v) => v + 1);

  const hasData = analytics && analytics.totalTrips > 0;
  const recentTrips = trips.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col animate-page-enter" style={{ background: "linear-gradient(165deg, #0F172A 0%, #0B1929 25%, #0D2137 50%, #0F172A 75%, #091018 100%)" }}>
      {/* Hero Section */}
      <div className="relative flex-1 flex flex-col items-center px-5 pt-10 sm:pt-16 pb-6 overflow-hidden">
        <FlightMap trips={trips} variant="background" />

        {/* Gradient orbs — teal themed */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)" }} />
          <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(30,58,95,0.15) 0%, transparent 70%)" }} />
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)" }} />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.2), rgba(30,58,95,0.15))", border: "1px solid rgba(13,148,136,0.2)" }}>
              <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8 text-teal-300" aria-label="Travel Life">
                <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 18 C10 14, 14 12, 16 10 C18 12, 22 14, 24 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <circle cx="16" cy="10" r="1.5" fill="currentColor" />
                <path d="M12 22 L16 16 L20 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <line x1="16" y1="16" x2="16" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Title — large display type */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-4 font-display" style={{ background: "linear-gradient(135deg, #ffffff 0%, #99F6E4 40%, #14B8A6 60%, #0D9488 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Travel Life
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-teal-200/35 max-w-xs sm:max-w-md mx-auto mb-8 leading-relaxed px-2">
            Track every flight and train ride. Visualize your journeys.
          </p>

          {/* Hero stats — key numbers */}
          {hasData && (
            <div className="flex items-center justify-center gap-6 sm:gap-10 mb-8 px-4">
              {[
                { value: analytics.totalFlights, label: "Flights" },
                { value: Math.round(analytics.totalDistance / 1000 * 10) / 10, label: "k Miles", isDecimal: true },
                { value: analytics.uniqueCountries, label: "Countries" },
              ].map(({ value, label, isDecimal }) => (
                <div key={label} className="text-center">
                  <p className="text-3xl sm:text-4xl font-extrabold text-white tabular-nums font-display animate-count-up">
                    {isDecimal ? `${value}` : <AnimatedStat value={value} />}
                  </p>
                  <p className="text-[10px] text-teal-300/40 uppercase tracking-wider font-medium mt-1">{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Primary action buttons — gold/amber accent */}
          <div className="flex flex-row items-center justify-center gap-3 mb-8 px-4">
            <AddFlightDialog
              onAdded={onAdded}
              trigger={
                <Button size="lg" className="gap-2 px-6 text-sm font-semibold shadow-lg flex-1 sm:flex-none rounded-xl card-hover" style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", border: "none", color: "#0F172A" }}>
                  <Plus className="w-4 h-4" />
                  <Plane className="w-4 h-4" />
                  Add Flight
                </Button>
              }
            />
            <AddTrainDialog
              onAdded={onAdded}
              trigger={
                <Button size="lg" className="gap-2 px-6 text-sm font-semibold shadow-lg flex-1 sm:flex-none rounded-xl card-hover" style={{ background: "linear-gradient(135deg, #0D9488, #1E3A5F)", border: "none" }}>
                  <Plus className="w-4 h-4" />
                  <TrainFront className="w-4 h-4" />
                  Add Train
                </Button>
              }
            />
          </div>

          {/* Navigation buttons — minimal, clean */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6 px-4">
            {[
              { label: "Dashboard", icon: Route, path: "/dashboard" },
              { label: "Infographics", icon: Globe, path: "/infographics" },
              { label: "All Trips", icon: Plane, path: "/trips" },
            ].map(({ label, icon: Icon, path }) => (
              <Button
                key={label}
                variant="outline"
                size="sm"
                className="gap-1.5 px-3 sm:px-5 text-xs sm:text-sm font-semibold border-teal-400/15 text-white/60 hover:bg-teal-500/10 hover:text-white hover:border-teal-400/25 rounded-xl"
                onClick={() => navigate(path)}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {label}
              </Button>
            ))}
          </div>
        </div>

        {/* Stats section — glass cards */}
        {hasData && analytics && (
          <div className="relative z-10 w-full max-w-4xl mx-auto">
            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { icon: Route, value: analytics.totalTrips, label: "Trips", href: "/trips" },
                { icon: Plane, value: analytics.totalFlights, label: "Flights", href: "/trips?filter=flight" },
                { icon: TrainFront, value: analytics.totalTrains, label: "Train Rides", href: "/trips?filter=train" },
                { icon: Globe, value: analytics.uniqueCountries, label: "Countries", href: "/infographics" },
              ].map(({ icon: Icon, value, label, href }) => (
                <button
                  key={label}
                  onClick={() => navigate(href)}
                  className="glass-card !p-4 text-center card-hover cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2.5" style={{ background: "rgba(13,148,136,0.1)" }}>
                    <Icon className="w-5 h-5 text-teal-400" />
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-white font-display"><AnimatedStat value={value} /></p>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium mt-0.5">{label}</p>
                </button>
              ))}
            </div>

            {/* Distance + Flags row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="glass-card !p-5 flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(13,148,136,0.12)" }}>
                  <MapPin className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-white font-display">
                    {formatDistance(analytics.totalDistance)} <span className="text-sm font-normal text-white/30">miles</span>
                  </p>
                  <p className="text-xs text-white/30">
                    {formatDuration(analytics.totalDuration)} travel time · {analytics.uniqueCities} cities
                  </p>
                </div>
              </div>

              {analytics.countries.length > 0 && (
                <div className="glass-card !p-5 flex items-center gap-3">
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
              <div className="glass-card !p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] text-white/30 uppercase tracking-wider font-medium">Recent Journeys</p>
                  <button onClick={() => navigate("/trips")} className="text-[11px] text-teal-400 hover:text-teal-300 cursor-pointer font-medium">
                    View all <ArrowRight className="w-3 h-3 inline" />
                  </button>
                </div>
                <div className="space-y-2">
                  {recentTrips.map((trip) => (
                    <div key={trip.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl card-hover" style={{ background: "rgba(13,148,136,0.04)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: trip.type === "flight" ? "rgba(13,148,136,0.12)" : "rgba(245,158,11,0.12)" }}>
                          {trip.type === "flight" ? (
                            <Plane className="w-4 h-4 text-teal-400" />
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

            {/* Earth circumference comparison + extra desktop content */}
            {analytics.totalDistance > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                {/* Earth comparison */}
                <div className="glass-card !p-4 md:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🌍</span>
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Around the Earth</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${Math.min((analytics.totalDistance / 24901) * 100, 100)}%`,
                        background: "linear-gradient(90deg, #0D9488, #14B8A6, #F59E0B)",
                      }} />
                    </div>
                    <span className="text-sm font-bold text-white tabular-nums font-display">
                      {((analytics.totalDistance / 24901) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-[10px] text-white/25 mt-1">
                    {formatDistance(analytics.totalDistance)} of 24,901 miles
                  </p>
                </div>

                {/* Flights per month sparkline-like display */}
                <div className="glass-card !p-4">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">This Month</p>
                  <p className="text-3xl font-extrabold text-white tabular-nums font-display">{analytics.totalFlights}</p>
                  <p className="text-[10px] text-teal-400/60">total flights</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!hasData && (
          <div className="relative z-10 w-full max-w-md mx-auto text-center mt-auto mb-auto">
            <div className="glass-card w-full text-center">
              <Globe className="w-12 h-12 text-teal-400/30 mx-auto mb-4" />
              <p className="text-white/40 text-sm leading-relaxed">
                Add your first flight or train ride to start tracking your journeys.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer — no V3.0 */}
      <div className="px-6 py-4 mt-auto" style={{ borderTop: "1px solid rgba(13,148,136,0.08)" }}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <p className="text-[10px] text-white/15 uppercase tracking-wider">Travel Life</p>
          <p className="text-[10px] text-white/15">Grand Loop Studio</p>
        </div>
      </div>
    </div>
  );
}
