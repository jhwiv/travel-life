import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Share2, Plane, TrainFront, Globe, MapPin, Route } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Trip } from "@shared/schema";

interface Analytics {
  totalTrips: number;
  totalFlights: number;
  totalTrains: number;
  totalDistance: number;
  totalDuration: number;
  uniqueCities: number;
  uniqueCountries: number;
  uniqueAirports: number;
  uniqueAirlines: number;
  uniqueTrainOperators: number;
  countries: string[];
  tripsByYear: Record<string, number>;
  topRoutes: { route: string; count: number }[];
  flightDistance: number;
  trainDistance: number;
}

function formatDuration(minutes: number) {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

const countryFlags: Record<string, string> = {
  "United States": "🇺🇸", "US": "🇺🇸", "USA": "🇺🇸",
  "United Kingdom": "🇬🇧", "UK": "🇬🇧", "England": "🇬🇧",
  "France": "🇫🇷", "Germany": "🇩🇪", "Italy": "🇮🇹", "Spain": "🇪🇸",
  "Netherlands": "🇳🇱", "Belgium": "🇧🇪", "Switzerland": "🇨🇭",
  "Austria": "🇦🇹", "Portugal": "🇵🇹", "Ireland": "🇮🇪",
  "Sweden": "🇸🇪", "Norway": "🇳🇴", "Denmark": "🇩🇰", "Finland": "🇫🇮",
  "Poland": "🇵🇱", "Czech Republic": "🇨🇿", "Czechia": "🇨🇿",
  "Greece": "🇬🇷", "Turkey": "🇹🇷", "Japan": "🇯🇵",
  "South Korea": "🇰🇷", "China": "🇨🇳", "India": "🇮🇳",
  "Australia": "🇦🇺", "New Zealand": "🇳🇿", "Canada": "🇨🇦",
  "Mexico": "🇲🇽", "Brazil": "🇧🇷", "Argentina": "🇦🇷",
  "Colombia": "🇨🇴", "Chile": "🇨🇱", "Peru": "🇵🇪",
  "Morocco": "🇲🇦", "Egypt": "🇪🇬", "South Africa": "🇿🇦",
  "UAE": "🇦🇪", "United Arab Emirates": "🇦🇪", "Thailand": "🇹🇭",
  "Singapore": "🇸🇬", "Malaysia": "🇲🇾", "Indonesia": "🇮🇩",
  "Philippines": "🇵🇭", "Vietnam": "🇻🇳", "Taiwan": "🇹🇼",
  "Hong Kong": "🇭🇰", "Iceland": "🇮🇸", "Hungary": "🇭🇺",
  "Croatia": "🇭🇷", "Romania": "🇷🇴", "Luxembourg": "🇱🇺",
  "Monaco": "🇲🇨", "Malta": "🇲🇹", "Cyprus": "🇨🇾",
  "Dominican Republic": "🇩🇴", "Jamaica": "🇯🇲", "Costa Rica": "🇨🇷",
  "Panama": "🇵🇦", "Puerto Rico": "🇵🇷", "Bahamas": "🇧🇸",
  "Bermuda": "🇧🇲", "Aruba": "🇦🇼", "Barbados": "🇧🇧",
  "St. Martin": "🇸🇽", "Cayman Islands": "🇰🇾", "Cuba": "🇨🇺",
  "Israel": "🇮🇱", "Saudi Arabia": "🇸🇦", "Qatar": "🇶🇦",
  "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿", "Wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
};

function getFlag(country: string) {
  return countryFlags[country] || "🏳️";
}

/** SVG decorative background pattern — dots grid */
function DotPattern({ opacity = 0.08 }: { opacity?: number }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden>
      <defs>
        <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1" fill={`rgba(255,255,255,${opacity})`} />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dots)" />
    </svg>
  );
}

/** SVG decorative ring */
function DecoRing({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 120" className={`absolute pointer-events-none ${className}`} aria-hidden>
      <circle cx="60" cy="60" r="55" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="2" />
      <circle cx="60" cy="60" r="40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" />
    </svg>
  );
}

/** Glass panel used for stat summaries */
function GlassPanel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/[0.08] backdrop-blur-md border border-white/[0.12] rounded-2xl ${className}`}>
      {children}
    </div>
  );
}

/** Stat pill — compact stat with label */
function StatPill({ value, label, large }: { value: string | number; label: string; large?: boolean }) {
  return (
    <div>
      <p className={`font-bold tabular-nums leading-none ${large ? "text-4xl" : "text-2xl"}`}>{value}</p>
      <p className="text-[9px] uppercase tracking-[0.15em] opacity-50 mt-1.5">{label}</p>
    </div>
  );
}

/** Compute combined stats from filtered trips */
function computeStats(trips: Trip[], year: string) {
  const filtered = year === "all"
    ? trips.filter((t) => t.status === "completed")
    : trips.filter((t) => t.status === "completed" && t.departureDate.startsWith(year));
  const flights = filtered.filter((t) => t.type === "flight");
  const trains = filtered.filter((t) => t.type === "train");
  const totalDistance = filtered.reduce((s, t) => s + (t.distance || 0), 0);
  const flightDistance = flights.reduce((s, t) => s + (t.distance || 0), 0);
  const trainDistance = trains.reduce((s, t) => s + (t.distance || 0), 0);
  const totalDuration = filtered.reduce((s, t) => s + t.duration, 0);
  const flightDuration = flights.reduce((s, t) => s + t.duration, 0);
  const trainDuration = trains.reduce((s, t) => s + t.duration, 0);

  const countries = new Set<string>();
  const cities = new Set<string>();
  const stations = new Set<string>();
  const airlines = new Set<string>();
  const trainOps = new Set<string>();
  filtered.forEach((t) => {
    countries.add(t.departureCountry);
    countries.add(t.arrivalCountry);
    cities.add(t.departureCity);
    cities.add(t.arrivalCity);
    stations.add(t.departureCode);
    stations.add(t.arrivalCode);
    if (t.airline) airlines.add(t.airline);
    if (t.trainOperator) trainOps.add(t.trainOperator);
  });

  const routeCounts: Record<string, number> = {};
  filtered.forEach((t) => {
    const route = `${t.departureCode} → ${t.arrivalCode}`;
    routeCounts[route] = (routeCounts[route] || 0) + 1;
  });
  const topRoutes = Object.entries(routeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([route, count]) => ({ route, count }));

  const displayYear = year === "all" ? new Date().getFullYear().toString() : year;
  const yearTrips = filtered.filter((t) => t.departureDate.startsWith(displayYear));
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthCounts = monthNames.map((_, i) => {
    const m = String(i + 1).padStart(2, "0");
    return yearTrips.filter((t) => t.departureDate.substring(5, 7) === m).length;
  });

  return {
    filtered, flights, trains, totalDistance, flightDistance, trainDistance,
    totalDuration, flightDuration, trainDuration,
    countries: Array.from(countries), cities: Array.from(cities), stations,
    airlines: Array.from(airlines), trainOps: Array.from(trainOps),
    topRoutes, displayYear, monthCounts, monthNames,
  };
}

type InfographicType = "travel-passport" | "journey-stats" | "distance-breakdown" | "year-in-review" | "top-routes";

/* ─────────────────────────────────────────────────────────────────────
   1. TRAVEL PASSPORT — premium dark gradient with gold accents
   ───────────────────────────────────────────────────────────────────── */
function TravelPassport({ trips, year }: { trips: Trip[]; year: string }) {
  const s = computeStats(trips, year);

  return (
    <div
      className="relative rounded-3xl overflow-hidden text-white min-h-[560px] flex flex-col justify-between"
      style={{
        background: "linear-gradient(145deg, #0f1628 0%, #1a1040 25%, #2d1b69 50%, #1a2744 75%, #0d1117 100%)",
      }}
    >
      <DotPattern opacity={0.06} />
      <DecoRing className="w-40 h-40 -top-10 -right-10 opacity-60" />
      <DecoRing className="w-64 h-64 -bottom-20 -left-16 opacity-30" />

      {/* Gold accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #d4a853 30%, #f0d78c 50%, #d4a853 70%, transparent)" }} />

      <div className="relative z-10 p-7">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 mb-1">Travel Life</p>
            <h2 className="text-2xl font-extrabold tracking-tight leading-none" style={{ color: "#f0d78c" }}>
              MY TRAVEL PASSPORT
            </h2>
            <p className="text-[10px] tracking-[0.2em] opacity-40 mt-2 uppercase">
              Passport · Pass · Pasaporte · Reisepass
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(212,168,83,0.2), rgba(240,215,140,0.1))", border: "1px solid rgba(212,168,83,0.25)" }}>
            <Globe className="w-6 h-6" style={{ color: "#d4a853" }} />
          </div>
        </div>

        {/* Flags row */}
        {s.countries.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {s.countries.map((c) => (
              <span key={c} className="text-2xl drop-shadow-md" title={c}>{getFlag(c)}</span>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="h-px mb-6" style={{ background: "linear-gradient(90deg, transparent, rgba(212,168,83,0.3), transparent)" }} />

        {/* Primary stats */}
        <div className="grid grid-cols-2 gap-y-6 gap-x-8 mb-6">
          <StatPill value={s.flights.length} label="Flights" large />
          <StatPill value={s.trains.length} label="Train rides" large />
          <div>
            <p className="text-3xl font-bold tabular-nums leading-none">
              {Math.round(s.totalDistance).toLocaleString()}
              <span className="text-sm font-normal opacity-50 ml-1">mi</span>
            </p>
            <p className="text-[9px] uppercase tracking-[0.15em] opacity-50 mt-1.5">Total distance</p>
          </div>
          <StatPill value={formatDuration(s.totalDuration)} label="Travel time" />
        </div>

        {/* Secondary stats in glass panel */}
        <GlassPanel className="px-5 py-4">
          <div className="grid grid-cols-3 gap-4">
            <StatPill value={s.stations.size} label="Stations" />
            <StatPill value={s.airlines.length + s.trainOps.length} label="Operators" />
            <StatPill value={s.countries.length} label="Countries" />
          </div>
        </GlassPanel>
      </div>

      {/* Footer */}
      <div className="relative z-10 px-7 pb-5">
        <div className="h-px mb-4" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }} />
        <div className="flex items-center justify-between">
          <p className="text-[8px] font-mono tracking-[0.25em] opacity-30 uppercase">
            {year === "all" ? "ALL TIME" : year} · TRAVEL LIFE
          </p>
          <p className="text-[8px] font-mono tracking-[0.2em] opacity-30">
            {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   2. JOURNEY STATS — rich blue-to-indigo with neon accents
   ───────────────────────────────────────────────────────────────────── */
function JourneyStats({ trips, year }: { trips: Trip[]; year: string }) {
  const s = computeStats(trips, year);

  return (
    <div
      className="relative rounded-3xl overflow-hidden text-white min-h-[560px] flex flex-col justify-between"
      style={{
        background: "linear-gradient(155deg, #020e27 0%, #0a2463 30%, #1e3a7a 55%, #0d1f4b 80%, #05091a 100%)",
      }}
    >
      <DotPattern opacity={0.05} />
      <DecoRing className="w-48 h-48 -top-12 -right-12" />

      {/* Accent line */}
      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #38bdf8 30%, #818cf8 50%, #38bdf8 70%, transparent)" }} />

      <div className="relative z-10 p-7">
        <div className="flex items-start justify-between mb-7">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 mb-1">Travel Life</p>
            <h2 className="text-2xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-sky-300 to-indigo-300 bg-clip-text text-transparent">
              JOURNEY STATS
            </h2>
            <p className="text-[10px] tracking-[0.15em] opacity-40 mt-2 uppercase">
              {year === "all" ? "All Time" : year} · Sky & Rail
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-sky-500/10 border border-sky-400/20">
            <Route className="w-6 h-6 text-sky-300" />
          </div>
        </div>

        {/* Flight section */}
        <div className="mb-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-lg bg-sky-400/15 flex items-center justify-center">
              <Plane className="w-3.5 h-3.5 text-sky-300" />
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-sky-300/80 font-semibold">Flights</span>
          </div>
          <div className="grid grid-cols-3 gap-x-4 ml-9">
            <StatPill value={s.flights.length} label="Trips" />
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none">
                {Math.round(s.flightDistance).toLocaleString()}
                <span className="text-[10px] font-normal opacity-50 ml-0.5">mi</span>
              </p>
              <p className="text-[9px] uppercase tracking-[0.15em] opacity-50 mt-1.5">Distance</p>
            </div>
            <StatPill value={formatDuration(s.flightDuration)} label="Time" />
          </div>
          {s.airlines.length > 0 && (
            <p className="text-[10px] opacity-35 mt-2 ml-9">
              {s.airlines.slice(0, 4).join(" · ")}{s.airlines.length > 4 ? ` +${s.airlines.length - 4}` : ""}
            </p>
          )}
        </div>

        {/* Gradient divider */}
        <div className="h-px mx-2 mb-5" style={{ background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)" }} />

        {/* Train section */}
        <div className="mb-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-7 h-7 rounded-lg bg-indigo-400/15 flex items-center justify-center">
              <TrainFront className="w-3.5 h-3.5 text-indigo-300" />
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-indigo-300/80 font-semibold">Trains</span>
          </div>
          <div className="grid grid-cols-3 gap-x-4 ml-9">
            <StatPill value={s.trains.length} label="Rides" />
            <div>
              <p className="text-2xl font-bold tabular-nums leading-none">
                {Math.round(s.trainDistance).toLocaleString()}
                <span className="text-[10px] font-normal opacity-50 ml-0.5">mi</span>
              </p>
              <p className="text-[9px] uppercase tracking-[0.15em] opacity-50 mt-1.5">Distance</p>
            </div>
            <StatPill value={formatDuration(s.trainDuration)} label="Time" />
          </div>
          {s.trainOps.length > 0 && (
            <p className="text-[10px] opacity-35 mt-2 ml-9">
              {s.trainOps.slice(0, 4).join(" · ")}{s.trainOps.length > 4 ? ` +${s.trainOps.length - 4}` : ""}
            </p>
          )}
        </div>

        {/* Combined totals */}
        <GlassPanel className="px-5 py-4 mt-4">
          <div className="grid grid-cols-3 gap-4">
            <StatPill value={s.filtered.length} label="Total trips" />
            <StatPill value={s.countries.length} label="Countries" />
            <StatPill value={s.stations.size} label="Stations" />
          </div>
        </GlassPanel>
      </div>

      <div className="relative z-10 px-7 pb-5">
        <div className="h-px mb-4" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />
        <p className="text-[8px] font-mono tracking-[0.25em] opacity-30 uppercase">
          {year === "all" ? "ALL TIME" : year} · TRAVEL LIFE · JOURNEY STATS
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   3. DISTANCE BREAKDOWN — emerald-to-teal with vibrant bars
   ───────────────────────────────────────────────────────────────────── */
function DistanceBreakdown({ trips, year }: { trips: Trip[]; year: string }) {
  const s = computeStats(trips, year);
  const maxDist = Math.max(s.flightDistance, s.trainDistance, 1);
  const flightPct = (s.flightDistance / (s.totalDistance || 1)) * 100;
  const trainPct = (s.trainDistance / (s.totalDistance || 1)) * 100;

  return (
    <div
      className="relative rounded-3xl overflow-hidden text-white min-h-[560px] flex flex-col justify-between"
      style={{
        background: "linear-gradient(155deg, #021a12 0%, #064e3b 25%, #047857 45%, #0e7490 70%, #0c4a6e 100%)",
      }}
    >
      <DotPattern opacity={0.05} />
      <DecoRing className="w-56 h-56 -bottom-16 -right-16 opacity-40" />

      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #34d399 30%, #22d3ee 70%, transparent)" }} />

      <div className="relative z-10 p-7">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 mb-1">Travel Life</p>
            <h2 className="text-2xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-emerald-300 to-cyan-300 bg-clip-text text-transparent">
              DISTANCE BREAKDOWN
            </h2>
            <p className="text-[10px] tracking-[0.15em] opacity-40 mt-2 uppercase">
              {year === "all" ? "All Time" : year} · Air vs Rail
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-emerald-400/10 border border-emerald-400/20">
            <MapPin className="w-6 h-6 text-emerald-300" />
          </div>
        </div>

        {/* Flags */}
        {s.countries.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {s.countries.map((c) => (
              <span key={c} className="text-xl drop-shadow-md" title={c}>{getFlag(c)}</span>
            ))}
          </div>
        )}

        {/* Flight bar */}
        <div className="space-y-5 mb-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-400/15 flex items-center justify-center">
                  <Plane className="w-3 h-3 text-emerald-300" />
                </div>
                <span className="text-sm font-semibold">Flights</span>
                <span className="text-[10px] opacity-40 ml-1">{Math.round(flightPct)}%</span>
              </div>
              <span className="text-sm font-bold tabular-nums">{Math.round(s.flightDistance).toLocaleString()} mi</span>
            </div>
            <div className="h-4 bg-white/[0.08] rounded-full overflow-hidden border border-white/[0.06]">
              <div
                className="h-full rounded-full transition-all relative overflow-hidden"
                style={{
                  width: `${(s.flightDistance / maxDist) * 100}%`,
                  background: "linear-gradient(90deg, #34d399, #22d3ee)",
                  boxShadow: "0 0 12px rgba(52,211,153,0.3)",
                }}
              />
            </div>
            <p className="text-[10px] opacity-35 mt-1.5">
              {s.flights.length} flights · {formatDuration(s.flightDuration)}
              {s.airlines.length > 0 && ` · ${s.airlines.join(", ")}`}
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-cyan-400/15 flex items-center justify-center">
                  <TrainFront className="w-3 h-3 text-cyan-300" />
                </div>
                <span className="text-sm font-semibold">Trains</span>
                <span className="text-[10px] opacity-40 ml-1">{Math.round(trainPct)}%</span>
              </div>
              <span className="text-sm font-bold tabular-nums">{Math.round(s.trainDistance).toLocaleString()} mi</span>
            </div>
            <div className="h-4 bg-white/[0.08] rounded-full overflow-hidden border border-white/[0.06]">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(s.trainDistance / maxDist) * 100}%`,
                  background: "linear-gradient(90deg, #22d3ee, #818cf8)",
                  boxShadow: "0 0 12px rgba(34,211,238,0.3)",
                }}
              />
            </div>
            <p className="text-[10px] opacity-35 mt-1.5">
              {s.trains.length} rides · {formatDuration(s.trainDuration)}
              {s.trainOps.length > 0 && ` · ${s.trainOps.join(", ")}`}
            </p>
          </div>
        </div>

        <GlassPanel className="px-5 py-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xl font-bold tabular-nums leading-none">
                {Math.round(s.totalDistance).toLocaleString()}
                <span className="text-[10px] font-normal opacity-50 ml-0.5">mi</span>
              </p>
              <p className="text-[9px] uppercase tracking-[0.15em] opacity-50 mt-1.5">Total distance</p>
            </div>
            <StatPill value={formatDuration(s.totalDuration)} label="Total time" />
            <StatPill value={s.countries.length} label="Countries" />
          </div>
        </GlassPanel>
      </div>

      <div className="relative z-10 px-7 pb-5">
        <div className="h-px mb-4" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />
        <p className="text-[8px] font-mono tracking-[0.25em] opacity-30 uppercase">
          {year === "all" ? "ALL TIME" : year} · TRAVEL LIFE · DISTANCE
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   4. YEAR IN REVIEW — warm sunset with custom bar chart (no line chart)
   ───────────────────────────────────────────────────────────────────── */
function YearInReview({ trips, year }: { trips: Trip[]; year: string }) {
  const s = computeStats(trips, year);
  const maxMonth = Math.max(...s.monthCounts, 1);
  const yearTrips = trips.filter(t => t.status === "completed" && t.departureDate.startsWith(s.displayYear));
  const yearFlights = yearTrips.filter(t => t.type === "flight").length;
  const yearTrains = yearTrips.filter(t => t.type === "train").length;
  const yearDist = yearTrips.reduce((sum, t) => sum + (t.distance || 0), 0);
  const yearCountries = new Set(yearTrips.flatMap(t => [t.departureCountry, t.arrivalCountry])).size;
  const al = new Set(yearTrips.filter(t => t.airline).map(t => t.airline!));
  const tr = new Set(yearTrips.filter(t => t.trainOperator).map(t => t.trainOperator!));
  const allOps = [...Array.from(al), ...Array.from(tr)];

  return (
    <div
      className="relative rounded-3xl overflow-hidden text-white min-h-[560px] flex flex-col justify-between"
      style={{
        background: "linear-gradient(155deg, #1a0a00 0%, #7c2d12 20%, #c2410c 40%, #ea580c 55%, #b91c1c 75%, #7c1d7e 100%)",
      }}
    >
      <DotPattern opacity={0.04} />
      <DecoRing className="w-44 h-44 -top-10 -right-10 opacity-50" />

      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #fbbf24 30%, #fb923c 50%, #f43f5e 70%, transparent)" }} />

      <div className="relative z-10 p-7">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 mb-1">Travel Life</p>
            <h2 className="text-2xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-amber-200 to-rose-200 bg-clip-text text-transparent">
              {s.displayYear} IN REVIEW
            </h2>
            <p className="text-[10px] tracking-[0.15em] opacity-40 mt-2 uppercase">Year at a Glance</p>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-400/10 border border-amber-400/20">
            <Route className="w-6 h-6 text-amber-300" />
          </div>
        </div>

        {/* Custom bar chart — replaces line chart */}
        <div className="mb-6">
          <div className="flex items-end gap-[5px] h-24">
            {s.monthCounts.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                {count > 0 && (
                  <span className="text-[8px] font-bold tabular-nums opacity-70">{count}</span>
                )}
                <div
                  className="w-full rounded-t-md min-h-[3px] transition-all"
                  style={{
                    height: count > 0 ? `${Math.max((count / maxMonth) * 100, 12)}%` : "3px",
                    background: count > 0
                      ? "linear-gradient(180deg, rgba(251,191,36,0.9), rgba(251,146,60,0.7))"
                      : "rgba(255,255,255,0.08)",
                    boxShadow: count > 0 ? "0 0 8px rgba(251,191,36,0.25)" : "none",
                  }}
                />
                <span className="text-[8px] opacity-40 font-medium">{s.monthNames[i].charAt(0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-y-5 gap-x-4 mb-5">
          <StatPill value={yearTrips.length} label="Trips" large />
          <StatPill value={yearFlights} label="Flights" large />
          <StatPill value={yearTrains} label="Trains" large />
          <div className="col-span-2">
            <p className="text-3xl font-bold tabular-nums leading-none">
              {Math.round(yearDist).toLocaleString()}
              <span className="text-sm font-normal opacity-50 ml-1">mi</span>
            </p>
            <p className="text-[9px] uppercase tracking-[0.15em] opacity-50 mt-1.5">Distance</p>
          </div>
          <StatPill value={yearCountries} label="Countries" large />
        </div>

        {/* Operators */}
        <GlassPanel className="px-4 py-3">
          <div className="flex items-center justify-between text-xs">
            <span className="opacity-50 text-[10px] uppercase tracking-wider">Operators</span>
            <span className="font-medium text-[11px]">
              {allOps.length > 0 ? allOps.slice(0, 4).join(" · ") + (allOps.length > 4 ? ` +${allOps.length - 4}` : "") : "—"}
            </span>
          </div>
        </GlassPanel>
      </div>

      <div className="relative z-10 px-7 pb-5">
        <div className="h-px mb-4" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />
        <p className="text-[8px] font-mono tracking-[0.25em] opacity-30 uppercase">
          {s.displayYear} · TRAVEL LIFE · YEAR IN REVIEW
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────
   5. TOP ROUTES — rich coral-to-purple with numbered route cards
   ───────────────────────────────────────────────────────────────────── */
function TopRoutes({ trips, year }: { trips: Trip[]; year: string }) {
  const s = computeStats(trips, year);

  return (
    <div
      className="relative rounded-3xl overflow-hidden text-white min-h-[560px] flex flex-col justify-between"
      style={{
        background: "linear-gradient(155deg, #1a0505 0%, #7f1d1d 20%, #b91c1c 38%, #be185d 55%, #7e22ce 78%, #3b0764 100%)",
      }}
    >
      <DotPattern opacity={0.04} />
      <DecoRing className="w-36 h-36 top-32 -right-8 opacity-40" />

      <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #f87171 20%, #f472b6 50%, #c084fc 80%, transparent)" }} />

      <div className="relative z-10 p-7">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 mb-1">Travel Life</p>
            <h2 className="text-2xl font-extrabold tracking-tight leading-none bg-gradient-to-r from-rose-300 to-purple-300 bg-clip-text text-transparent">
              TOP ROUTES
            </h2>
            <p className="text-[10px] tracking-[0.15em] opacity-40 mt-2 uppercase">
              {year === "all" ? "All Time" : year} · Flights & Trains
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-rose-400/10 border border-rose-400/20">
            <MapPin className="w-6 h-6 text-rose-300" />
          </div>
        </div>

        <div className="space-y-2.5">
          {s.topRoutes.length > 0 ? (
            s.topRoutes.slice(0, 8).map((r, i) => {
              const maxCount = s.topRoutes[0].count;
              const routeParts = r.route.split(" → ");
              const dep = routeParts[0];
              const arr = routeParts[1];
              const routeTrips = s.filtered.filter((t) => t.departureCode === dep && t.arrivalCode === arr);
              const hasFlights = routeTrips.some((t) => t.type === "flight");
              const hasTrains = routeTrips.some((t) => t.type === "train");

              return (
                <div key={r.route} className="relative">
                  <div className="flex items-center gap-3 relative z-10">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold flex items-center gap-1.5">
                          {hasFlights && <Plane className="w-3 h-3 opacity-50" />}
                          {hasTrains && <TrainFront className="w-3 h-3 opacity-50" />}
                          {r.route}
                        </span>
                        <span className="text-xs font-bold tabular-nums ml-2 shrink-0 px-2 py-0.5 rounded-md" style={{ background: "rgba(255,255,255,0.1)" }}>
                          {r.count}x
                        </span>
                      </div>
                      <div className="h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(r.count / maxCount) * 100}%`,
                            background: "linear-gradient(90deg, #f87171, #c084fc)",
                            boxShadow: "0 0 8px rgba(248,113,113,0.25)",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm opacity-40 text-center py-8">No routes recorded yet</p>
          )}
        </div>

        {/* Summary footer */}
        <GlassPanel className="px-5 py-3.5 mt-5">
          <div className="grid grid-cols-3 gap-2 text-center">
            <StatPill value={s.filtered.length} label="Total trips" />
            <StatPill value={s.flights.length} label="Flights" />
            <StatPill value={s.trains.length} label="Trains" />
          </div>
        </GlassPanel>
      </div>

      <div className="relative z-10 px-7 pb-5">
        <div className="h-px mb-4" style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)" }} />
        <p className="text-[8px] font-mono tracking-[0.25em] opacity-30 uppercase">
          {year === "all" ? "ALL TIME" : year} · TRAVEL LIFE · TOP ROUTES
        </p>
      </div>
    </div>
  );
}

/* ─── MAIN PAGE ───────────────────────────────────────────────────── */
export default function Infographics() {
  const infographicRef = useRef<HTMLDivElement>(null);
  const [selectedType, setSelectedType] = useState<InfographicType>("travel-passport");
  const [selectedYear, setSelectedYear] = useState("all");
  const { toast } = useToast();

  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/analytics"],
  });

  const { data: trips = [] } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const years = Array.from(
    new Set(trips.map((t) => t.departureDate.substring(0, 4)))
  ).sort((a, b) => b.localeCompare(a));

  const captureCanvas = async () => {
    if (!infographicRef.current) return null;
    const html2canvas = (await import("html2canvas")).default;
    return html2canvas(infographicRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
    });
  };

  const handleDownload = async () => {
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;
      const link = document.createElement("a");
      link.download = `travel-life-${selectedType}-${selectedYear}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleShare = async () => {
    try {
      const canvas = await captureCanvas();
      if (!canvas) return;

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png")
      );

      if (!blob) {
        toast({ title: "Failed to generate image", variant: "destructive" });
        return;
      }

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `travel-life-${selectedType}.png`, { type: "image/png" });
        const shareData = { files: [file], title: "Travel Life Infographic" };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }

      try {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": blob }),
        ]);
        toast({ title: "Copied to clipboard", description: "Infographic image copied — paste it anywhere." });
      } catch {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link copied", description: "Page link copied to clipboard." });
      }
    } catch (err) {
      console.error("Share failed:", err);
      toast({ title: "Share cancelled", variant: "destructive" });
    }
  };

  if (!analytics) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        No data available. Add trips to generate infographics.
      </div>
    );
  }

  const infographicOptions: { value: InfographicType; label: string }[] = [
    { value: "travel-passport", label: "Travel Passport" },
    { value: "journey-stats", label: "Journey Stats" },
    { value: "distance-breakdown", label: "Distance Breakdown" },
    { value: "year-in-review", label: "Year in Review" },
    { value: "top-routes", label: "Top Routes" },
  ];

  return (
    <div className="p-5 pl-14 lg:pl-8 pr-5 lg:pr-8 space-y-5 min-h-screen pb-12">
      <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
        <div>
          <h2 className="text-lg font-bold text-foreground">Infographics</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Generate shareable travel summaries — flights & trains combined
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5"
            data-testid="button-share"
          >
            <Share2 className="w-4 h-4" /> Share
          </Button>
          <Button
            onClick={handleDownload}
            variant="outline"
            size="sm"
            className="rounded-xl gap-1.5"
            data-testid="button-download"
          >
            <Download className="w-4 h-4" /> PNG
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={selectedType}
          onValueChange={(v) => setSelectedType(v as InfographicType)}
        >
          <SelectTrigger className="w-52 rounded-xl" data-testid="select-infographic-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {infographicOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedYear} onValueChange={setSelectedYear}>
          <SelectTrigger className="w-32 rounded-xl" data-testid="select-year">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={y}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Infographic Preview */}
      <div className="flex justify-center">
        <div ref={infographicRef} className="w-full max-w-md">
          {selectedType === "travel-passport" && (
            <TravelPassport trips={trips} year={selectedYear} />
          )}
          {selectedType === "journey-stats" && (
            <JourneyStats trips={trips} year={selectedYear} />
          )}
          {selectedType === "distance-breakdown" && (
            <DistanceBreakdown trips={trips} year={selectedYear} />
          )}
          {selectedType === "year-in-review" && (
            <YearInReview trips={trips} year={selectedYear} />
          )}
          {selectedType === "top-routes" && (
            <TopRoutes trips={trips} year={selectedYear} />
          )}
        </div>
      </div>
    </div>
  );
}
