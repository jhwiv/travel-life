import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plane,
  TrainFront,
  MapPin,
  Globe,
  Clock,
  Route,
  Building2,
  ArrowUpRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from "recharts";
import type { Trip } from "@shared/schema";
import { Link } from "wouter";

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

const CHART_COLORS = [
  "hsl(200, 75%, 50%)",
  "hsl(35, 85%, 55%)",
  "hsl(160, 55%, 45%)",
  "hsl(280, 50%, 58%)",
  "hsl(15, 80%, 58%)",
];

const countryFlags: Record<string, string> = {
  "United States": "🇺🇸", US: "🇺🇸", USA: "🇺🇸",
  "United Kingdom": "🇬🇧", UK: "🇬🇧", England: "🇬🇧",
  France: "🇫🇷", Germany: "🇩🇪", Italy: "🇮🇹", Spain: "🇪🇸",
  Netherlands: "🇳🇱", Belgium: "🇧🇪", Switzerland: "🇨🇭",
  Austria: "🇦🇹", Portugal: "🇵🇹", Ireland: "🇮🇪",
  Sweden: "🇸🇪", Norway: "🇳🇴", Denmark: "🇩🇰", Finland: "🇫🇮",
  Japan: "🇯🇵", Canada: "🇨🇦", Mexico: "🇲🇽",
};

function getFlag(c: string) { return countryFlags[c] || "🏳️"; }

function formatDuration(minutes: number) {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${minutes % 60}m`;
}

function formatDistance(miles: number) {
  if (miles >= 1000) return `${(miles / 1000).toFixed(1)}k`;
  return miles.toLocaleString();
}

function KPICard({
  icon: Icon,
  label,
  value,
  suffix,
  gradient,
  borderColor,
  iconColor,
}: {
  icon: any;
  label: string;
  value: string | number;
  suffix?: string;
  gradient: string;
  borderColor: string;
  iconColor: string;
}) {
  return (
    <div
      className="rounded-2xl p-4 hover:scale-[1.02] transition-all group"
      style={{ background: gradient, border: `1px solid ${borderColor}` }}
      data-testid={`kpi-${label.toLowerCase().replace(/\s/g, "-")}`}
    >
      <div className="flex items-start justify-between mb-3">
        <div
          className="flex items-center justify-center w-10 h-10 rounded-xl"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <Icon className="w-5 h-5" style={{ color: iconColor }} />
        </div>
        <ArrowUpRight className="w-4 h-4 text-white/0 group-hover:text-white/30 transition-colors" />
      </div>
      <p className="text-2xl font-bold tabular-nums text-foreground leading-none">
        {value}
        {suffix && (
          <span className="text-xs font-normal text-muted-foreground ml-1">
            {suffix}
          </span>
        )}
      </p>
      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-1.5">
        {label}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { data: analytics, isLoading: analyticsLoading } = useQuery<Analytics>({
    queryKey: ["/api/analytics"],
  });

  const { data: trips } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  if (analyticsLoading) {
    return (
      <div className="p-5 lg:p-8 space-y-6 min-h-screen">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics)
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <Globe className="w-12 h-12 text-muted-foreground/30 mb-4" />
        <p className="text-lg font-semibold text-foreground mb-1">No data yet</p>
        <p className="text-sm text-muted-foreground mb-6">Add your first trip to see analytics here.</p>
        <Link href="/trips">
          <span className="text-sm text-primary hover:underline cursor-pointer font-medium">Go to Trips →</span>
        </Link>
      </div>
    );

  const yearData = Object.entries(analytics.tripsByYear)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, count]) => ({ year, count }));

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthData = monthNames.map((name, i) => ({
    month: name,
    count: analytics.tripsByMonth[String(i + 1).padStart(2, "0")] || 0,
  }));

  const typeData = [
    { name: "Flights", value: analytics.totalFlights },
    { name: "Trains", value: analytics.totalTrains },
  ].filter((d) => d.value > 0);

  const recentTrips = (trips || []).slice(0, 5);

  return (
    <div className="min-h-screen pb-12">
      {/* Gradient header banner */}
      <div className="relative overflow-hidden px-5 pl-14 lg:pl-8 pr-5 lg:pr-8 pt-5 pb-8" style={{ background: "linear-gradient(135deg, hsl(200, 75%, 42%) 0%, hsl(220, 60%, 35%) 50%, hsl(260, 45%, 35%) 100%)" }}>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)" }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.04) 0%, transparent 70%)" }} />
          {/* Dot pattern */}
          <svg className="absolute inset-0 w-full h-full opacity-[0.05]" aria-hidden>
            <defs>
              <pattern id="dash-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#dash-dots)" />
          </svg>
        </div>

        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Dashboard</h2>
            <p className="text-sm text-white/60 mt-1">
              {analytics.totalTrips} trips across {analytics.uniqueCountries} countries
            </p>
          </div>
          {analytics.countries.length > 0 && (
            <div className="hidden md:flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2.5 border border-white/10">
              {analytics.countries.slice(0, 8).map((c) => (
                <span key={c} className="text-xl" title={c}>{getFlag(c)}</span>
              ))}
              {analytics.countries.length > 8 && (
                <span className="text-xs text-white/50 ml-1">+{analytics.countries.length - 8}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pl-14 lg:pl-8 pr-5 lg:pr-8 -mt-4 space-y-5">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPICard icon={Route} label="Total Trips" value={analytics.totalTrips}
            gradient="linear-gradient(135deg, hsl(200 75% 42% / 0.1), hsl(200 75% 42% / 0.05))"
            borderColor="hsl(200 75% 42% / 0.15)" iconColor="hsl(200, 75%, 50%)" />
          <KPICard icon={Plane} label="Flights" value={analytics.totalFlights}
            gradient="linear-gradient(135deg, hsl(217 91% 60% / 0.1), hsl(217 91% 60% / 0.05))"
            borderColor="hsl(217 91% 60% / 0.15)" iconColor="hsl(217, 91%, 60%)" />
          <KPICard icon={TrainFront} label="Train Rides" value={analytics.totalTrains}
            gradient="linear-gradient(135deg, hsl(38 92% 50% / 0.1), hsl(38 92% 50% / 0.05))"
            borderColor="hsl(38 92% 50% / 0.15)" iconColor="hsl(38, 92%, 50%)" />
          <KPICard icon={MapPin} label="Distance" value={formatDistance(analytics.totalDistance)} suffix="mi"
            gradient="linear-gradient(135deg, hsl(160 60% 45% / 0.1), hsl(160 60% 45% / 0.05))"
            borderColor="hsl(160 60% 45% / 0.15)" iconColor="hsl(160, 60%, 45%)" />
          <KPICard icon={Globe} label="Countries" value={analytics.uniqueCountries}
            gradient="linear-gradient(135deg, hsl(271 70% 55% / 0.1), hsl(271 70% 55% / 0.05))"
            borderColor="hsl(271 70% 55% / 0.15)" iconColor="hsl(271, 70%, 55%)" />
          <KPICard icon={MapPin} label="Cities" value={analytics.uniqueCities}
            gradient="linear-gradient(135deg, hsl(350 70% 55% / 0.1), hsl(350 70% 55% / 0.05))"
            borderColor="hsl(350 70% 55% / 0.15)" iconColor="hsl(350, 70%, 55%)" />
          <KPICard icon={Clock} label="Travel Time" value={formatDuration(analytics.totalDuration)}
            gradient="linear-gradient(135deg, hsl(195 75% 50% / 0.1), hsl(195 75% 50% / 0.05))"
            borderColor="hsl(195 75% 50% / 0.15)" iconColor="hsl(195, 75%, 50%)" />
          <KPICard icon={Building2} label="Operators" value={analytics.uniqueAirlines + analytics.uniqueTrainOperators} suffix={`${analytics.uniqueAirlines} air · ${analytics.uniqueTrainOperators} rail`}
            gradient="linear-gradient(135deg, hsl(25 80% 55% / 0.1), hsl(25 80% 55% / 0.05))"
            borderColor="hsl(25 80% 55% / 0.15)" iconColor="hsl(25, 80%, 55%)" />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Trips by Year */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-4">
              Trips by Year
            </p>
            {yearData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={yearData} barCategoryGap="30%">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} className="fill-muted-foreground" stroke="currentColor" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" stroke="currentColor" allowDecimals={false} width={28} />
                  <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                  <Bar dataKey="count" name="Trips" fill="hsl(200, 75%, 50%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No year data yet</p>
            )}
          </div>

          {/* Trip Type Distribution */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-4">
              Trip Type Distribution
            </p>
            {typeData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="55%" height={220}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {typeData.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))", fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-4">
                  {typeData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: CHART_COLORS[i] }} />
                      <div>
                        <p className="text-sm font-semibold tabular-nums">{d.value}</p>
                        <p className="text-[11px] text-muted-foreground">{d.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No trips yet</p>
            )}
          </div>
        </div>

        {/* Second Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Monthly Trend */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-4">
              Trips This Year by Month
            </p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthData} barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} className="fill-muted-foreground" stroke="currentColor" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" stroke="currentColor" allowDecimals={false} width={24} />
                <Tooltip contentStyle={{ borderRadius: "12px", border: "1px solid hsl(var(--border))", backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }} />
                <Bar dataKey="count" name="Trips" fill="hsl(35, 85%, 55%)" radius={[5, 5, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Top Routes */}
          <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                Top Routes
              </p>
              <Link href="/trips">
                <span className="text-[11px] text-primary hover:underline cursor-pointer font-medium">View all</span>
              </Link>
            </div>
            {analytics.topRoutes.length > 0 ? (
              <div className="space-y-1.5">
                {analytics.topRoutes.slice(0, 6).map((r, i) => (
                  <div
                    key={r.route}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-bold w-5 tabular-nums">
                        {i + 1}.
                      </span>
                      <span className="text-sm font-semibold">{r.route}</span>
                    </div>
                    <Badge variant="secondary" className="tabular-nums text-[11px] px-2 py-0.5 rounded-lg">
                      {r.count}x
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">No routes yet</p>
            )}
          </div>
        </div>

        {/* Recent Trips */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
              Recent Trips
            </p>
            <Link href="/trips">
              <span className="text-[11px] text-primary hover:underline cursor-pointer font-medium">View all</span>
            </Link>
          </div>
          {recentTrips.length > 0 ? (
            <div className="space-y-2">
              {recentTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center justify-between py-3 px-4 rounded-xl bg-muted/25 dark:bg-muted/15 hover:bg-muted/40 dark:hover:bg-muted/25 transition-colors"
                  data-testid={`recent-trip-${trip.id}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      trip.type === "flight"
                        ? "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"
                        : "bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400"
                    }`}>
                      {trip.type === "flight" ? <Plane className="w-4 h-4" /> : <TrainFront className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {trip.departureCode} → {trip.arrivalCode}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {trip.type === "flight"
                          ? trip.airline || "Unknown Airline"
                          : trip.trainOperator || "Train"}
                        {" · "}
                        {new Date(trip.departureDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm tabular-nums font-medium">
                      {trip.distance ? `${Math.round(trip.distance).toLocaleString()} mi` : "—"}
                    </p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {formatDuration(trip.duration)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No trips recorded yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
