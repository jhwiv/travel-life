import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Plane, TrainFront, Globe, MapPin, Clock, Route, Building2 } from "lucide-react";
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
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${minutes % 60}m`;
}

// Country code to flag emoji mapping
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

type InfographicType =
  | "travel-passport"
  | "flight-summary"
  | "train-summary"
  | "year-in-review"
  | "top-routes";

function TravelPassport({
  analytics,
  trips,
  year,
}: {
  analytics: Analytics;
  trips: Trip[];
  year: string;
}) {
  const filtered = year === "all"
    ? trips.filter((t) => t.status === "completed")
    : trips.filter(
        (t) =>
          t.status === "completed" && t.departureDate.startsWith(year)
      );
  const flights = filtered.filter((t) => t.type === "flight");
  const trains = filtered.filter((t) => t.type === "train");
  const distance = filtered.reduce((s, t) => s + (t.distance || 0), 0);
  const duration = filtered.reduce((s, t) => s + t.duration, 0);

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

  const uniqueCountries = Array.from(countries);

  return (
    <div className="infographic-card rounded-2xl p-6 text-white min-h-[480px] flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">MY TRAVEL PASSPORT</h2>
            <p className="text-xs opacity-70 tracking-widest uppercase">
              Passport · Pass · Pasaporte
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
            <Globe className="w-6 h-6" />
          </div>
        </div>

        {/* Country Flags */}
        {uniqueCountries.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-6">
            {uniqueCountries.map((c) => (
              <span key={c} className="text-xl" title={c}>
                {getFlag(c)}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div>
        <div className="grid grid-cols-2 gap-y-4 gap-x-6 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">Flights</p>
            <p className="text-3xl font-bold tabular-nums">{flights.length}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">
              Train Rides
            </p>
            <p className="text-3xl font-bold tabular-nums">{trains.length}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">
              Total Distance
            </p>
            <p className="text-2xl font-bold tabular-nums">
              {Math.round(distance).toLocaleString()}{" "}
              <span className="text-sm font-normal opacity-70">mi</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">
              Travel Time
            </p>
            <p className="text-2xl font-bold tabular-nums">
              {formatDuration(duration)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">Stations</p>
            <p className="text-xl font-bold tabular-nums">{stations.size}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">Airlines</p>
            <p className="text-xl font-bold tabular-nums">{airlines.size}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">Countries</p>
            <p className="text-xl font-bold tabular-nums">{uniqueCountries.length}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/20">
          <p className="text-[9px] font-mono tracking-[0.2em] opacity-50 uppercase">
            {year === "all" ? "ALL TIME" : year} · TRAVEL LIFE ·{" "}
            {new Date().toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>
    </div>
  );
}

function FlightSummary({ trips, year }: { trips: Trip[]; year: string }) {
  const filtered =
    year === "all"
      ? trips.filter((t) => t.type === "flight" && t.status === "completed")
      : trips.filter(
          (t) =>
            t.type === "flight" &&
            t.status === "completed" &&
            t.departureDate.startsWith(year)
        );

  const distance = filtered.reduce((s, t) => s + (t.distance || 0), 0);
  const duration = filtered.reduce((s, t) => s + t.duration, 0);
  const airlines = new Set<string>();
  const airports = new Set<string>();
  filtered.forEach((t) => {
    airports.add(t.departureCode);
    airports.add(t.arrivalCode);
    if (t.airline) airlines.add(t.airline);
  });

  return (
    <div className="infographic-card-ocean rounded-2xl p-6 text-white min-h-[480px] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">FLIGHT SUMMARY</h2>
            <p className="text-xs opacity-70 tracking-widest uppercase">
              {year === "all" ? "All Time" : year} · Miles in the Sky
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
            <Plane className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div>
        <div className="grid grid-cols-2 gap-y-5 gap-x-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">Flights</p>
            <p className="text-4xl font-bold tabular-nums">{filtered.length}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">
              Flight Distance
            </p>
            <p className="text-3xl font-bold tabular-nums">
              {Math.round(distance).toLocaleString()}{" "}
              <span className="text-sm font-normal opacity-70">mi</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">
              Flight Time
            </p>
            <p className="text-3xl font-bold tabular-nums">
              {formatDuration(duration)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">Airports</p>
            <p className="text-4xl font-bold tabular-nums">{airports.size}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] uppercase tracking-widest opacity-60">Airlines</p>
            <p className="text-xl font-bold tabular-nums">{airlines.size}</p>
            {airlines.size > 0 && (
              <p className="text-xs opacity-60 mt-1">
                {Array.from(airlines).slice(0, 5).join(" · ")}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/20">
          <p className="text-[9px] font-mono tracking-[0.2em] opacity-50 uppercase">
            {year === "all" ? "ALL TIME" : year} · TRAVEL LIFE · FLIGHTS
          </p>
        </div>
      </div>
    </div>
  );
}

function TrainSummary({ trips, year }: { trips: Trip[]; year: string }) {
  const filtered =
    year === "all"
      ? trips.filter((t) => t.type === "train" && t.status === "completed")
      : trips.filter(
          (t) =>
            t.type === "train" &&
            t.status === "completed" &&
            t.departureDate.startsWith(year)
        );

  const distance = filtered.reduce((s, t) => s + (t.distance || 0), 0);
  const duration = filtered.reduce((s, t) => s + t.duration, 0);
  const operators = new Set<string>();
  const stations = new Set<string>();
  const countries = new Set<string>();
  filtered.forEach((t) => {
    stations.add(t.departureCode);
    stations.add(t.arrivalCode);
    countries.add(t.departureCountry);
    countries.add(t.arrivalCountry);
    if (t.trainOperator) operators.add(t.trainOperator);
  });

  return (
    <div className="infographic-card-forest rounded-2xl p-6 text-white min-h-[480px] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">RAIL JOURNEYS</h2>
            <p className="text-xs opacity-70 tracking-widest uppercase">
              {year === "all" ? "All Time" : year} · Tracks Across Europe
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
            <TrainFront className="w-6 h-6" />
          </div>
        </div>

        {/* Country flags for train trips */}
        {countries.size > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {Array.from(countries).map((c) => (
              <span key={c} className="text-xl" title={c}>
                {getFlag(c)}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="grid grid-cols-2 gap-y-5 gap-x-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">
              Train Rides
            </p>
            <p className="text-4xl font-bold tabular-nums">{filtered.length}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">Distance</p>
            <p className="text-3xl font-bold tabular-nums">
              {Math.round(distance).toLocaleString()}{" "}
              <span className="text-sm font-normal opacity-70">mi</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">
              Travel Time
            </p>
            <p className="text-3xl font-bold tabular-nums">
              {formatDuration(duration)}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">Stations</p>
            <p className="text-4xl font-bold tabular-nums">{stations.size}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] uppercase tracking-widest opacity-60">Operators</p>
            <p className="text-xl font-bold tabular-nums">{operators.size}</p>
            {operators.size > 0 && (
              <p className="text-xs opacity-60 mt-1">
                {Array.from(operators).slice(0, 5).join(" · ")}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/20">
          <p className="text-[9px] font-mono tracking-[0.2em] opacity-50 uppercase">
            {year === "all" ? "ALL TIME" : year} · TRAVEL LIFE · RAIL
          </p>
        </div>
      </div>
    </div>
  );
}

function YearInReview({ trips, year }: { trips: Trip[]; year: string }) {
  const displayYear = year === "all" ? new Date().getFullYear().toString() : year;
  const filtered = trips.filter(
    (t) =>
      t.status === "completed" && t.departureDate.startsWith(displayYear)
  );
  const flights = filtered.filter((t) => t.type === "flight");
  const trains = filtered.filter((t) => t.type === "train");
  const distance = filtered.reduce((s, t) => s + (t.distance || 0), 0);
  const countries = new Set<string>();
  filtered.forEach((t) => {
    countries.add(t.departureCountry);
    countries.add(t.arrivalCountry);
  });

  // Monthly breakdown
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthCounts = monthNames.map((_, i) => {
    const m = String(i + 1).padStart(2, "0");
    return filtered.filter((t) => t.departureDate.substring(5, 7) === m).length;
  });
  const maxMonth = Math.max(...monthCounts, 1);

  return (
    <div className="infographic-card-sunset rounded-2xl p-6 text-white min-h-[480px] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-xl font-bold tracking-tight">{displayYear} IN REVIEW</h2>
            <p className="text-xs opacity-70 tracking-widest uppercase">
              Year at a Glance
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
            <Route className="w-6 h-6" />
          </div>
        </div>

        {/* Mini bar chart */}
        <div className="flex items-end gap-1 h-16 mb-5">
          {monthCounts.map((count, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className="w-full bg-white/30 rounded-sm min-h-[2px]"
                style={{
                  height: `${(count / maxMonth) * 100}%`,
                  backgroundColor: count > 0 ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.15)",
                }}
              />
              <span className="text-[8px] opacity-50">{monthNames[i][0]}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="grid grid-cols-3 gap-y-4 gap-x-4">
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">Trips</p>
            <p className="text-3xl font-bold tabular-nums">{filtered.length}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">Flights</p>
            <p className="text-3xl font-bold tabular-nums">{flights.length}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">Trains</p>
            <p className="text-3xl font-bold tabular-nums">{trains.length}</p>
          </div>
          <div className="col-span-2">
            <p className="text-[10px] uppercase tracking-widest opacity-60">Distance</p>
            <p className="text-2xl font-bold tabular-nums">
              {Math.round(distance).toLocaleString()}{" "}
              <span className="text-sm font-normal opacity-70">mi</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest opacity-60">Countries</p>
            <p className="text-3xl font-bold tabular-nums">{countries.size}</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-white/20">
          <p className="text-[9px] font-mono tracking-[0.2em] opacity-50 uppercase">
            {displayYear} · TRAVEL LIFE · YEAR IN REVIEW
          </p>
        </div>
      </div>
    </div>
  );
}

function TopRoutes({ analytics, year }: { analytics: Analytics; year: string }) {
  return (
    <div className="infographic-card-warm rounded-2xl p-6 text-white min-h-[480px] flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight">TOP ROUTES</h2>
            <p className="text-xs opacity-70 tracking-widest uppercase">
              {year === "all" ? "All Time" : year} · Most Traveled
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2">
            <MapPin className="w-6 h-6" />
          </div>
        </div>

        <div className="space-y-3">
          {analytics.topRoutes.length > 0 ? (
            analytics.topRoutes.slice(0, 8).map((r, i) => {
              const maxCount = analytics.topRoutes[0].count;
              return (
                <div key={r.route}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">
                      <span className="opacity-50 mr-2">{i + 1}.</span>
                      {r.route}
                    </span>
                    <span className="text-sm font-bold tabular-nums">{r.count}x</span>
                  </div>
                  <div className="h-1.5 bg-white/15 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/60 rounded-full transition-all"
                      style={{ width: `${(r.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm opacity-60 text-center py-8">
              No routes recorded yet
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-white/20">
        <p className="text-[9px] font-mono tracking-[0.2em] opacity-50 uppercase">
          {year === "all" ? "ALL TIME" : year} · TRAVEL LIFE · TOP ROUTES
        </p>
      </div>
    </div>
  );
}

export default function Infographics() {
  const infographicRef = useRef<HTMLDivElement>(null);
  const [selectedType, setSelectedType] = useState<InfographicType>("travel-passport");
  const [selectedYear, setSelectedYear] = useState("all");

  const { data: analytics } = useQuery<Analytics>({
    queryKey: ["/api/analytics"],
  });

  const { data: trips = [] } = useQuery<Trip[]>({
    queryKey: ["/api/trips"],
  });

  // Get available years from trips
  const years = Array.from(
    new Set(trips.map((t) => t.departureDate.substring(0, 4)))
  ).sort((a, b) => b.localeCompare(a));

  const handleDownload = async () => {
    if (!infographicRef.current) return;
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(infographicRef.current, {
        backgroundColor: null,
        scale: 2,
        useCORS: true,
      });
      const link = document.createElement("a");
      link.download = `travel-life-${selectedType}-${selectedYear}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Download failed:", err);
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
    { value: "flight-summary", label: "Flight Summary" },
    { value: "train-summary", label: "Rail Journeys" },
    { value: "year-in-review", label: "Year in Review" },
    { value: "top-routes", label: "Top Routes" },
  ];

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold">Infographics</h2>
          <p className="text-sm text-muted-foreground">
            Generate shareable travel summaries
          </p>
        </div>
        <Button
          onClick={handleDownload}
          variant="outline"
          size="sm"
          data-testid="button-download"
        >
          <Download className="w-4 h-4 mr-1" /> Download PNG
        </Button>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <Select
          value={selectedType}
          onValueChange={(v) => setSelectedType(v as InfographicType)}
        >
          <SelectTrigger className="w-48" data-testid="select-infographic-type">
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
          <SelectTrigger className="w-32" data-testid="select-year">
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
            <TravelPassport
              analytics={analytics}
              trips={trips}
              year={selectedYear}
            />
          )}
          {selectedType === "flight-summary" && (
            <FlightSummary trips={trips} year={selectedYear} />
          )}
          {selectedType === "train-summary" && (
            <TrainSummary trips={trips} year={selectedYear} />
          )}
          {selectedType === "year-in-review" && (
            <YearInReview trips={trips} year={selectedYear} />
          )}
          {selectedType === "top-routes" && (
            <TopRoutes analytics={analytics} year={selectedYear} />
          )}
        </div>
      </div>
    </div>
  );
}
