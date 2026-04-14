import { useRef, useState, useMemo } from "react";
import { Download, Share2, Plane, TrainFront, Globe, MapPin, Route } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getTrips as getLocalTrips } from "@/lib/static-data";
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

/** Access helpers — handle both camelCase (API) and snake_case (localStorage) property names */
function $dep(t: any): string { return t.departureDate || t.departure_date || ""; }
function $depCity(t: any): string { return t.departureCity || t.departure_city || ""; }
function $depCode(t: any): string { return t.departureCode || t.departure_code || ""; }
function $depCountry(t: any): string { return t.departureCountry || t.departure_country || ""; }
function $arrCity(t: any): string { return t.arrivalCity || t.arrival_city || ""; }
function $arrCode(t: any): string { return t.arrivalCode || t.arrival_code || ""; }
function $arrCountry(t: any): string { return t.arrivalCountry || t.arrival_country || ""; }
function $trainOp(t: any): string | null { return t.trainOperator || t.train_operator || null; }

/** Compute combined stats from filtered trips */
function computeStats(trips: Trip[], year: string) {
  const filtered = year === "all"
    ? trips.filter((t) => t.status === "completed")
    : trips.filter((t) => t.status === "completed" && $dep(t).startsWith(year));
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
    countries.add($depCountry(t));
    countries.add($arrCountry(t));
    cities.add($depCity(t));
    cities.add($arrCity(t));
    stations.add($depCode(t));
    stations.add($arrCode(t));
    if (t.airline) airlines.add(t.airline);
    const op = $trainOp(t);
    if (op) trainOps.add(op);
  });

  const routeCounts: Record<string, number> = {};
  filtered.forEach((t) => {
    const route = `${$depCode(t)} → ${$arrCode(t)}`;
    routeCounts[route] = (routeCounts[route] || 0) + 1;
  });
  const topRoutes = Object.entries(routeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([route, count]) => ({ route, count }));

  const displayYear = year === "all" ? new Date().getFullYear().toString() : year;
  const yearTrips = filtered.filter((t) => $dep(t).startsWith(displayYear));
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthCounts = monthNames.map((_, i) => {
    const m = String(i + 1).padStart(2, "0");
    return yearTrips.filter((t) => $dep(t).substring(5, 7) === m).length;
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
   1. TRAVEL PASSPORT — Flighty-style premium dark passport
   ───────────────────────────────────────────────────────────────────── */
function PassportWorldMap({ trips }: { trips: Trip[] }) {
  return (
    <div className="relative w-full overflow-hidden" style={{ background: "linear-gradient(180deg, #1a1040 0%, #1e1450 100%)" }}>
      <svg viewBox="0 0 800 340" className="w-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="pp-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0 L0 0 0 40" fill="none" stroke="rgba(139,92,246,0.08)" strokeWidth="0.5" />
          </pattern>
          <linearGradient id="pp-arc" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <rect width="800" height="340" fill="url(#pp-grid)" />
        <g fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="1" strokeLinecap="round">
          <path d="M100,65 Q125,55 155,58 Q175,50 200,55 L225,65 Q245,58 260,70 L275,88 Q265,110 255,130 L240,150 Q225,162 200,165 L175,155 Q155,145 145,130 L130,108 Q118,88 100,65Z" />
          <path d="M200,190 Q215,178 228,185 L240,200 Q248,225 242,248 L236,270 Q228,282 218,288 L205,278 Q195,258 200,238Z" />
          <path d="M375,55 Q388,48 405,52 L422,60 Q435,66 440,78 L434,95 Q428,108 415,112 L398,108 Q385,102 378,90 L375,72Z" />
          <path d="M385,132 Q398,125 410,130 L428,145 Q435,168 432,192 L422,215 Q410,232 398,238 L385,226 Q374,205 377,180Z" />
          <path d="M450,48 Q485,38 520,42 L565,55 Q600,62 622,75 L632,92 Q626,108 608,118 L585,124 Q548,130 515,122 L480,112 Q458,100 450,80Z" />
          <path d="M600,215 Q622,208 645,215 L662,228 Q668,240 662,252 L645,258 Q620,262 604,252 L596,240 Q592,228 600,215Z" />
        </g>
        <g fill="none" strokeWidth="1.2">
          <path d="M185,88 Q290,20 405,62" stroke="url(#pp-arc)" strokeDasharray="5,4" />
          <path d="M185,88 Q350,50 520,55" stroke="url(#pp-arc)" strokeDasharray="5,4" />
          <path d="M185,88 Q290,160 398,145" stroke="rgba(139,92,246,0.2)" strokeDasharray="5,4" />
          <path d="M185,88 Q150,140 215,195" stroke="rgba(6,182,212,0.2)" strokeDasharray="5,4" />
        </g>
        {[
          { x: 185, y: 88, r: 5, color: "#8b5cf6", label: "EWR" },
          { x: 405, y: 62, r: 3.5, color: "#6366f1" },
          { x: 520, y: 55, r: 3, color: "#06b6d4" },
          { x: 398, y: 145, r: 3, color: "#a78bfa" },
          { x: 215, y: 195, r: 3, color: "#22d3ee" },
          { x: 630, y: 232, r: 2.5, color: "#f472b6" },
          { x: 155, y: 115, r: 3, color: "#34d399" },
        ].map((dot, i) => (
          <g key={i}>
            <circle cx={dot.x} cy={dot.y} r={dot.r * 2.5} fill={dot.color} fillOpacity="0.1">
              <animate attributeName="r" values={`${dot.r * 2.5};${dot.r * 3.5};${dot.r * 2.5}`} dur={`${3 + i * 0.4}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={dot.x} cy={dot.y} r={dot.r} fill={dot.color} fillOpacity="0.8" />
          </g>
        ))}
        <text x="185" y="78" fill="rgba(139,92,246,0.6)" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">EWR</text>
      </svg>
      <div className="absolute top-3 left-4 flex items-center gap-1.5 text-[10px] font-mono text-purple-300/50 tracking-wider">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400/60" />
        FLIGHT MAP
      </div>
    </div>
  );
}

function TravelPassport({ trips, year }: { trips: Trip[]; year: string }) {
  const s = computeStats(trips, year);
  const dur = formatDuration(s.totalDuration);
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "2-digit" }).toUpperCase().replace(/[\s,]+/g, "");
  const mrzPad = (str: string, len: number) => (str + "<".repeat(len)).substring(0, len);

  return (
    <div
      className="relative overflow-hidden text-white flex flex-col"
      style={{
        background: "linear-gradient(180deg, #1a1040 0%, #1e1450 30%, #2d1b69 60%, #1e1450 100%)",
      }}
    >
      {/* World Map Section */}
      <PassportWorldMap trips={s.filtered} />

      {/* Country Flags Row */}
      {s.countries.length > 0 && (
        <div className="flex items-center justify-center gap-3 px-6 py-4" style={{ borderBottom: "1px solid rgba(139,92,246,0.12)" }}>
          {s.countries.map((c) => (
            <div key={c} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/5 border border-white/10">
              <span className="text-lg leading-none">{getFlag(c)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Title Section */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold tracking-tight text-white leading-none">
              MY TRAVEL PASSPORT
            </h2>
            <p className="text-[10px] tracking-[0.2em] text-white/35 mt-1.5 uppercase">
              Passport · Pass · Pasaporte
            </p>
          </div>
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-purple-500/15 border border-purple-400/20">
            <Globe className="w-5 h-5 text-purple-300" />
          </div>
        </div>
      </div>

      {/* Stats — 2-col row */}
      <div className="px-6 pb-4">
        <div className="grid grid-cols-2 gap-6 mb-5">
          <div>
            <p className="text-[10px] text-purple-300/50 uppercase tracking-wider font-medium mb-1">Flights</p>
            <p className="text-5xl font-extrabold text-white tabular-nums leading-none">{s.flights.length}</p>
          </div>
          <div>
            <p className="text-[10px] text-purple-300/50 uppercase tracking-wider font-medium mb-1">Flight Distance</p>
            <p className="text-4xl font-extrabold text-white tabular-nums leading-none">
              {Math.round(s.flightDistance).toLocaleString()}
              <span className="text-lg font-semibold text-purple-300/60 ml-1">mi</span>
            </p>
          </div>
        </div>

        {/* Stats — 2-col row */}
        <div className="grid grid-cols-2 gap-6 mb-5">
          <div>
            <p className="text-[10px] text-purple-300/50 uppercase tracking-wider font-medium mb-1">Train Rides</p>
            <p className="text-5xl font-extrabold text-white tabular-nums leading-none">{s.trains.length}</p>
          </div>
          <div>
            <p className="text-[10px] text-purple-300/50 uppercase tracking-wider font-medium mb-1">Total Distance</p>
            <p className="text-4xl font-extrabold text-white tabular-nums leading-none">
              {Math.round(s.totalDistance).toLocaleString()}
              <span className="text-lg font-semibold text-purple-300/60 ml-1">mi</span>
            </p>
          </div>
        </div>

        {/* Stats — 3-col row */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] text-purple-300/50 uppercase tracking-wider font-medium mb-1">Travel Time</p>
            <p className="text-2xl font-extrabold text-white tabular-nums leading-none">
              {dur}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-purple-300/50 uppercase tracking-wider font-medium mb-1">Airports</p>
            <p className="text-2xl font-extrabold text-white tabular-nums leading-none">{s.stations.size}</p>
          </div>
          <div>
            <p className="text-[10px] text-purple-300/50 uppercase tracking-wider font-medium mb-1">Countries</p>
            <p className="text-2xl font-extrabold text-white tabular-nums leading-none">{s.countries.length}</p>
          </div>
        </div>
      </div>

      {/* MRZ Footer */}
      <div className="mt-auto px-6 pt-4 pb-5" style={{ borderTop: "1px solid rgba(139,92,246,0.12)" }}>
        <div className="font-mono text-[9px] text-white/25 leading-relaxed tracking-[0.15em] overflow-hidden">
          <p>{mrzPad(`ALLTIME<<<MEMBER${dateStr}<<TRAVELLIFE`, 44)}</p>
          <p>{mrzPad(`ISSUED${dateStr}EWR<<<TRAVELLIFE<<<GRANDLOOPSTUDIO.COM`, 44)}</p>
        </div>
        <div className="mt-3 h-[2px] rounded-full" style={{ background: "linear-gradient(90deg, #8b5cf6, #6366f1, #8b5cf6)" }} />
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
  const yearTrips = trips.filter(t => t.status === "completed" && $dep(t).startsWith(s.displayYear));
  const yearFlights = yearTrips.filter(t => t.type === "flight").length;
  const yearTrains = yearTrips.filter(t => t.type === "train").length;
  const yearDist = yearTrips.reduce((sum, t) => sum + (t.distance || 0), 0);
  const yearCountries = new Set(yearTrips.flatMap(t => [$depCountry(t), $arrCountry(t)])).size;
  const al = new Set(yearTrips.filter(t => t.airline).map(t => t.airline!));
  const tr = new Set(yearTrips.filter(t => $trainOp(t)).map(t => $trainOp(t)!));
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
              const routeTrips = s.filtered.filter((t) => $depCode(t) === dep && $arrCode(t) === arr);
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

  const trips = useMemo(() => {
    return getLocalTrips() as unknown as Trip[];
  }, []);

  const years = Array.from(
    new Set(trips.map((t) => (t.departureDate || (t as any).departure_date || "").substring(0, 4)).filter(Boolean))
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

  const infographicOptions: { value: InfographicType; label: string }[] = [
    { value: "travel-passport", label: "Passport" },
    { value: "journey-stats", label: "Journey" },
    { value: "distance-breakdown", label: "Distance" },
    { value: "year-in-review", label: "Year" },
    { value: "top-routes", label: "Routes" },
  ];

  return (
    <div className="min-h-screen pb-12">
      {/* Compact header */}
      <div className="relative overflow-hidden px-5 pl-14 lg:pl-8 pr-5 lg:pr-8 pt-4 pb-5" style={{ background: "linear-gradient(135deg, #1a1040 0%, #2d1b69 50%, #1a2744 100%)" }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-48 h-48 rounded-full" style={{ background: "radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)" }} />
        </div>
        <div className="relative z-10">
          {/* Title row with action icons */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Infographics</h2>
              <p className="text-[11px] text-white/40 mt-0.5">Shareable travel summaries</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleShare}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all"
                title="Share"
                data-testid="button-share"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownload}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.08] transition-all"
                title="Download PNG"
                data-testid="button-download"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Infographic type — segmented pill control */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/[0.06] border border-white/[0.06] overflow-x-auto no-scrollbar" data-testid="select-infographic-type">
            {infographicOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSelectedType(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold tracking-wide whitespace-nowrap transition-all ${
                  selectedType === opt.value
                    ? "bg-purple-500/25 text-purple-200 shadow-sm shadow-purple-500/10"
                    : "text-white/35 hover:text-white/60 hover:bg-white/[0.04]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Year filter — inline pills */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar" data-testid="select-year">
            <button
              onClick={() => setSelectedYear("all")}
              className={`px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider uppercase whitespace-nowrap transition-all ${
                selectedYear === "all"
                  ? "bg-white/[0.12] text-white/80"
                  : "text-white/30 hover:text-white/50"
              }`}
            >
              All Time
            </button>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-3 py-1 rounded-full text-[10px] font-semibold tracking-wider whitespace-nowrap transition-all ${
                  selectedYear === y
                    ? "bg-white/[0.12] text-white/80"
                    : "text-white/30 hover:text-white/50"
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Infographic Preview */}
      <div className="flex justify-center px-4 pl-14 lg:pl-6 pr-4 lg:pr-6 -mt-2">
        <div ref={infographicRef} className="w-full max-w-lg">
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
