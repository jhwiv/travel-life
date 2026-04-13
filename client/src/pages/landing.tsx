import { Link } from "wouter";
import { Plane, TrainFront, BarChart3, Image, ArrowRight, Globe, MapPin, Route } from "lucide-react";
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

/** Animated globe SVG */
function GlobeSVG() {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" aria-hidden>
      <defs>
        <linearGradient id="globe-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(200, 75%, 42%)" stopOpacity="0.15" />
          <stop offset="100%" stopColor="hsl(200, 75%, 42%)" stopOpacity="0.03" />
        </linearGradient>
        <linearGradient id="line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="hsl(200, 75%, 42%)" stopOpacity="0" />
          <stop offset="50%" stopColor="hsl(200, 75%, 42%)" stopOpacity="0.4" />
          <stop offset="100%" stopColor="hsl(200, 75%, 42%)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Outer circle */}
      <circle cx="100" cy="100" r="90" fill="url(#globe-grad)" stroke="hsl(200, 75%, 42%)" strokeWidth="0.5" strokeOpacity="0.15" />
      {/* Latitude lines */}
      {[30, 60, 90, 120, 150].map((y) => (
        <ellipse key={y} cx="100" cy={y} rx={Math.sqrt(90 * 90 - (y - 100) * (y - 100))} ry="3" fill="none" stroke="url(#line-grad)" strokeWidth="0.5" />
      ))}
      {/* Longitude curves */}
      {[-40, -20, 0, 20, 40].map((offset) => (
        <ellipse key={offset} cx={100 + offset} cy="100" rx="8" ry="88" fill="none" stroke="url(#line-grad)" strokeWidth="0.5" />
      ))}
      {/* Dots for cities */}
      <circle cx="55" cy="65" r="3" fill="hsl(200, 75%, 42%)" fillOpacity="0.6">
        <animate attributeName="r" values="3;4;3" dur="3s" repeatCount="indefinite" />
      </circle>
      <circle cx="130" cy="75" r="3" fill="hsl(35, 80%, 55%)" fillOpacity="0.6">
        <animate attributeName="r" values="3;4;3" dur="3.5s" repeatCount="indefinite" />
      </circle>
      <circle cx="110" cy="120" r="3" fill="hsl(160, 50%, 42%)" fillOpacity="0.6">
        <animate attributeName="r" values="3;4;3" dur="2.8s" repeatCount="indefinite" />
      </circle>
      {/* Flight arc */}
      <path d="M55,65 Q90,30 130,75" fill="none" stroke="hsl(200, 75%, 42%)" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="4,3" />
      {/* Train route */}
      <path d="M130,75 Q125,95 110,120" fill="none" stroke="hsl(35, 80%, 55%)" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="4,3" />
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
  const recentTrips = trips.slice(0, 3);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Hero section */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-16 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Gradient orbs */}
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/[0.04] blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-amber-500/[0.03] blur-3xl" />
          {/* Subtle grid */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.03]" aria-hidden>
            <defs>
              <pattern id="hero-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M60 0 L0 0 0 60" fill="none" stroke="currentColor" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-grid)" />
          </svg>
        </div>

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          {/* Globe illustration */}
          <div className="w-40 h-40 mx-auto mb-6 opacity-80 dark:opacity-60">
            <GlobeSVG />
          </div>

          {/* Logo + Title */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <svg viewBox="0 0 32 32" fill="none" className="w-10 h-10 text-primary" aria-label="Travel Life">
              <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 18 C10 14, 14 12, 16 10 C18 12, 22 14, 24 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <circle cx="16" cy="10" r="1.5" fill="currentColor" />
              <path d="M12 22 L16 16 L20 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
              <line x1="16" y1="16" x2="16" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Travel Life
            </h1>
          </div>
          <p className="text-sm md:text-lg text-muted-foreground max-w-sm md:max-w-md mx-auto mb-10 leading-relaxed px-2">
            Track every flight and train ride. Visualize your journeys with beautiful infographics and analytics.
          </p>

          {/* CTA */}
          <div className="flex items-center justify-center gap-3 mb-12">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2 px-6 text-sm font-semibold shadow-md" data-testid="button-enter-dashboard">
                {hasData ? "View Dashboard" : "Get Started"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            {hasData && (
              <Link href="/infographics">
                <Button variant="outline" size="lg" className="gap-2 px-6 text-sm font-semibold" data-testid="button-goto-infographics">
                  <Image className="w-4 h-4" />
                  Infographics
                </Button>
              </Link>
            )}
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-14">
            {[
              { icon: Plane, label: "Flights", color: "text-primary" },
              { icon: TrainFront, label: "Trains", color: "text-amber-500" },
              { icon: BarChart3, label: "Analytics", color: "text-emerald-500" },
              { icon: Image, label: "Infographics", color: "text-purple-500" },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} className="flex items-center gap-2 px-4 py-2 rounded-full bg-muted/60 dark:bg-muted/40 border border-border/50 text-sm font-medium text-muted-foreground">
                <Icon className={`w-4 h-4 ${color}`} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Live stats — only show if user has data */}
        {hasData && analytics && (
          <div className="relative z-10 w-full max-w-4xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
              {[
                { icon: Route, value: analytics.totalTrips, label: "Trips", color: "bg-primary/10 text-primary dark:bg-primary/15" },
                { icon: Plane, value: analytics.totalFlights, label: "Flights", color: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" },
                { icon: TrainFront, value: analytics.totalTrains, label: "Train Rides", color: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400" },
                { icon: Globe, value: analytics.uniqueCountries, label: "Countries", color: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400" },
              ].map(({ icon: Icon, value, label, color }) => (
                <div key={label} className="relative group rounded-2xl border border-border/60 bg-card/80 dark:bg-card/60 backdrop-blur-sm p-4 text-center transition-all hover:shadow-md hover:border-border">
                  <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mx-auto mb-2.5`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-foreground">{value}</p>
                  <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            {/* Distance + Countries row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {/* Distance card */}
              <div className="rounded-2xl border border-border/60 bg-card/80 dark:bg-card/60 backdrop-blur-sm p-5 flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {formatDistance(analytics.totalDistance)} <span className="text-sm font-normal text-muted-foreground">miles</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDuration(analytics.totalDuration)} total travel time · {analytics.uniqueCities} cities
                  </p>
                </div>
              </div>

              {/* Country flags card */}
              {analytics.countries.length > 0 && (
                <div className="rounded-2xl border border-border/60 bg-card/80 dark:bg-card/60 backdrop-blur-sm p-5 flex items-center gap-4">
                  <div className="flex flex-wrap gap-2">
                    {analytics.countries.map((c) => (
                      <span key={c} className="text-2xl" title={c}>
                        {getFlag(c)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recent trips preview */}
            {recentTrips.length > 0 && (
              <div className="mt-4 rounded-2xl border border-border/60 bg-card/80 dark:bg-card/60 backdrop-blur-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Recent Journeys</p>
                  <Link href="/trips">
                    <span className="text-xs text-primary hover:underline cursor-pointer font-medium">View all</span>
                  </Link>
                </div>
                <div className="space-y-2">
                  {recentTrips.map((trip) => (
                    <div key={trip.id} className="flex items-center justify-between py-2 px-3 rounded-xl bg-muted/30 dark:bg-muted/20">
                      <div className="flex items-center gap-3">
                        {trip.type === "flight" ? (
                          <Plane className="w-4 h-4 text-primary" />
                        ) : (
                          <TrainFront className="w-4 h-4 text-amber-500" />
                        )}
                        <div>
                          <p className="text-sm font-semibold">{trip.departureCode} → {trip.arrivalCode}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {trip.departureCity} → {trip.arrivalCity}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground tabular-nums">
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
      <div className="px-6 py-4 border-t border-border/40">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Travel Life v2.0</p>
          <p className="text-[10px] text-muted-foreground">Flights · Trains · Analytics</p>
        </div>
      </div>
    </div>
  );
}
