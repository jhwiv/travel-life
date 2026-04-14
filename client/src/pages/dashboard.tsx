import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plane,
  TrainFront,
  MapPin,
  Globe,
  Clock,
  Route,
  Building2,
  ArrowRight,
  ChevronDown,
} from "lucide-react";
import type { Trip } from "@shared/schema";
import { Link } from "wouter";
import { getTrips, computeAnalytics } from "@/lib/static-data";

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
  tripsByMonth: Record<string, number>;
  topRoutes: { route: string; count: number }[];
  flightDistance: number;
  trainDistance: number;
}

const countryFlags: Record<string, string> = {
  "United States": "🇺🇸", US: "🇺🇸", USA: "🇺🇸",
  "United Kingdom": "🇬🇧", UK: "🇬🇧", England: "🇬🇧",
  France: "🇫🇷", Germany: "🇩🇪", Italy: "🇮🇹", Spain: "🇪🇸",
  Netherlands: "🇳🇱", Belgium: "🇧🇪", Switzerland: "🇨🇭",
  Austria: "🇦🇹", Portugal: "🇵🇹", Ireland: "🇮🇪",
  Sweden: "🇸🇪", Norway: "🇳🇴", Denmark: "🇩🇰", Finland: "🇫🇮",
  Japan: "🇯🇵", Canada: "🇨🇦", Mexico: "🇲🇽",
  Croatia: "🇭🇷", Aruba: "🇦🇼",
  "Dominican Republic": "🇩🇴", Jamaica: "🇯🇲",
  Bahamas: "🇧🇸", Bermuda: "🇧🇲", "Puerto Rico": "🇵🇷",
  "Costa Rica": "🇨🇷", Panama: "🇵🇦",
  Greece: "🇬🇷", Turkey: "🇹🇷",
  "Czech Republic": "🇨🇿", Czechia: "🇨🇿",
  Poland: "🇵🇱", Hungary: "🇭🇺", Romania: "🇷🇴",
  Iceland: "🇮🇸", Luxembourg: "🇱🇺",
};

function getFlag(c: string) { return countryFlags[c] || "🏳️"; }

function formatDuration(minutes: number) {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return { primary: `${days}d`, secondary: `${hours}h` };
  return { primary: `${hours}h`, secondary: `${mins}m` };
}

function formatDistance(miles: number) {
  if (miles >= 1000) return `${Math.round(miles).toLocaleString()}`;
  return miles.toLocaleString();
}

/* ─── World Map SVG ─── */
function WorldMapHero({ trips }: { trips: Trip[] }) {
  // Get top airports for arc destinations
  const airportCounts: Record<string, number> = {};
  trips.forEach(t => {
    airportCounts[t.departureCode] = (airportCounts[t.departureCode] || 0) + 1;
    airportCounts[t.arrivalCode] = (airportCounts[t.arrivalCode] || 0) + 1;
  });

  return (
    <div className="relative w-full h-48 md:h-56 overflow-hidden rounded-2xl mb-4" style={{ background: "linear-gradient(180deg, #1a1040 0%, #0f1628 100%)" }}>
      <svg viewBox="0 0 800 340" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        {/* Subtle grid */}
        <defs>
          <pattern id="map-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0 L0 0 0 40" fill="none" stroke="rgba(139,92,246,0.08)" strokeWidth="0.5" />
          </pattern>
          <linearGradient id="arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <rect width="800" height="340" fill="url(#map-grid)" />

        {/* Continental outlines — simplified, dotted */}
        <g fill="none" stroke="rgba(139,92,246,0.15)" strokeWidth="1" strokeLinecap="round">
          {/* North America */}
          <path d="M100,65 Q125,55 155,58 Q175,50 200,55 L225,65 Q245,58 260,70 L275,88 Q265,110 255,130 L240,150 Q225,162 200,165 L175,155 Q155,145 145,130 L130,108 Q118,88 100,65Z" />
          {/* South America */}
          <path d="M200,190 Q215,178 228,185 L240,200 Q248,225 242,248 L236,270 Q228,282 218,288 L205,278 Q195,258 200,238Z" />
          {/* Europe */}
          <path d="M375,55 Q388,48 405,52 L422,60 Q435,66 440,78 L434,95 Q428,108 415,112 L398,108 Q385,102 378,90 L375,72Z" />
          {/* Africa */}
          <path d="M385,132 Q398,125 410,130 L428,145 Q435,168 432,192 L422,215 Q410,232 398,238 L385,226 Q374,205 377,180Z" />
          {/* Asia */}
          <path d="M450,48 Q485,38 520,42 L565,55 Q600,62 622,75 L632,92 Q626,108 608,118 L585,124 Q548,130 515,122 L480,112 Q458,100 450,80Z" />
          {/* Australia */}
          <path d="M600,215 Q622,208 645,215 L662,228 Q668,240 662,252 L645,258 Q620,262 604,252 L596,240 Q592,228 600,215Z" />
        </g>

        {/* Flight arcs from EWR hub */}
        <g fill="none" strokeWidth="1.2">
          <path d="M185,88 Q290,20 405,62" stroke="url(#arc-grad)" strokeDasharray="5,4" />
          <path d="M185,88 Q350,50 520,55" stroke="url(#arc-grad)" strokeDasharray="5,4" />
          <path d="M185,88 Q290,160 398,145" stroke="rgba(139,92,246,0.2)" strokeDasharray="5,4" />
          <path d="M185,88 Q150,140 215,195" stroke="rgba(6,182,212,0.2)" strokeDasharray="5,4" />
        </g>

        {/* City dots */}
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

        {/* Hub label */}
        <text x="185" y="78" fill="rgba(139,92,246,0.6)" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">EWR</text>
      </svg>

      {/* Top label overlay */}
      <div className="absolute top-3 left-4 flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-purple-300/50 tracking-wider">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-purple-400/60" />
          FLIGHT MAP
        </div>
      </div>
    </div>
  );
}

/* ─── Horizontal Bar ─── */
function HBar({ label, count, max, color = "#8b5cf6" }: { label: string; count: number; max: number; color?: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-xs font-bold text-white/80 w-12 shrink-0 text-right tabular-nums">{label}</span>
      <div className="flex-1 h-5 bg-white/[0.04] rounded overflow-hidden">
        <div
          className="h-full rounded transition-all duration-500"
          style={{ width: `${Math.max(pct, 2)}%`, background: color }}
        />
      </div>
      <span className="text-xs font-bold text-white/70 w-8 tabular-nums">{count}</span>
    </div>
  );
}

/* ─── Section Header ─── */
function SectionHeader({ title, shareLabel }: { title: string; shareLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-3 mt-6">
      <h3 className="text-base font-bold text-white">{title}</h3>
      {shareLabel && (
        <button className="text-[10px] text-purple-300/60 hover:text-purple-300 transition-colors font-medium uppercase tracking-wider">
          Share
        </button>
      )}
    </div>
  );
}

/* ─── Year Tab ─── */
function YearTab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
        active
          ? "bg-white/15 text-white"
          : "text-white/40 hover:text-white/60"
      }`}
    >
      {label}
    </button>
  );
}

/* ─── Main Dashboard ─── */
export default function Dashboard() {
  const analytics = computeAnalytics() as Analytics;
  const trips = getTrips() as unknown as Trip[];
  const analyticsLoading = false;

  const [selectedYear, setSelectedYear] = useState("all");

  if (analyticsLoading) {
    return (
      <div className="min-h-screen p-5" style={{ background: "linear-gradient(165deg, #0a0a1a 0%, #1a1040 30%, #0f1628 60%, #0a0a1a 100%)" }}>
        <Skeleton className="h-56 w-full rounded-2xl mb-6 bg-white/5" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center" style={{ background: "linear-gradient(165deg, #0a0a1a 0%, #1a1040 30%, #0f1628 60%, #0a0a1a 100%)" }}>
        <Globe className="w-12 h-12 text-purple-400/30 mb-4" />
        <p className="text-lg font-semibold text-white mb-1">No data yet</p>
        <p className="text-sm text-white/40 mb-6">Add your first trip to see your passport.</p>
        <Link href="/trips">
          <span className="text-sm text-purple-400 hover:text-purple-300 cursor-pointer font-medium">Go to Trips →</span>
        </Link>
      </div>
    );

  // Filter trips by year
  const filteredTrips = selectedYear === "all"
    ? trips.filter(t => t.status === "completed")
    : trips.filter(t => t.status === "completed" && t.departureDate.startsWith(selectedYear));

  const flights = filteredTrips.filter(t => t.type === "flight");
  const trains = filteredTrips.filter(t => t.type === "train");
  const totalDistance = filteredTrips.reduce((s, t) => s + (t.distance || 0), 0);
  const flightDistance = flights.reduce((s, t) => s + (t.distance || 0), 0);
  const trainDistance = trains.reduce((s, t) => s + (t.distance || 0), 0);
  const totalDuration = filteredTrips.reduce((s, t) => s + t.duration, 0);

  // Unique sets
  const countriesSet = new Set<string>();
  const citiesSet = new Set<string>();
  const airportsSet = new Set<string>();
  const airlinesSet = new Set<string>();
  const trainOpsSet = new Set<string>();
  filteredTrips.forEach(t => {
    countriesSet.add(t.departureCountry);
    countriesSet.add(t.arrivalCountry);
    citiesSet.add(t.departureCity);
    citiesSet.add(t.arrivalCity);
    airportsSet.add(t.departureCode);
    airportsSet.add(t.arrivalCode);
    if (t.airline) airlinesSet.add(t.airline);
    if (t.trainOperator) trainOpsSet.add(t.trainOperator);
  });

  const countries = Array.from(countriesSet);
  const airports = Array.from(airportsSet);
  const airlines = Array.from(airlinesSet);
  const trainOps = Array.from(trainOpsSet);

  // Airport counts
  const airportCounts: Record<string, number> = {};
  filteredTrips.forEach(t => {
    airportCounts[t.departureCode] = (airportCounts[t.departureCode] || 0) + 1;
    airportCounts[t.arrivalCode] = (airportCounts[t.arrivalCode] || 0) + 1;
  });
  const topAirports = Object.entries(airportCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const maxAirportCount = topAirports.length > 0 ? topAirports[0][1] : 1;

  // Airline counts
  const airlineCounts: Record<string, number> = {};
  flights.forEach(t => {
    if (t.airline) airlineCounts[t.airline] = (airlineCounts[t.airline] || 0) + 1;
  });
  const topAirlines = Object.entries(airlineCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxAirlineCount = topAirlines.length > 0 ? topAirlines[0][1] : 1;

  // Route counts
  const routeCounts: Record<string, number> = {};
  filteredTrips.forEach(t => {
    const route = `${t.departureCode}-${t.arrivalCode}`;
    routeCounts[route] = (routeCounts[route] || 0) + 1;
  });
  const topRoutes = Object.entries(routeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const maxRouteCount = topRoutes.length > 0 ? topRoutes[0][1] : 1;

  // Trips per weekday
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  filteredTrips.forEach(t => {
    const d = new Date(t.departureDate);
    weekdayCounts[d.getDay()] = (weekdayCounts[d.getDay()] || 0) + 1;
  });
  const maxWeekday = Math.max(...weekdayCounts, 1);
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Comparison metrics
  const earthCircumference = 24901;
  const moonDistance = 238900;
  const aroundEarth = totalDistance / earthCircumference;
  const toMoon = totalDistance / moonDistance;

  // Shortest/longest flights
  const sortedByDistance = [...flights].filter(t => t.distance && t.distance > 0).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  const shortestFlight = sortedByDistance[0];
  const longestFlight = sortedByDistance[sortedByDistance.length - 1];

  const sortedByDuration = [...flights].filter(t => t.duration > 0).sort((a, b) => a.duration - b.duration);
  const shortestTime = sortedByDuration[0];
  const longestTime = sortedByDuration[sortedByDuration.length - 1];

  // Years for tabs
  const years = Array.from(new Set(trips.map(t => t.departureDate.substring(0, 4)))).sort((a, b) => b.localeCompare(a));

  // Country-by-continent mapping (simplified)
  const continentMap: Record<string, string> = {
    "United States": "N. America", US: "N. America", USA: "N. America",
    Canada: "N. America", Mexico: "N. America",
    "United Kingdom": "Europe", UK: "Europe", England: "Europe",
    France: "Europe", Germany: "Europe", Italy: "Europe", Spain: "Europe",
    Netherlands: "Europe", Belgium: "Europe", Switzerland: "Europe",
    Austria: "Europe", Portugal: "Europe", Ireland: "Europe",
    Sweden: "Europe", Norway: "Europe", Denmark: "Europe", Finland: "Europe",
    Croatia: "Europe", Iceland: "Europe", "Czech Republic": "Europe", Czechia: "Europe",
    Poland: "Europe", Hungary: "Europe", Romania: "Europe", Luxembourg: "Europe",
    Greece: "Europe", Turkey: "Europe",
    Aruba: "Caribbean", "Dominican Republic": "Caribbean", Jamaica: "Caribbean",
    Bahamas: "Caribbean", Bermuda: "Caribbean", "Puerto Rico": "Caribbean",
    "Costa Rica": "C. America", Panama: "C. America",
    Japan: "Asia", China: "Asia", India: "Asia",
    Australia: "Oceania", "New Zealand": "Oceania",
  };

  const continentCounts: Record<string, number> = {};
  countries.forEach(c => {
    const cont = continentMap[c] || "Other";
    continentCounts[cont] = (continentCounts[cont] || 0) + 1;
  });

  // Continent flight counts for percentages
  const continentFlightCounts: Record<string, number> = {};
  filteredTrips.forEach(t => {
    const depCont = continentMap[t.departureCountry] || "Other";
    const arrCont = continentMap[t.arrivalCountry] || "Other";
    continentFlightCounts[depCont] = (continentFlightCounts[depCont] || 0) + 1;
    if (arrCont !== depCont) {
      continentFlightCounts[arrCont] = (continentFlightCounts[arrCont] || 0) + 1;
    }
  });
  const totalContinentFlights = Object.values(continentFlightCounts).reduce((s, v) => s + v, 0) || 1;

  const allContinents = ["Europe", "Caribbean", "N. America", "Africa", "Asia", "C. America", "S. America", "Middle East", "Oceania"];

  const dur = formatDuration(totalDuration);

  return (
    <div className="min-h-screen pb-16" style={{ background: "linear-gradient(165deg, #0a0a1a 0%, #1a1040 30%, #0f1628 60%, #0a0a1a 100%)" }}>
      {/* Sticky year tabs */}
      <div className="sticky top-0 z-30 pl-14 lg:pl-4 pr-4 pt-3 pb-2" style={{ background: "linear-gradient(180deg, rgba(10,10,26,0.98) 0%, rgba(10,10,26,0.9) 80%, transparent 100%)" }}>
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <YearTab label="ALL-TIME" active={selectedYear === "all"} onClick={() => setSelectedYear("all")} />
          {years.map(y => (
            <YearTab key={y} label={y} active={selectedYear === y} onClick={() => setSelectedYear(y)} />
          ))}
        </div>
      </div>

      <div className="pl-14 lg:pl-4 pr-4 pt-2 max-w-2xl mx-auto">
        {/* World Map */}
        <WorldMapHero trips={filteredTrips} />

        {/* Country Flags */}
        {countries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5 justify-center">
            {countries.map(c => (
              <span key={c} className="text-xl" title={c}>{getFlag(c)}</span>
            ))}
          </div>
        )}

        {/* ─── MY TRAVEL PASSPORT ─── */}
        <div className="mb-6">
          <h2 className="text-lg font-extrabold text-white tracking-tight">MY TRAVEL PASSPORT</h2>
          <p className="text-[10px] text-white/30 tracking-[0.2em] uppercase mt-0.5">
            Passport · Pass · Pasaporte
          </p>
        </div>

        {/* Primary KPIs */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 mb-6">
          <div>
            <p className="text-[10px] text-purple-300/50 uppercase tracking-wider font-medium mb-1">Trips</p>
            <p className="text-5xl font-extrabold text-white tabular-nums leading-none">{filteredTrips.length}</p>
            <p className="text-xs text-white/30 mt-1">{flights.length} flights · {trains.length} trains</p>
          </div>
          <div>
            <p className="text-[10px] text-purple-300/50 uppercase tracking-wider font-medium mb-1">Distance</p>
            <p className="text-4xl font-extrabold text-white tabular-nums leading-none">
              {formatDistance(totalDistance)}
              <span className="text-lg font-semibold text-purple-300/60 ml-1">mi</span>
            </p>
            <p className="text-xs text-white/30 mt-1">avg {Math.round(totalDistance / (filteredTrips.length || 1)).toLocaleString()} mi</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-x-6 gap-y-5 mb-6">
          <div>
            <p className="text-[10px] text-purple-300/50 uppercase tracking-wider font-medium mb-1">Travel Time</p>
            <p className="text-3xl font-extrabold text-white tabular-nums leading-none">
              {dur.primary}<span className="text-lg font-semibold text-white/50 ml-0.5">{dur.secondary}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-purple-300/50 uppercase tracking-wider font-medium mb-1">Airports</p>
            <p className="text-3xl font-extrabold text-white tabular-nums leading-none">{airportsSet.size}</p>
          </div>
          <div>
            <p className="text-[10px] text-purple-300/50 uppercase tracking-wider font-medium mb-1">Operators</p>
            <p className="text-3xl font-extrabold text-white tabular-nums leading-none">{airlinesSet.size + trainOpsSet.size}</p>
          </div>
        </div>

        {/* ─── FLIGHTS Section ─── */}
        <SectionHeader title="Flights" shareLabel="Share" />
        <div className="rounded-2xl p-5 mb-2" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.1)" }}>
          <p className="text-5xl font-extrabold text-white tabular-nums leading-none mb-1">{flights.length}</p>
          <p className="text-xs text-white/30">{flights.filter(f => f.arrivalCountry !== f.departureCountry).length} international · {flights.filter(f => (f.distance || 0) > 2500).length} long haul</p>
        </div>

        {/* Flights per weekday chart */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-1 mb-3">
            <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium">Flights per</p>
            <div className="flex gap-3 ml-2">
              <span className="text-[10px] text-white/30 cursor-pointer">Year</span>
              <span className="text-[10px] text-white/30 cursor-pointer">Month</span>
              <span className="text-[10px] text-white font-semibold border-b border-purple-400 pb-0.5">Weekday</span>
            </div>
          </div>
          <div className="flex items-end gap-[6px] h-28">
            {weekdayCounts.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                {count > 0 && (
                  <span className="text-[9px] font-bold tabular-nums text-white/50">{count}</span>
                )}
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: count > 0 ? `${Math.max((count / maxWeekday) * 100, 8)}%` : "3px",
                    background: count > 0 ? "#8b5cf6" : "rgba(255,255,255,0.05)",
                    minHeight: count > 0 ? "8px" : "3px",
                  }}
                />
                <span className="text-[9px] text-white/30 font-medium">{weekdayLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Flight Distance ─── */}
        <SectionHeader title="Flight Distance" shareLabel="Share" />
        <div className="rounded-2xl p-5 mb-2" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.1)" }}>
          <p className="text-4xl font-extrabold text-white tabular-nums leading-none mb-1">
            {formatDistance(flightDistance)}
            <span className="text-lg font-semibold text-purple-300/60 ml-1">mi</span>
          </p>
          <p className="text-xs text-white/30">Average distance: {Math.round(flightDistance / (flights.length || 1)).toLocaleString()} mi</p>
        </div>

        {/* Comparison bars */}
        <div className="space-y-2 mb-4">
          {aroundEarth > 0 && (
            <div className="rounded-xl px-4 py-2.5 flex items-center gap-3" style={{ background: "linear-gradient(90deg, rgba(139,92,246,0.25), rgba(6,182,212,0.15))" }}>
              <span className="text-lg">🌍</span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-purple-400" style={{ width: `${Math.min(aroundEarth / 15 * 100, 100)}%` }} />
              </div>
              <span className="text-sm font-bold text-white tabular-nums">{aroundEarth.toFixed(1)}x</span>
              <span className="text-xs text-white/50">Around Earth</span>
            </div>
          )}
          {toMoon > 0 && (
            <div className="rounded-xl px-4 py-2.5 flex items-center gap-3" style={{ background: "linear-gradient(90deg, rgba(139,92,246,0.2), rgba(107,114,128,0.15))" }}>
              <span className="text-lg">🌙</span>
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-indigo-400" style={{ width: `${Math.min(toMoon / 2 * 100, 100)}%` }} />
              </div>
              <span className="text-sm font-bold text-white tabular-nums">{toMoon.toFixed(1)}x</span>
              <span className="text-xs text-white/50">To the Moon</span>
            </div>
          )}
        </div>

        {/* Shortest / Longest flight */}
        {shortestFlight && longestFlight && (
          <div className="space-y-3 mb-4">
            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Shortest flight</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                    <Plane className="w-3.5 h-3.5 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{shortestFlight.departureCity} <ArrowRight className="w-3 h-3 inline text-white/30" /> {shortestFlight.arrivalCity}</p>
                    <p className="text-[10px] text-white/30">{shortestFlight.airline} {shortestFlight.flightNumber} · {new Date(shortestFlight.departureDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-white tabular-nums">{Math.round(shortestFlight.distance || 0).toLocaleString()} <span className="text-xs text-white/40">mi</span></p>
              </div>
            </div>
            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Longest flight</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                    <Plane className="w-3.5 h-3.5 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{longestFlight.departureCity} <ArrowRight className="w-3 h-3 inline text-white/30" /> {longestFlight.arrivalCity}</p>
                    <p className="text-[10px] text-white/30">{longestFlight.airline} {longestFlight.flightNumber} · {new Date(longestFlight.departureDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-white tabular-nums">{Math.round(longestFlight.distance || 0).toLocaleString()} <span className="text-xs text-white/40">mi</span></p>
              </div>
            </div>
          </div>
        )}

        {/* Shortest / Longest by time */}
        {shortestTime && longestTime && shortestTime.id !== shortestFlight?.id && (
          <div className="space-y-3 mb-4">
            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Shortest flight (time)</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{shortestTime.departureCity} <ArrowRight className="w-3 h-3 inline text-white/30" /> {shortestTime.arrivalCity}</p>
                    <p className="text-[10px] text-white/30">{shortestTime.airline} {shortestTime.flightNumber} · {new Date(shortestTime.departureDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-white tabular-nums">{formatDuration(shortestTime.duration).primary}<span className="text-xs text-white/40">{formatDuration(shortestTime.duration).secondary}</span></p>
              </div>
            </div>
            <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Longest flight (time)</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/15 flex items-center justify-center">
                    <Clock className="w-3.5 h-3.5 text-purple-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{longestTime.departureCity} <ArrowRight className="w-3 h-3 inline text-white/30" /> {longestTime.arrivalCity}</p>
                    <p className="text-[10px] text-white/30">{longestTime.airline} {longestTime.flightNumber} · {new Date(longestTime.departureDate).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-white tabular-nums">{formatDuration(longestTime.duration).primary}<span className="text-xs text-white/40">{formatDuration(longestTime.duration).secondary}</span></p>
              </div>
            </div>
          </div>
        )}

        {/* ─── Top Visited Airports ─── */}
        <SectionHeader title="Top Visited Airports" shareLabel="Share" />
        <div className="rounded-2xl p-5 mb-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-3xl font-extrabold text-white tabular-nums leading-none mb-0.5">{airportsSet.size}</p>
          <p className="text-xs text-white/30 mb-4">total airports</p>
          <div className="space-y-0.5">
            {topAirports.map(([code, count]) => (
              <HBar key={code} label={code} count={count} max={maxAirportCount} color="#8b5cf6" />
            ))}
          </div>
        </div>

        {/* ─── Top Airlines ─── */}
        {topAirlines.length > 0 && (
          <>
            <SectionHeader title="Top Airlines" shareLabel="Share" />
            <div className="rounded-2xl p-5 mb-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
              <p className="text-3xl font-extrabold text-white tabular-nums leading-none mb-0.5">{airlinesSet.size}</p>
              <p className="text-xs text-white/30 mb-4">total airlines</p>
              <div className="space-y-0.5">
                {topAirlines.map(([name, count]) => (
                  <HBar key={name} label={name.length > 6 ? name.substring(0, 6) : name} count={count} max={maxAirlineCount} color="#8b5cf6" />
                ))}
              </div>
            </div>
          </>
        )}

        {/* ─── Top Routes ─── */}
        <SectionHeader title="Top Routes" shareLabel="Share" />
        <div className="rounded-2xl p-5 mb-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-3xl font-extrabold text-white tabular-nums leading-none mb-0.5">{Object.keys(routeCounts).length}</p>
          <p className="text-xs text-white/30 mb-4">total routes</p>
          <div className="space-y-0.5">
            {topRoutes.map(([route, count]) => (
              <HBar key={route} label={route} count={count} max={maxRouteCount} color="#8b5cf6" />
            ))}
          </div>
        </div>

        {/* ─── Countries & Territories ─── */}
        <SectionHeader title="Countries & Territories" shareLabel="Share" />
        <div className="rounded-2xl p-5 mb-4" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
          <p className="text-3xl font-extrabold text-white tabular-nums leading-none mb-0.5">{countries.length}</p>
          <p className="text-xs text-white/30 mb-5">total</p>

          {/* Country list */}
          <div className="space-y-3 mb-5">
            {countries.slice(0, 6).map(c => {
              const countryTrips = filteredTrips.filter(t => t.departureCountry === c || t.arrivalCountry === c).length;
              return (
                <div key={c} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{getFlag(c)}</span>
                    <span className="text-sm font-semibold text-white">{c}</span>
                  </div>
                  <span className="text-xs text-white/40 tabular-nums">{countryTrips} flights</span>
                </div>
              );
            })}
            {countries.length > 6 && (
              <button className="text-xs text-purple-400 hover:text-purple-300 font-medium">Show More</button>
            )}
          </div>

          {/* Continent grid */}
          <div className="grid grid-cols-3 gap-2">
            {allContinents.map(cont => {
              const count = continentCounts[cont] || 0;
              const pct = Math.round((continentFlightCounts[cont] || 0) / totalContinentFlights * 100);
              return (
                <div key={cont} className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <p className="text-[10px] text-white/30 mb-1 truncate">{cont}</p>
                  <p className="text-xl font-extrabold text-white tabular-nums leading-none">{count}</p>
                  <p className="text-[10px] text-white/20 tabular-nums">{pct}%</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Travel Time ─── */}
        <SectionHeader title="Travel Time" shareLabel="Share" />
        <div className="rounded-2xl p-5 mb-4" style={{ background: "rgba(139,92,246,0.06)", border: "1px solid rgba(139,92,246,0.1)" }}>
          <p className="text-4xl font-extrabold text-white tabular-nums leading-none mb-2">
            {Math.floor(totalDuration / 60).toLocaleString()}<span className="text-lg text-white/50">h</span>{" "}
            {totalDuration % 60}<span className="text-lg text-white/50">m</span>
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-4">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Days</p>
              <p className="text-2xl font-bold text-white tabular-nums">{(totalDuration / 1440).toFixed(1)}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Weeks</p>
              <p className="text-2xl font-bold text-white tabular-nums">{(totalDuration / 10080).toFixed(1)}</p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Avg. Flight Time</p>
              <p className="text-2xl font-bold text-white tabular-nums">
                {flights.length > 0 ? `${Math.floor(flights.reduce((s, t) => s + t.duration, 0) / flights.length / 60)}h ${Math.round(flights.reduce((s, t) => s + t.duration, 0) / flights.length % 60)}m` : "—"}
              </p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Countries</p>
              <p className="text-2xl font-bold text-white tabular-nums">{countries.length}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <div className="h-px mx-auto w-48 mb-4" style={{ background: "linear-gradient(90deg, transparent, rgba(139,92,246,0.2), transparent)" }} />
          <p className="text-[8px] font-mono text-white/15 tracking-[0.3em] uppercase">
            {selectedYear === "all" ? "ALL TIME" : selectedYear} · TRAVEL LIFE · GRANDLOOPSTUDIO.COM
          </p>
          <ChevronDown className="w-5 h-5 text-white/10 mx-auto mt-2" />
        </div>
      </div>
    </div>
  );
}
