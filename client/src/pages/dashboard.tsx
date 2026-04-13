import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  TrendingUp,
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
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
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
  tripsByMonth: Record<string, number>;
  topRoutes: { route: string; count: number }[];
  flightDistance: number;
  trainDistance: number;
}

const CHART_COLORS = [
  "hsl(200, 75%, 42%)",
  "hsl(35, 80%, 55%)",
  "hsl(160, 50%, 42%)",
  "hsl(280, 45%, 55%)",
  "hsl(15, 75%, 55%)",
];

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
  color,
}: {
  icon: any;
  label: string;
  value: string | number;
  suffix?: string;
  color: string;
}) {
  return (
    <Card data-testid={`kpi-${label.toLowerCase().replace(/\s/g, "-")}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg"
            style={{ backgroundColor: `${color}15`, color }}
          >
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              {label}
            </p>
            <p className="text-xl font-semibold tabular-nums">
              {value}
              {suffix && (
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {suffix}
                </span>
              )}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
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
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-72 rounded-xl" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!analytics)
    return (
      <div className="p-6 text-center text-muted-foreground">
        No data available. Add your first trip to get started.
      </div>
    );

  const yearData = Object.entries(analytics.tripsByYear)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([year, count]) => ({ year, count }));

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const monthData = monthNames.map((name, i) => ({
    month: name,
    count: analytics.tripsByMonth[String(i + 1).padStart(2, "0")] || 0,
  }));

  const typeData = [
    { name: "Flights", value: analytics.totalFlights },
    { name: "Trains", value: analytics.totalTrains },
  ].filter((d) => d.value > 0);

  const distanceData = [
    { name: "Flights", value: analytics.flightDistance },
    { name: "Trains", value: analytics.trainDistance },
  ].filter((d) => d.value > 0);

  // Recent trips
  const recentTrips = (trips || []).slice(0, 5);

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Route}
          label="Total Trips"
          value={analytics.totalTrips}
          color="hsl(200, 75%, 42%)"
        />
        <KPICard
          icon={Plane}
          label="Flights"
          value={analytics.totalFlights}
          color="hsl(200, 75%, 42%)"
        />
        <KPICard
          icon={TrainFront}
          label="Train Rides"
          value={analytics.totalTrains}
          color="hsl(35, 80%, 55%)"
        />
        <KPICard
          icon={MapPin}
          label="Distance"
          value={formatDistance(analytics.totalDistance)}
          suffix="mi"
          color="hsl(160, 50%, 42%)"
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          icon={Globe}
          label="Countries"
          value={analytics.uniqueCountries}
          color="hsl(280, 45%, 55%)"
        />
        <KPICard
          icon={MapPin}
          label="Cities"
          value={analytics.uniqueCities}
          color="hsl(15, 75%, 55%)"
        />
        <KPICard
          icon={Clock}
          label="Travel Time"
          value={formatDuration(analytics.totalDuration)}
          color="hsl(200, 75%, 42%)"
        />
        <KPICard
          icon={Building2}
          label="Airlines"
          value={analytics.uniqueAirlines}
          color="hsl(35, 80%, 55%)"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trips by Year */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Trips by Year
            </CardTitle>
          </CardHeader>
          <CardContent>
            {yearData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={yearData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 90%)" />
                  <XAxis
                    dataKey="year"
                    tick={{ fontSize: 12 }}
                    stroke="hsl(220, 8%, 46%)"
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    stroke="hsl(220, 8%, 46%)"
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(210, 15%, 90%)",
                      fontSize: 13,
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="Trips"
                    fill="hsl(200, 75%, 42%)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                No year data yet
              </p>
            )}
          </CardContent>
        </Card>

        {/* Trip Type Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Trip Type Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={220}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {typeData.map((_, index) => (
                        <Cell key={index} fill={CHART_COLORS[index]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(210, 15%, 90%)",
                        fontSize: 13,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-3">
                  {typeData.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: CHART_COLORS[i] }}
                      />
                      <span className="text-sm">{d.name}</span>
                      <span className="text-sm font-semibold tabular-nums">
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                No trips yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Second Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Trips This Year by Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(210, 15%, 90%)" />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  stroke="hsl(220, 8%, 46%)"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="hsl(220, 8%, 46%)"
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid hsl(210, 15%, 90%)",
                    fontSize: 13,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  name="Trips"
                  stroke="hsl(200, 75%, 42%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(200, 75%, 42%)", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Routes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Top Routes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.topRoutes.length > 0 ? (
              <div className="space-y-2">
                {analytics.topRoutes.slice(0, 6).map((r, i) => (
                  <div
                    key={r.route}
                    className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-medium w-5">
                        {i + 1}.
                      </span>
                      <span className="text-sm font-medium">{r.route}</span>
                    </div>
                    <Badge variant="secondary" className="tabular-nums">
                      {r.count}x
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">
                No routes yet
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Trips */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Recent Trips
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentTrips.length > 0 ? (
            <div className="space-y-2">
              {recentTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30"
                  data-testid={`recent-trip-${trip.id}`}
                >
                  <div className="flex items-center gap-3">
                    {trip.type === "flight" ? (
                      <Plane className="w-4 h-4 text-primary" />
                    ) : (
                      <TrainFront className="w-4 h-4 text-amber-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {trip.departureCode} → {trip.arrivalCode}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {trip.type === "flight"
                          ? trip.airline || "Unknown Airline"
                          : trip.trainOperator || "Train"}
                        {" · "}
                        {new Date(trip.departureDate).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric", year: "numeric" }
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm tabular-nums">
                      {trip.distance
                        ? `${Math.round(trip.distance).toLocaleString()} mi`
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatDuration(trip.duration)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">
              No trips recorded yet. Add your first trip to see it here.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
