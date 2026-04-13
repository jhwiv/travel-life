import { Link } from "wouter";
import { Plane, TrainFront, BarChart3, Image, ArrowRight, Globe, MapPin, Route, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
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

/** Animated world map SVG — simplified but vivid */
function WorldMapSVG() {
  return (
    <svg viewBox="0 0 800 400" className="absolute inset-0 w-full h-full opacity-[0.07]" aria-hidden>
      {/* Simplified continental outlines */}
      <g fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
        {/* North America */}
        <path d="M120,80 Q140,70 160,75 Q180,65 200,70 L220,80 Q240,75 250,85 L260,100 Q250,120 240,140 L230,160 Q220,170 200,175 L180,165 Q160,155 150,140 L140,120 Q130,100 120,80Z" />
        {/* South America */}
        <path d="M210,200 Q220,190 230,195 L240,210 Q245,230 240,250 L235,270 Q230,280 220,285 L210,275 Q200,260 205,240 L208,220Z" />
        {/* Europe */}
        <path d="M370,70 Q380,65 395,68 L410,75 Q420,80 425,90 L420,105 Q415,115 405,118 L390,115 Q380,110 375,100 L370,85Z" />
        {/* Africa */}
        <path d="M380,140 Q390,135 400,138 L415,150 Q420,170 418,190 L410,210 Q400,225 390,230 L380,220 Q370,200 372,180 L375,160Z" />
        {/* Asia */}
        <path d="M440,60 Q470,50 500,55 L540,65 Q570,70 590,80 L600,95 Q595,110 580,120 L560,125 Q530,130 500,125 L470,115 Q450,105 440,90Z" />
        {/* Australia */}
        <path d="M580,220 Q600,215 620,220 L635,230 Q640,240 635,250 L620,255 Q600,258 585,250 L578,240 Q575,230 580,220Z" />
      </g>
      {/* Flight arcs */}
      <g fill="none" strokeWidth="1" strokeDasharray="6,4">
        <path d="M180,100 Q300,30 400,85" stroke="rgba(56,189,248,0.4)" />
        <path d="M400,85 Q480,50 550,80" stroke="rgba(129,140,248,0.3)" />
        <path d="M180,100 Q350,180 400,140" stroke="rgba(52,211,153,0.3)" />
      </g>
      {/* City dots */}
      {[
        { x: 180, y: 100, color: "#38bdf8" },
        { x: 400, y: 85, color: "#f0d78c" },
        { x: 550, y: 80, color: "#34d399" },
        { x: 610, y: 235, color: "#f472b6" },
        { x: 230, y: 210, color: "#fb923c" },
        { x: 395, y: 170, color: "#a78bfa" },
      ].map((dot, i) => (
        <circle key={i} cx={dot.x} cy={dot.y} r="4" fill={dot.color} fillOpacity="0.6">
          <animate attributeName="r" values="4;6;4" dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" />
        </circle>
      ))}
    </svg>
  );
}

export default function Landing() {
  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/analytics"],
  });
  const { data: trips = [] } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  const hasData = analytics && analytics.totalTrips > 0;
  const recentTrips = trips.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(165deg, #0a1628 0%, #0f2341 20%, #162d50 35%, #1a3a5c 50%, #0e3347 65%, #0a2a3e 80%, #081c2e 100%)" }}>
      {/* Hero Section — full screen */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-5 py-12 overflow-hidden min-h-screen">
        {/* Background layers */}
        <WorldMapSVG />

        {/* Gradient orbs — vivid, large */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(56,189,248,0.12) 0%, transparent 70%)" }} />
          <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(129,140,248,0.1) 0%, transparent 70%)" }} />
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(52,211,153,0.06) 0%, transparent 70%)" }} />
        </div>

        {/* Subtle grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" aria-hidden>
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
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(56,189,248,0.2), rgba(129,140,248,0.15))", border: "1px solid rgba(56,189,248,0.2)" }}>
              <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8 text-sky-300" aria-label="Travel Life">
                <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 18 C10 14, 14 12, 16 10 C18 12, 22 14, 24 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <circle cx="16" cy="10" r="1.5" fill="currentColor" />
                <path d="M12 22 L16 16 L20 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <line x1="16" y1="16" x2="16" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4" style={{ background: "linear-gradient(135deg, #ffffff 0%, #e0f2fe 40%, #bae6fd 60%, #93c5fd 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Travel Life
          </h1>
          <p className="text-base md:text-lg text-sky-200/60 max-w-md mx-auto mb-8 leading-relaxed">
            Track every flight and train ride. Visualize your journeys with stunning infographics.
          </p>

          {/* CTA */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2 px-7 text-sm font-semibold shadow-lg" style={{ background: "linear-gradient(135deg, #0ea5e9, #6366f1)", border: "none" }} data-testid="button-enter-dashboard">
                {hasData ? "View Dashboard" : "Get Started"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            {hasData && (
              <Link href="/infographics">
                <Button variant="outline" size="lg" className="gap-2 px-6 text-sm font-semibold border-white/15 text-white/80 hover:bg-white/10 hover:text-white" data-testid="button-goto-infographics">
                  <Image className="w-4 h-4" />
                  Infographics
                </Button>
              </Link>
            )}
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 mb-12">
            {[
              { icon: Plane, label: "Flights", color: "#38bdf8" },
              { icon: TrainFront, label: "Trains", color: "#fbbf24" },
              { icon: BarChart3, label: "Analytics", color: "#34d399" },
              { icon: Sparkles, label: "Infographics", color: "#c084fc" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-white/70" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <Icon className="w-4 h-4" style={{ color }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Stats section — only with data */}
        {hasData && analytics && (
          <div className="relative z-10 w-full max-w-4xl mx-auto">
            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { icon: Route, value: analytics.totalTrips, label: "Trips", gradient: "linear-gradient(135deg, rgba(14,165,233,0.15), rgba(99,102,241,0.1))", borderColor: "rgba(56,189,248,0.15)", iconColor: "#38bdf8" },
                { icon: Plane, value: analytics.totalFlights, label: "Flights", gradient: "linear-gradient(135deg, rgba(59,130,246,0.15), rgba(37,99,235,0.1))", borderColor: "rgba(59,130,246,0.15)", iconColor: "#60a5fa" },
                { icon: TrainFront, value: analytics.totalTrains, label: "Train Rides", gradient: "linear-gradient(135deg, rgba(245,158,11,0.15), rgba(217,119,6,0.1))", borderColor: "rgba(245,158,11,0.15)", iconColor: "#fbbf24" },
                { icon: Globe, value: analytics.uniqueCountries, label: "Countries", gradient: "linear-gradient(135deg, rgba(168,85,247,0.15), rgba(139,92,246,0.1))", borderColor: "rgba(168,85,247,0.15)", iconColor: "#c084fc" },
              ].map(({ icon: Icon, value, label, gradient, borderColor, iconColor }) => (
                <div
                  key={label}
                  className="relative rounded-2xl p-4 text-center backdrop-blur-md transition-all hover:scale-[1.02]"
                  style={{ background: gradient, border: `1px solid ${borderColor}` }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2.5" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <Icon className="w-5 h-5" style={{ color: iconColor }} />
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-white">{value}</p>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Distance + Flags row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="rounded-2xl p-5 flex items-center gap-5 backdrop-blur-md" style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.12), rgba(6,182,212,0.08))", border: "1px solid rgba(52,211,153,0.12)" }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(52,211,153,0.15)" }}>
                  <MapPin className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-white">
                    {formatDistance(analytics.totalDistance)} <span className="text-sm font-normal text-white/40">miles</span>
                  </p>
                  <p className="text-xs text-white/40">
                    {formatDuration(analytics.totalDuration)} travel time · {analytics.uniqueCities} cities
                  </p>
                </div>
              </div>

              {analytics.countries.length > 0 && (
                <div className="rounded-2xl p-5 flex items-center gap-3 backdrop-blur-md" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
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
              <div className="rounded-2xl p-5 backdrop-blur-md" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] text-white/40 uppercase tracking-wider font-medium">Recent Journeys</p>
                  <Link href="/trips">
                    <span className="text-[11px] text-sky-400 hover:text-sky-300 cursor-pointer font-medium">View all →</span>
                  </Link>
                </div>
                <div className="space-y-2">
                  {recentTrips.map((trip) => (
                    <div key={trip.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: trip.type === "flight" ? "rgba(56,189,248,0.12)" : "rgba(251,191,36,0.12)" }}>
                          {trip.type === "flight" ? (
                            <Plane className="w-4 h-4 text-sky-400" />
                          ) : (
                            <TrainFront className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{trip.departureCode} → {trip.arrivalCode}</p>
                          <p className="text-[11px] text-white/35">
                            {trip.departureCity} → {trip.arrivalCity}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-white/35 tabular-nums">
                        {new Date(trip.departureDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <p className="text-[10px] text-white/25 uppercase tracking-wider">Travel Life v3.0</p>
          <p className="text-[10px] text-white/25">Flights · Trains · Analytics</p>
        </div>
      </div>
    </div>
  );
}
