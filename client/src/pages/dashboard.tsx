import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plane,
  TrainFront,
  MapPin,
  Globe,
  Clock,
  Route,
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
  "United States": "\u{1F1FA}\u{1F1F8}", US: "\u{1F1FA}\u{1F1F8}", USA: "\u{1F1FA}\u{1F1F8}",
  "United Kingdom": "\u{1F1EC}\u{1F1E7}", UK: "\u{1F1EC}\u{1F1E7}", England: "\u{1F1EC}\u{1F1E7}",
  France: "\u{1F1EB}\u{1F1F7}", Germany: "\u{1F1E9}\u{1F1EA}", Italy: "\u{1F1EE}\u{1F1F9}", Spain: "\u{1F1EA}\u{1F1F8}",
  Netherlands: "\u{1F1F3}\u{1F1F1}", Belgium: "\u{1F1E7}\u{1F1EA}", Switzerland: "\u{1F1E8}\u{1F1ED}",
  Austria: "\u{1F1E6}\u{1F1F9}", Portugal: "\u{1F1F5}\u{1F1F9}", Ireland: "\u{1F1EE}\u{1F1EA}",
  Sweden: "\u{1F1F8}\u{1F1EA}", Norway: "\u{1F1F3}\u{1F1F4}", Denmark: "\u{1F1E9}\u{1F1F0}", Finland: "\u{1F1EB}\u{1F1EE}",
  Japan: "\u{1F1EF}\u{1F1F5}", Canada: "\u{1F1E8}\u{1F1E6}", Mexico: "\u{1F1F2}\u{1F1FD}",
  Croatia: "\u{1F1ED}\u{1F1F7}", Aruba: "\u{1F1E6}\u{1F1FC}",
  "Dominican Republic": "\u{1F1E9}\u{1F1F4}", Jamaica: "\u{1F1EF}\u{1F1F2}",
  Bahamas: "\u{1F1E7}\u{1F1F8}", Bermuda: "\u{1F1E7}\u{1F1F2}", "Puerto Rico": "\u{1F1F5}\u{1F1F7}",
  "Costa Rica": "\u{1F1E8}\u{1F1F7}", Panama: "\u{1F1F5}\u{1F1E6}",
  Greece: "\u{1F1EC}\u{1F1F7}", Turkey: "\u{1F1F9}\u{1F1F7}",
  "Czech Republic": "\u{1F1E8}\u{1F1FF}", Czechia: "\u{1F1E8}\u{1F1FF}",
  Poland: "\u{1F1F5}\u{1F1F1}", Hungary: "\u{1F1ED}\u{1F1FA}", Romania: "\u{1F1F7}\u{1F1F4}",
  Iceland: "\u{1F1EE}\u{1F1F8}", Luxembourg: "\u{1F1F1}\u{1F1FA}",
};

function getFlag(c: string) { return countryFlags[c] || "\u{1F3F3}\u{FE0F}"; }

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
  return (
    <div className="relative w-full h-48 md:h-56 overflow-hidden rounded-2xl mb-4" style={{ background: "linear-gradient(180deg, #0F172A 0%, #0D2137 100%)" }}>
      <svg viewBox="0 0 800 340" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="map-grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0 L0 0 0 40" fill="none" stroke="rgba(13,148,136,0.08)" strokeWidth="0.5" />
          </pattern>
          <linearGradient id="arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0D9488" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#1E3A5F" stopOpacity="0.3" />
          </linearGradient>
        </defs>
        <rect width="800" height="340" fill="url(#map-grid)" />

        <g fill="none" stroke="rgba(13,148,136,0.15)" strokeWidth="1" strokeLinecap="round">
          <path d="M100,65 Q125,55 155,58 Q175,50 200,55 L225,65 Q245,58 260,70 L275,88 Q265,110 255,130 L240,150 Q225,162 200,165 L175,155 Q155,145 145,130 L130,108 Q118,88 100,65Z" />
          <path d="M200,190 Q215,178 228,185 L240,200 Q248,225 242,248 L236,270 Q228,282 218,288 L205,278 Q195,258 200,238Z" />
          <path d="M375,55 Q388,48 405,52 L422,60 Q435,66 440,78 L434,95 Q428,108 415,112 L398,108 Q385,102 378,90 L375,72Z" />
          <path d="M385,132 Q398,125 410,130 L428,145 Q435,168 432,192 L422,215 Q410,232 398,238 L385,226 Q374,205 377,180Z" />
          <path d="M450,48 Q485,38 520,42 L565,55 Q600,62 622,75 L632,92 Q626,108 608,118 L585,124 Q548,130 515,122 L480,112 Q458,100 450,80Z" />
          <path d="M600,215 Q622,208 645,215 L662,228 Q668,240 662,252 L645,258 Q620,262 604,252 L596,240 Q592,228 600,215Z" />
        </g>

        <g fill="none" strokeWidth="1.2">
          <path d="M185,88 Q290,20 405,62" stroke="url(#arc-grad)" className="animate-arc" style={{ animationDelay: "0.2s" }} />
          <path d="M185,88 Q350,50 520,55" stroke="url(#arc-grad)" className="animate-arc" style={{ animationDelay: "0.5s" }} />
          <path d="M185,88 Q290,160 398,145" stroke="rgba(13,148,136,0.2)" className="animate-arc" style={{ animationDelay: "0.8s" }} />
          <path d="M185,88 Q150,140 215,195" stroke="rgba(245,158,11,0.2)" className="animate-arc" style={{ animationDelay: "1.1s" }} />
        </g>

        {[
          { x: 185, y: 88, r: 5, color: "#0D9488", label: "EWR" },
          { x: 405, y: 62, r: 3.5, color: "#14B8A6" },
          { x: 520, y: 55, r: 3, color: "#1E3A5F" },
          { x: 398, y: 145, r: 3, color: "#0D9488" },
          { x: 215, y: 195, r: 3, color: "#F59E0B" },
          { x: 630, y: 232, r: 2.5, color: "#1E3A5F" },
          { x: 155, y: 115, r: 3, color: "#14B8A6" },
        ].map((dot, i) => (
          <g key={i}>
            <circle cx={dot.x} cy={dot.y} r={dot.r * 2.5} fill={dot.color} fillOpacity="0.1">
              <animate attributeName="r" values={`${dot.r * 2.5};${dot.r * 3.5};${dot.r * 2.5}`} dur={`${3 + i * 0.4}s`} repeatCount="indefinite" />
            </circle>
            <circle cx={dot.x} cy={dot.y} r={dot.r} fill={dot.color} fillOpacity="0.8" />
          </g>
        ))}
        <text x="185" y="78" fill="rgba(13,148,136,0.6)" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">EWR</text>
      </svg>

      <div className="absolute top-3 left-4 flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-teal-300/50 tracking-wider">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-teal-400/60" />
          FLIGHT MAP
        </div>
      </div>
    </div>
  );
}

/* ─── Horizontal Bar ─── */
function HBar({ label, count, max, color = "#0D9488" }: { label: string; count: number; max: number; color?: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-xs font-bold text-white/80 w-12 shrink-0 text-right tabular-nums">{label}</span>
      <div className="flex-1 h-5 bg-white/[0.04] rounded overflow-hidden">
        <div className="h-full rounded transition-all duration-500" style={{ width: `${Math.max(pct, 2)}%`, background: color }} />
      </div>
      <span className="text-xs font-bold text-white/70 w-8 tabular-nums">{count}</span>
    </div>
  );
}

/* ─── Section Header ─── */
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between mb-3 mt-6">
      <h3 className="text-base font-bold text-white font-display">{title}</h3>
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
          ? "bg-teal-500/15 text-teal-300"
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
      <div className="min-h-screen p-5" style={{ background: "linear-gradient(165deg, #0F172A 0%, #0D2137 30%, #0F172A 60%, #091018 100%)" }}>
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
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center" style={{ background: "linear-gradient(165deg, #0F172A 0%, #0D2137 30%, #0F172A 60%, #091018 100%)" }}>
        <Globe className="w-12 h-12 text-teal-400/30 mb-4" />
        <p className="text-lg font-semibold text-white mb-1">No data yet</p>
        <p className="text-sm text-white/40 mb-6">Add your first trip to see your passport.</p>
        <Link href="/trips">
          <span className="text-sm text-teal-400 hover:text-teal-300 cursor-pointer font-medium">Go to Trips →</span>
        </Link>
      </div>
    );

  const filteredTrips = selectedYear === "all"
    ? trips.filter(t => t.status === "completed")
    : trips.filter(t => t.status === "completed" && t.departureDate.startsWith(selectedYear));

  const flights = filteredTrips.filter(t => t.type === "flight");
  const trains = filteredTrips.filter(t => t.type === "train");
  const totalDistance = filteredTrips.reduce((s, t) => s + (t.distance || 0), 0);
  const flightDistance = flights.reduce((s, t) => s + (t.distance || 0), 0);
  const totalDuration = filteredTrips.reduce((s, t) => s + t.duration, 0);

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
  const airportCounts: Record<string, number> = {};
  filteredTrips.forEach(t => {
    airportCounts[t.departureCode] = (airportCounts[t.departureCode] || 0) + 1;
    airportCounts[t.arrivalCode] = (airportCounts[t.arrivalCode] || 0) + 1;
  });
  const topAirports = Object.entries(airportCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxAirportCount = topAirports.length > 0 ? topAirports[0][1] : 1;

  const airlineCounts: Record<string, number> = {};
  flights.forEach(t => { if (t.airline) airlineCounts[t.airline] = (airlineCounts[t.airline] || 0) + 1; });
  const topAirlines = Object.entries(airlineCounts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const maxAirlineCount = topAirlines.length > 0 ? topAirlines[0][1] : 1;

  const routeCounts: Record<string, number> = {};
  filteredTrips.forEach(t => { routeCounts[`${t.departureCode}-${t.arrivalCode}`] = (routeCounts[`${t.departureCode}-${t.arrivalCode}`] || 0) + 1; });
  const topRoutes = Object.entries(routeCounts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxRouteCount = topRoutes.length > 0 ? topRoutes[0][1] : 1;

  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
  filteredTrips.forEach(t => { weekdayCounts[new Date(t.departureDate).getDay()]++; });
  const maxWeekday = Math.max(...weekdayCounts, 1);
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const earthCircumference = 24901;
  const aroundEarth = totalDistance / earthCircumference;

  const sortedByDistance = [...flights].filter(t => t.distance && t.distance > 0).sort((a, b) => (a.distance || 0) - (b.distance || 0));
  const shortestFlight = sortedByDistance[0];
  const longestFlight = sortedByDistance[sortedByDistance.length - 1];

  const years = Array.from(new Set(trips.map(t => t.departureDate.substring(0, 4)))).sort((a, b) => b.localeCompare(a));

  // Monthly flight sparkline data
  const monthCounts = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, "0");
    return filteredTrips.filter(t => t.departureDate.substring(5, 7) === m).length;
  });
  const maxMonth = Math.max(...monthCounts, 1);
  const monthLabels = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

  const dur = formatDuration(totalDuration);

  return (
    <div className="min-h-screen pb-16 animate-page-enter" style={{ background: "linear-gradient(165deg, #0F172A 0%, #0D2137 30%, #0F172A 60%, #091018 100%)" }}>
      {/* Sticky year tabs */}
      <div className="sticky top-0 z-30 pl-14 lg:pl-4 pr-4 pt-3 pb-2" style={{ background: "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.9) 80%, transparent 100%)" }}>
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <YearTab label="ALL-TIME" active={selectedYear === "all"} onClick={() => setSelectedYear("all")} />
          {years.map(y => (
            <YearTab key={y} label={y} active={selectedYear === y} onClick={() => setSelectedYear(y)} />
          ))}
        </div>
      </div>

      <div className="pl-14 lg:pl-4 pr-4 pt-2 max-w-2xl mx-auto">
        <WorldMapHero trips={filteredTrips} />

        {countries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5 justify-center">
            {countries.map(c => (
              <span key={c} className="text-xl" title={c}>{getFlag(c)}</span>
            ))}
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-lg font-extrabold text-white tracking-tight font-display">MY TRAVEL PASSPORT</h2>
          <p className="text-[10px] text-teal-300/30 tracking-[0.2em] uppercase mt-0.5">
            Passport · Pass · Pasaporte
          </p>
        </div>

        {/* Primary KPIs */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-5 mb-6">
          <div className="animate-count-up">
            <p className="text-[10px] text-teal-300/50 uppercase tracking-wider font-medium mb-1">Trips</p>
            <p className="text-5xl font-extrabold text-white tabular-nums leading-none font-display">{filteredTrips.length}</p>
            <p className="text-xs text-white/30 mt-1">{flights.length} flights · {trains.length} trains</p>
          </div>
          <div className="animate-count-up">
            <p className="text-[10px] text-teal-300/50 uppercase tracking-wider font-medium mb-1">Distance</p>
            <p className="text-4xl font-extrabold text-white tabular-nums leading-none font-display">
              {formatDistance(totalDistance)}
              <span className="text-lg font-semibold text-teal-300/60 ml-1">mi</span>
            </p>
            <p className="text-xs text-white/30 mt-1">avg {Math.round(totalDistance / (filteredTrips.length || 1)).toLocaleString()} mi</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-x-6 gap-y-5 mb-6">
          <div>
            <p className="text-[10px] text-teal-300/50 uppercase tracking-wider font-medium mb-1">Travel Time</p>
            <p className="text-3xl font-extrabold text-white tabular-nums leading-none font-display">
              {dur.primary}<span className="text-lg font-semibold text-white/50 ml-0.5">{dur.secondary}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-teal-300/50 uppercase tracking-wider font-medium mb-1">Airports</p>
            <p className="text-3xl font-extrabold text-white tabular-nums leading-none font-display">{airportsSet.size}</p>
          </div>
          <div>
            <p className="text-[10px] text-teal-300/50 uppercase tracking-wider font-medium mb-1">Operators</p>
            <p className="text-3xl font-extrabold text-white tabular-nums leading-none font-display">{airlinesSet.size + trainOpsSet.size}</p>
          </div>
        </div>

        {/* Flights Section */}
        <SectionHeader title="Flights" />
        <div className="glass-card mb-2">
          <p className="text-5xl font-extrabold text-white tabular-nums leading-none mb-1 font-display">{flights.length}</p>
          <p className="text-xs text-white/30">{flights.filter(f => f.arrivalCountry !== f.departureCountry).length} international · {flights.filter(f => (f.distance || 0) > 2500).length} long haul</p>
        </div>

        {/* Flights per weekday chart */}
        <div className="glass-card mb-4">
          <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium mb-3">Flights per Weekday</p>
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
                    background: count > 0 ? "linear-gradient(180deg, #0D9488, #1E3A5F)" : "rgba(255,255,255,0.05)",
                    minHeight: count > 0 ? "8px" : "3px",
                  }}
                />
                <span className="text-[9px] text-white/30 font-medium">{weekdayLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Flight Distance */}
        <SectionHeader title="Flight Distance" />
        <div className="glass-card mb-2" style={{ background: "rgba(13,148,136,0.08)", border: "1px solid rgba(13,148,136,0.12)" }}>
          <p className="text-4xl font-extrabold text-white tabular-nums leading-none mb-1 font-display">
            {formatDistance(flightDistance)}
            <span className="text-lg font-semibold text-teal-300/60 ml-1">mi</span>
          </p>
          <p className="text-xs text-white/30">Average distance: {Math.round(flightDistance / (flights.length || 1)).toLocaleString()} mi</p>
        </div>

        {/* Earth comparison */}
        {aroundEarth > 0 && (
          <div className="glass-card mb-4 !p-4 flex items-center gap-3" style={{ background: "linear-gradient(90deg, rgba(13,148,136,0.15), rgba(30,58,95,0.1))" }}>
            <span className="text-lg">🌍</span>
            <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${Math.min(aroundEarth / 15 * 100, 100)}%`, background: "linear-gradient(90deg, #0D9488, #F59E0B)" }} />
            </div>
            <span className="text-sm font-bold text-white tabular-nums font-display">{aroundEarth.toFixed(1)}x</span>
            <span className="text-xs text-white/50">Around Earth</span>
          </div>
        )}

        {/* Shortest / Longest flight */}
        {shortestFlight && longestFlight && (
          <div className="space-y-3 mb-4">
            <div className="glass-card !p-4">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Shortest flight</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/15 flex items-center justify-center">
                    <Plane className="w-3.5 h-3.5 text-teal-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{shortestFlight.departureCity} <ArrowRight className="w-3 h-3 inline text-white/30" /> {shortestFlight.arrivalCity}</p>
                    <p className="text-[10px] text-white/30">{shortestFlight.airline} {shortestFlight.flightNumber}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-white tabular-nums font-display">{Math.round(shortestFlight.distance || 0).toLocaleString()} <span className="text-xs text-white/40">mi</span></p>
              </div>
            </div>
            <div className="glass-card !p-4">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2">Longest flight</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/15 flex items-center justify-center">
                    <Plane className="w-3.5 h-3.5 text-teal-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{longestFlight.departureCity} <ArrowRight className="w-3 h-3 inline text-white/30" /> {longestFlight.arrivalCity}</p>
                    <p className="text-[10px] text-white/30">{longestFlight.airline} {longestFlight.flightNumber}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-white tabular-nums font-display">{Math.round(longestFlight.distance || 0).toLocaleString()} <span className="text-xs text-white/40">mi</span></p>
              </div>
            </div>
          </div>
        )}

        {/* Monthly sparkline */}
        <SectionHeader title="Monthly Activity" />
        <div className="glass-card mb-4">
          <div className="flex items-end gap-[4px] h-20">
            {monthCounts.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-0.5 h-full justify-end">
                <div
                  className="w-full rounded-t min-h-[2px] transition-all"
                  style={{
                    height: count > 0 ? `${Math.max((count / maxMonth) * 100, 10)}%` : "2px",
                    background: count > 0 ? "linear-gradient(180deg, #14B8A6, #0D9488)" : "rgba(255,255,255,0.04)",
                  }}
                />
                <span className="text-[7px] text-white/25 font-medium">{monthLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Airports */}
        <SectionHeader title="Top Visited Airports" />
        <div className="glass-card mb-4">
          <p className="text-3xl font-extrabold text-white tabular-nums leading-none mb-0.5 font-display">{airportsSet.size}</p>
          <p className="text-xs text-white/30 mb-4">total airports</p>
          <div className="space-y-0.5">
            {topAirports.map(([code, count]) => (
              <HBar key={code} label={code} count={count} max={maxAirportCount} color="#0D9488" />
            ))}
          </div>
        </div>

        {/* Top Airlines */}
        {topAirlines.length > 0 && (
          <>
            <SectionHeader title="Top Airlines" />
            <div className="glass-card mb-4">
              <p className="text-3xl font-extrabold text-white tabular-nums leading-none mb-0.5 font-display">{airlinesSet.size}</p>
              <p className="text-xs text-white/30 mb-4">total airlines</p>
              <div className="space-y-0.5">
                {topAirlines.map(([name, count]) => (
                  <HBar key={name} label={name.length > 6 ? name.substring(0, 6) : name} count={count} max={maxAirlineCount} color="#14B8A6" />
                ))}
              </div>
            </div>
          </>
        )}

        {/* Top Routes */}
        <SectionHeader title="Top Routes" />
        <div className="glass-card mb-4">
          <p className="text-3xl font-extrabold text-white tabular-nums leading-none mb-0.5 font-display">{Object.keys(routeCounts).length}</p>
          <p className="text-xs text-white/30 mb-4">total routes</p>
          <div className="space-y-0.5">
            {topRoutes.map(([route, count]) => (
              <HBar key={route} label={route} count={count} max={maxRouteCount} color="#0D9488" />
            ))}
          </div>
        </div>

        {/* Year in Review section */}
        <SectionHeader title="Year in Review" />
        <div className="glass-card mb-4" style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.1), rgba(245,158,11,0.05))", border: "1px solid rgba(13,148,136,0.12)" }}>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-white tabular-nums font-display">{filteredTrips.length}</p>
              <p className="text-[9px] text-white/40 uppercase tracking-wider">Trips</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-extrabold text-white tabular-nums font-display">{countries.length}</p>
              <p className="text-[9px] text-white/40 uppercase tracking-wider">Countries</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-extrabold text-white tabular-nums font-display">{citiesSet.size}</p>
              <p className="text-[9px] text-white/40 uppercase tracking-wider">Cities</p>
            </div>
          </div>
          <div className="h-px mb-4" style={{ background: "linear-gradient(90deg, transparent, rgba(13,148,136,0.2), transparent)" }} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Total Distance</p>
              <p className="text-2xl font-bold text-white tabular-nums font-display">{formatDistance(totalDistance)} <span className="text-sm text-white/40">mi</span></p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider">Travel Time</p>
              <p className="text-2xl font-bold text-white tabular-nums font-display">{dur.primary} {dur.secondary}</p>
            </div>
          </div>
        </div>

        {/* Countries */}
        <SectionHeader title="Countries & Territories" />
        <div className="glass-card mb-4">
          <p className="text-3xl font-extrabold text-white tabular-nums leading-none mb-0.5 font-display">{countries.length}</p>
          <p className="text-xs text-white/30 mb-5">total</p>
          <div className="space-y-3">
            {countries.slice(0, 6).map(c => {
              const countryTrips = filteredTrips.filter(t => t.departureCountry === c || t.arrivalCountry === c).length;
              return (
                <div key={c} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{getFlag(c)}</span>
                    <span className="text-sm font-semibold text-white">{c}</span>
                  </div>
                  <span className="text-xs text-white/40 tabular-nums">{countryTrips} trips</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <div className="h-px mx-auto w-48 mb-4" style={{ background: "linear-gradient(90deg, transparent, rgba(13,148,136,0.2), transparent)" }} />
          <p className="text-[8px] font-mono text-white/15 tracking-[0.3em] uppercase">
            {selectedYear === "all" ? "ALL TIME" : selectedYear} · TRAVEL LIFE · GRANDLOOPSTUDIO.COM
          </p>
          <ChevronDown className="w-5 h-5 text-white/10 mx-auto mt-2" />
        </div>
      </div>
    </div>
  );
}
