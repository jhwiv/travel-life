import { useState, useRef, useCallback } from "react";
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
  ChevronUp,
  Printer,
  Download,
  FileJson,
  FileSpreadsheet,
  Image,
  X,
  Stamp,
  BookOpen,
  Table2,
} from "lucide-react";
import type { Trip } from "@shared/schema";
import { Link } from "wouter";
import { getTrips, computeAnalytics } from "@/lib/static-data";
import FlightMap from "@/components/flight-map";
import { getFlag } from "@/lib/country-flags";
import { AIRPORTS } from "@/lib/airport-data";
import { AIRLINE_CODES } from "@/lib/airline-codes";
import { motion, AnimatePresence } from "framer-motion";

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

function formatDuration(minutes: number) {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return { primary: `${days}d`, secondary: `${hours}h` };
  return { primary: `${hours}h`, secondary: `${mins}m` };
}

function formatDurationFull(minutes: number) {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  const mins = minutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${mins}m`;
}

function formatDistance(miles: number) {
  if (miles >= 1000) return `${Math.round(miles).toLocaleString()}`;
  return miles.toLocaleString();
}

/* ─── Horizontal Bar ─── */
function HBar({ label, count, max, color = "#0D9488" }: { label: string; count: number; max: number; color?: string }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3 py-1.5">
      <span className="text-xs font-bold text-white/80 w-12 shrink-0 text-right tabular-nums print:text-slate-700">{label}</span>
      <div className="flex-1 h-5 bg-white/[0.04] rounded overflow-hidden print:bg-slate-100">
        <div className="h-full rounded transition-all duration-500" style={{ width: `${Math.max(pct, 2)}%`, background: color }} />
      </div>
      <span className="text-xs font-bold text-white/70 w-8 tabular-nums print:text-slate-600">{count}</span>
    </div>
  );
}

/* ─── Section Header ─── */
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between mb-3 mt-6">
      <h3 className="text-base font-bold text-white font-display print:text-slate-900">{title}</h3>
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

/* ─── Expandable Card Wrapper ─── */
function ExpandableCard({
  title,
  children,
  expandedContent,
  cardRef,
  className = "",
  style,
}: {
  title?: string;
  children: React.ReactNode;
  expandedContent: React.ReactNode;
  cardRef?: React.Ref<HTMLDivElement>;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      ref={cardRef}
      className={`glass-card cursor-pointer transition-all print:!bg-white print:!border-teal-200 print:!shadow-sm ${className}`}
      style={style}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">{children}</div>
        <button
          className="text-white/30 hover:text-white/60 transition-colors mt-1 shrink-0 ml-2 print:text-slate-400"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mt-4 pt-4 border-t border-white/10 print:border-teal-200">
              {expandedContent}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Export Dropdown ─── */
function ExportMenu({
  onPrint,
  onCSV,
  onJSON,
  onImage,
}: {
  onPrint: () => void;
  onCSV: () => void;
  onJSON: () => void;
  onImage: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative print:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 transition-all"
      >
        <Download className="w-3.5 h-3.5" />
        Export
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute right-0 top-full mt-2 z-50 bg-slate-800 border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[180px]"
            >
              <button onClick={() => { onPrint(); setOpen(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors">
                <Printer className="w-4 h-4 text-teal-400" /> Print
              </button>
              <button onClick={() => { onCSV(); setOpen(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors">
                <FileSpreadsheet className="w-4 h-4 text-teal-400" /> Export CSV
              </button>
              <button onClick={() => { onJSON(); setOpen(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors">
                <FileJson className="w-4 h-4 text-teal-400" /> Export JSON
              </button>
              <button onClick={() => { onImage(); setOpen(false); }} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors">
                <Image className="w-4 h-4 text-teal-400" /> Share as Image
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Printable Overlay ─── */
function PrintableOverlay({
  type,
  trips,
  countries,
  selectedYear,
  onClose,
}: {
  type: "passport" | "year-review" | "flight-log";
  trips: Trip[];
  countries: string[];
  selectedYear: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handlePrint = () => window.print();

  const handleImage = async () => {
    if (!ref.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(ref.current, { backgroundColor: "#ffffff", scale: 2, useCORS: true });
    const link = document.createElement("a");
    link.download = `travel-life-${type}-${selectedYear}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const flights = trips.filter(t => t.type === "flight");
  const totalDistance = trips.reduce((s, t) => s + (t.distance || 0), 0);
  const totalDuration = trips.reduce((s, t) => s + t.duration, 0);
  const airportsSet = new Set<string>();
  const airlinesSet = new Set<string>();
  trips.forEach(t => {
    airportsSet.add(t.departureCode);
    airportsSet.add(t.arrivalCode);
    if (t.airline) airlinesSet.add(t.airline);
  });

  // Country visit data with dates
  const countryVisits: Record<string, string[]> = {};
  trips.forEach(t => {
    const depDate = t.departureDate;
    [t.departureCountry, t.arrivalCountry].forEach(c => {
      if (!countryVisits[c]) countryVisits[c] = [];
      if (!countryVisits[c].includes(depDate)) countryVisits[c].push(depDate);
    });
  });

  // Top routes
  const routeCounts: Record<string, number> = {};
  trips.forEach(t => {
    const r = `${t.departureCode}-${t.arrivalCode}`;
    routeCounts[r] = (routeCounts[r] || 0) + 1;
  });
  const topRoutes = Object.entries(routeCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-8 print:!bg-transparent print:!p-0 print:!static">
      <div className="relative w-full max-w-2xl mx-4 print:mx-0 print:max-w-none">
        {/* Action bar */}
        <div className="flex items-center justify-end gap-2 mb-3 print:hidden">
          <button onClick={handlePrint} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 transition-all">
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          <button onClick={handleImage} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-500/15 text-teal-300 hover:bg-teal-500/25 transition-all">
            <Image className="w-3.5 h-3.5" /> Save Image
          </button>
          <button onClick={onClose} className="p-1.5 rounded-full text-white/40 hover:text-white/80 hover:bg-white/10 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable content */}
        <div ref={ref} className="bg-white rounded-2xl shadow-2xl overflow-hidden print:!rounded-none print:!shadow-none">
          {type === "passport" && (
            <div className="p-8">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 mb-2">
                  <Stamp className="w-6 h-6 text-teal-600" />
                  <h1 className="text-2xl font-extrabold text-slate-900 font-display tracking-tight">TRAVEL PASSPORT</h1>
                </div>
                <p className="text-xs text-slate-400 uppercase tracking-[0.3em]">{selectedYear === "all" ? "All Time" : selectedYear} · Travel Life</p>
                <div className="h-0.5 w-24 mx-auto mt-3 bg-gradient-to-r from-transparent via-teal-500 to-transparent" />
              </div>
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 rounded-xl bg-teal-50 border border-teal-100">
                  <p className="text-3xl font-extrabold text-teal-700 font-display">{countries.length}</p>
                  <p className="text-[10px] text-teal-500 uppercase tracking-wider mt-1">Countries</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-teal-50 border border-teal-100">
                  <p className="text-3xl font-extrabold text-teal-700 font-display">{trips.length}</p>
                  <p className="text-[10px] text-teal-500 uppercase tracking-wider mt-1">Trips</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-teal-50 border border-teal-100">
                  <p className="text-3xl font-extrabold text-teal-700 font-display">{formatDistance(totalDistance)}</p>
                  <p className="text-[10px] text-teal-500 uppercase tracking-wider mt-1">Miles</p>
                </div>
              </div>
              <h2 className="text-sm font-bold text-slate-900 mb-4 uppercase tracking-wider">Passport Stamps</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(countryVisits).sort((a, b) => b[1].length - a[1].length).map(([country, dates]) => (
                  <div key={country} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <span className="text-2xl">{getFlag(country)}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate">{country}</p>
                      <p className="text-[10px] text-slate-400">{dates.length} visit{dates.length > 1 ? "s" : ""} · {dates.sort()[0]?.slice(0, 7)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-4 border-t border-slate-200 text-center">
                <p className="text-[8px] text-slate-300 uppercase tracking-[0.3em]">Travel Life · grandloopstudio.com</p>
              </div>
            </div>
          )}

          {type === "year-review" && (
            <div className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900 font-display tracking-tight mb-1">
                  {selectedYear === "all" ? "ALL TIME" : selectedYear}
                </h1>
                <p className="text-sm text-teal-600 font-semibold uppercase tracking-[0.2em]">Year in Review</p>
                <div className="h-0.5 w-24 mx-auto mt-3 bg-gradient-to-r from-transparent via-teal-500 to-transparent" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                {[
                  { value: trips.length, label: "Total Trips" },
                  { value: flights.length, label: "Flights" },
                  { value: formatDistance(totalDistance), label: "Miles" },
                  { value: countries.length, label: "Countries" },
                  { value: airportsSet.size, label: "Airports" },
                  { value: airlinesSet.size, label: "Airlines" },
                  { value: formatDurationFull(totalDuration), label: "Travel Time" },
                  { value: `${(totalDistance / 24901).toFixed(1)}x`, label: "Around Earth" },
                ].map(stat => (
                  <div key={stat.label} className="text-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-2xl font-extrabold text-teal-700 font-display">{stat.value}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
              {topRoutes.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-sm font-bold text-slate-900 mb-3 uppercase tracking-wider">Top Routes</h2>
                  <div className="space-y-2">
                    {topRoutes.map(([route, count]) => (
                      <div key={route} className="flex items-center justify-between py-2 px-3 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-sm font-semibold text-slate-700">{route}</span>
                        <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full">{count}x</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
                {countries.map(c => (
                  <span key={c} className="text-2xl" title={c}>{getFlag(c)}</span>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-200 text-center">
                <p className="text-[8px] text-slate-300 uppercase tracking-[0.3em]">Travel Life · grandloopstudio.com</p>
              </div>
            </div>
          )}

          {type === "flight-log" && (
            <div className="p-8">
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 mb-2">
                  <BookOpen className="w-5 h-5 text-teal-600" />
                  <h1 className="text-2xl font-extrabold text-slate-900 font-display tracking-tight">FLIGHT LOG</h1>
                </div>
                <p className="text-xs text-slate-400 uppercase tracking-[0.3em]">{selectedYear === "all" ? "All Time" : selectedYear} · {flights.length} flights · {formatDistance(flights.reduce((s, t) => s + (t.distance || 0), 0))} mi</p>
                <div className="h-0.5 w-24 mx-auto mt-3 bg-gradient-to-r from-transparent via-teal-500 to-transparent" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-teal-500">
                      <th className="py-2 px-2 text-[10px] text-teal-700 uppercase tracking-wider font-bold">Date</th>
                      <th className="py-2 px-2 text-[10px] text-teal-700 uppercase tracking-wider font-bold">Flight</th>
                      <th className="py-2 px-2 text-[10px] text-teal-700 uppercase tracking-wider font-bold">Route</th>
                      <th className="py-2 px-2 text-[10px] text-teal-700 uppercase tracking-wider font-bold">Airline</th>
                      <th className="py-2 px-2 text-[10px] text-teal-700 uppercase tracking-wider font-bold text-right">Distance</th>
                      <th className="py-2 px-2 text-[10px] text-teal-700 uppercase tracking-wider font-bold text-right">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...flights].sort((a, b) => a.departureDate.localeCompare(b.departureDate)).map((f, i) => (
                      <tr key={f.id || i} className={`border-b border-slate-100 ${i % 2 === 0 ? "bg-white" : "bg-slate-50"}`}>
                        <td className="py-2 px-2 text-xs text-slate-600 tabular-nums whitespace-nowrap">{f.departureDate}</td>
                        <td className="py-2 px-2 text-xs font-semibold text-slate-700 whitespace-nowrap">{f.flightNumber || "—"}</td>
                        <td className="py-2 px-2 text-xs font-bold text-slate-900 whitespace-nowrap">{f.departureCode} → {f.arrivalCode}</td>
                        <td className="py-2 px-2 text-xs text-slate-600 whitespace-nowrap">{f.airline ? (AIRLINE_CODES[f.airline] || f.airline) : "—"}</td>
                        <td className="py-2 px-2 text-xs text-slate-600 tabular-nums text-right whitespace-nowrap">{f.distance ? `${Math.round(f.distance).toLocaleString()} mi` : "—"}</td>
                        <td className="py-2 px-2 text-xs text-slate-600 tabular-nums text-right whitespace-nowrap">{formatDurationFull(f.duration)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-teal-500 bg-teal-50">
                      <td colSpan={4} className="py-2 px-2 text-xs font-bold text-teal-700 uppercase">Total — {flights.length} flights</td>
                      <td className="py-2 px-2 text-xs font-bold text-teal-700 tabular-nums text-right">{formatDistance(flights.reduce((s, t) => s + (t.distance || 0), 0))} mi</td>
                      <td className="py-2 px-2 text-xs font-bold text-teal-700 tabular-nums text-right">{formatDurationFull(flights.reduce((s, t) => s + t.duration, 0))}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200 text-center">
                <p className="text-[8px] text-slate-300 uppercase tracking-[0.3em]">Travel Life · grandloopstudio.com</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


/* ─── Main Dashboard ─── */
export default function Dashboard() {
  const analytics = computeAnalytics() as Analytics;
  const trips = getTrips() as unknown as Trip[];
  const analyticsLoading = false;
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [selectedYear, setSelectedYear] = useState("all");
  const [printableView, setPrintableView] = useState<"passport" | "year-review" | "flight-log" | null>(null);

  const handlePrint = useCallback(() => window.print(), []);

  const handleExportCSV = useCallback(() => {
    const allTrips = getTrips() as unknown as Trip[];
    const completed = allTrips.filter(t => t.status === "completed");
    const headers = ["Date", "Type", "Flight/Train Number", "Airline/Operator", "From City", "From Code", "From Country", "To City", "To Code", "To Country", "Distance (mi)", "Duration (min)", "Status"];
    const rows = completed.map(t => [
      t.departureDate,
      t.type,
      t.type === "flight" ? (t.flightNumber || "") : (t.trainNumber || ""),
      t.type === "flight" ? (t.airline || "") : (t.trainOperator || ""),
      t.departureCity,
      t.departureCode,
      t.departureCountry,
      t.arrivalCity,
      t.arrivalCode,
      t.arrivalCountry,
      t.distance ? String(Math.round(t.distance)) : "",
      String(t.duration),
      t.status,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "travel-life-trips.csv";
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  const handleExportJSON = useCallback(() => {
    const allTrips = getTrips() as unknown as Trip[];
    const completed = allTrips.filter(t => t.status === "completed");
    const json = JSON.stringify(completed, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "travel-life-trips.json";
    link.click();
    URL.revokeObjectURL(link.href);
  }, []);

  const handleShareImage = useCallback(async () => {
    if (!dashboardRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(dashboardRef.current, { backgroundColor: "#0F172A", scale: 2, useCORS: true });
    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, "image/png"));
    if (!blob) return;
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], "travel-life-dashboard.png", { type: "image/png" });
      const shareData = { files: [file], title: "Travel Life Dashboard" };
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return;
      }
    }
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = "travel-life-dashboard.png";
    link.click();
  }, []);

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

  if (!analytics || analytics.totalTrips === 0)
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

  // Expanded detail data
  const allAirportsList = Array.from(airportsSet).map(code => {
    const info = AIRPORTS[code];
    return { code, name: info?.name || code, city: info?.city || "", country: info?.country || "" };
  }).sort((a, b) => a.code.localeCompare(b.code));

  // Distance by trip for breakdown
  const distanceByRoute = [...filteredTrips]
    .filter(t => t.distance && t.distance > 0)
    .sort((a, b) => (b.distance || 0) - (a.distance || 0))
    .slice(0, 15);

  // Country visit counts
  const countryTripCounts: Record<string, number> = {};
  filteredTrips.forEach(t => {
    countryTripCounts[t.departureCountry] = (countryTripCounts[t.departureCountry] || 0) + 1;
    countryTripCounts[t.arrivalCountry] = (countryTripCounts[t.arrivalCountry] || 0) + 1;
  });
  const allCountriesSorted = Object.entries(countryTripCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen pb-16 animate-page-enter print:!bg-white print:!pb-0" style={{ background: "linear-gradient(165deg, #0F172A 0%, #0D2137 30%, #0F172A 60%, #091018 100%)" }}>
      {/* Sticky year tabs + action bar */}
      <div className="sticky top-0 z-30 pl-14 lg:pl-4 pr-4 pt-3 pb-2 print:hidden" style={{ background: "linear-gradient(180deg, rgba(15,23,42,0.98) 0%, rgba(15,23,42,0.9) 80%, transparent 100%)" }}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1">
            <YearTab label="ALL-TIME" active={selectedYear === "all"} onClick={() => setSelectedYear("all")} />
            {years.map(y => (
              <YearTab key={y} label={y} active={selectedYear === y} onClick={() => setSelectedYear(y)} />
            ))}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <ExportMenu onPrint={handlePrint} onCSV={handleExportCSV} onJSON={handleExportJSON} onImage={handleShareImage} />
          </div>
        </div>
      </div>

      <div ref={dashboardRef} className="pl-14 lg:pl-4 pr-4 pt-2 max-w-2xl mx-auto print:!pl-4 print:!pr-4">
        <FlightMap trips={filteredTrips} variant="hero" className="mb-4 print:hidden" />

        {countries.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-5 justify-center">
            {countries.map(c => (
              <span key={c} className="text-xl" title={c}>{getFlag(c)}</span>
            ))}
          </div>
        )}

        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight font-display print:text-slate-900">MY TRAVEL PASSPORT</h2>
            <p className="text-[10px] text-teal-300/30 tracking-[0.2em] uppercase mt-0.5 print:text-teal-600/50">
              Passport · Pass · Pasaporte
            </p>
          </div>
        </div>

        {/* Primary KPIs — Expandable */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Trips Card */}
          <ExpandableCard
            expandedContent={
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {[...filteredTrips].sort((a, b) => b.departureDate.localeCompare(a.departureDate)).map((t, i) => (
                  <div key={t.id || i} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0 print:border-slate-100">
                    {t.type === "flight" ? <Plane className="w-3 h-3 text-teal-400 shrink-0" /> : <TrainFront className="w-3 h-3 text-amber-400 shrink-0" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-white truncate print:text-slate-800">{t.departureCode} → {t.arrivalCode}</p>
                      <p className="text-[10px] text-white/30 print:text-slate-400">{t.departureDate} · {t.type === "flight" ? (t.airline || "") : (t.trainOperator || "")}{t.flightNumber ? ` ${t.flightNumber}` : ""}</p>
                    </div>
                    <span className="text-[10px] text-white/40 tabular-nums shrink-0 print:text-slate-500">{t.distance ? `${Math.round(t.distance).toLocaleString()} mi` : ""}</span>
                  </div>
                ))}
              </div>
            }
          >
            <p className="text-[10px] text-teal-300/50 uppercase tracking-wider font-medium mb-1 print:text-teal-600">Trips</p>
            <p className="text-5xl font-extrabold text-white tabular-nums leading-none font-display print:text-slate-900">{filteredTrips.length}</p>
            <p className="text-xs text-white/30 mt-1 print:text-slate-400">{flights.length} flights · {trains.length} trains</p>
          </ExpandableCard>

          {/* Distance Card */}
          <ExpandableCard
            expandedContent={
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {distanceByRoute.map((t, i) => (
                  <div key={t.id || i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 print:border-slate-100">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate print:text-slate-800">{t.departureCode} → {t.arrivalCode}</p>
                      <p className="text-[10px] text-white/30 print:text-slate-400">{t.departureDate}</p>
                    </div>
                    <span className="text-xs font-bold text-teal-300 tabular-nums shrink-0 ml-2 print:text-teal-600">{Math.round(t.distance || 0).toLocaleString()} mi</span>
                  </div>
                ))}
              </div>
            }
          >
            <p className="text-[10px] text-teal-300/50 uppercase tracking-wider font-medium mb-1 print:text-teal-600">Distance</p>
            <p className="text-4xl font-extrabold text-white tabular-nums leading-none font-display print:text-slate-900">
              {formatDistance(totalDistance)}
              <span className="text-lg font-semibold text-teal-300/60 ml-1">mi</span>
            </p>
            <p className="text-xs text-white/30 mt-1 print:text-slate-400">avg {Math.round(totalDistance / (filteredTrips.length || 1)).toLocaleString()} mi</p>
          </ExpandableCard>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {/* Travel Time */}
          <ExpandableCard
            expandedContent={
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {[...filteredTrips].sort((a, b) => b.duration - a.duration).slice(0, 10).map((t, i) => (
                  <div key={t.id || i} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0 print:border-slate-100">
                    <p className="text-[10px] font-semibold text-white truncate print:text-slate-800">{t.departureCode}→{t.arrivalCode}</p>
                    <span className="text-[10px] text-teal-300 tabular-nums shrink-0 ml-1 print:text-teal-600">{formatDurationFull(t.duration)}</span>
                  </div>
                ))}
              </div>
            }
          >
            <p className="text-[10px] text-teal-300/50 uppercase tracking-wider font-medium mb-1 print:text-teal-600">Travel Time</p>
            <p className="text-3xl font-extrabold text-white tabular-nums leading-none font-display print:text-slate-900">
              {dur.primary}<span className="text-lg font-semibold text-white/50 ml-0.5">{dur.secondary}</span>
            </p>
          </ExpandableCard>

          {/* Airports */}
          <ExpandableCard
            expandedContent={
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {allAirportsList.map(a => (
                  <div key={a.code} className="py-1 border-b border-white/5 last:border-0 print:border-slate-100">
                    <p className="text-[10px] font-bold text-teal-300 print:text-teal-600">{a.code}</p>
                    <p className="text-[9px] text-white/40 truncate print:text-slate-400">{a.city}{a.country ? `, ${a.country}` : ""}</p>
                  </div>
                ))}
              </div>
            }
          >
            <p className="text-[10px] text-teal-300/50 uppercase tracking-wider font-medium mb-1 print:text-teal-600">Airports</p>
            <p className="text-3xl font-extrabold text-white tabular-nums leading-none font-display print:text-slate-900">{airportsSet.size}</p>
          </ExpandableCard>

          {/* Operators */}
          <ExpandableCard
            expandedContent={
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {Array.from(airlinesSet).map(a => (
                  <div key={a} className="flex items-center gap-1.5 py-1 border-b border-white/5 last:border-0 print:border-slate-100">
                    <Plane className="w-2.5 h-2.5 text-teal-400 shrink-0" />
                    <p className="text-[10px] font-semibold text-white truncate print:text-slate-800">{AIRLINE_CODES[a] || a}</p>
                  </div>
                ))}
                {Array.from(trainOpsSet).map(o => (
                  <div key={o} className="flex items-center gap-1.5 py-1 border-b border-white/5 last:border-0 print:border-slate-100">
                    <TrainFront className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    <p className="text-[10px] font-semibold text-white truncate print:text-slate-800">{o}</p>
                  </div>
                ))}
              </div>
            }
          >
            <p className="text-[10px] text-teal-300/50 uppercase tracking-wider font-medium mb-1 print:text-teal-600">Operators</p>
            <p className="text-3xl font-extrabold text-white tabular-nums leading-none font-display print:text-slate-900">{airlinesSet.size + trainOpsSet.size}</p>
          </ExpandableCard>
        </div>

        {/* Flights Section */}
        <SectionHeader title="Flights" />
        <ExpandableCard
          className="mb-2"
          expandedContent={
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {[...flights].sort((a, b) => b.departureDate.localeCompare(a.departureDate)).map((f, i) => (
                <div key={f.id || i} className="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-0 print:border-slate-100">
                  <div className="w-6 h-6 rounded-lg bg-teal-500/15 flex items-center justify-center shrink-0">
                    <Plane className="w-3 h-3 text-teal-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white print:text-slate-800">{f.departureCity} → {f.arrivalCity}</p>
                    <p className="text-[10px] text-white/30 print:text-slate-400">{f.departureDate} · {f.airline ? (AIRLINE_CODES[f.airline] || f.airline) : ""} {f.flightNumber || ""}</p>
                  </div>
                  <span className="text-[10px] text-white/40 tabular-nums shrink-0 print:text-slate-500">{f.distance ? `${Math.round(f.distance).toLocaleString()} mi` : ""}</span>
                </div>
              ))}
            </div>
          }
        >
          <p className="text-5xl font-extrabold text-white tabular-nums leading-none mb-1 font-display print:text-slate-900">{flights.length}</p>
          <p className="text-xs text-white/30 print:text-slate-400">{flights.filter(f => f.arrivalCountry !== f.departureCountry).length} international · {flights.filter(f => (f.distance || 0) > 2500).length} long haul</p>
        </ExpandableCard>

        {/* Flights per weekday chart */}
        <div className="glass-card mb-4 print:!bg-white print:!border-teal-200 print:!shadow-sm">
          <p className="text-[10px] text-white/40 uppercase tracking-wider font-medium mb-3 print:text-slate-500">Flights per Weekday</p>
          <div className="flex items-end gap-[6px] h-28">
            {weekdayCounts.map((count, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                {count > 0 && (
                  <span className="text-[9px] font-bold tabular-nums text-white/50 print:text-slate-600">{count}</span>
                )}
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: count > 0 ? `${Math.max((count / maxWeekday) * 100, 8)}%` : "3px",
                    background: count > 0 ? "linear-gradient(180deg, #0D9488, #1E3A5F)" : "rgba(255,255,255,0.05)",
                    minHeight: count > 0 ? "8px" : "3px",
                  }}
                />
                <span className="text-[9px] text-white/30 font-medium print:text-slate-500">{weekdayLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Flight Distance */}
        <SectionHeader title="Flight Distance" />
        <ExpandableCard
          className="mb-2"
          style={{ background: "rgba(13,148,136,0.08)", border: "1px solid rgba(13,148,136,0.12)" }}
          expandedContent={
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[...flights].filter(f => f.distance).sort((a, b) => (b.distance || 0) - (a.distance || 0)).map((f, i) => (
                <div key={f.id || i} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 print:border-slate-100">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-white print:text-slate-800">{f.departureCode} → {f.arrivalCode}</p>
                    <p className="text-[10px] text-white/30 print:text-slate-400">{f.departureDate}</p>
                  </div>
                  <span className="text-xs font-bold text-teal-300 tabular-nums shrink-0 ml-2 print:text-teal-600">{Math.round(f.distance || 0).toLocaleString()} mi</span>
                </div>
              ))}
            </div>
          }
        >
          <p className="text-4xl font-extrabold text-white tabular-nums leading-none mb-1 font-display print:text-slate-900">
            {formatDistance(flightDistance)}
            <span className="text-lg font-semibold text-teal-300/60 ml-1">mi</span>
          </p>
          <p className="text-xs text-white/30 print:text-slate-400">Average distance: {Math.round(flightDistance / (flights.length || 1)).toLocaleString()} mi</p>
        </ExpandableCard>

        {/* Earth comparison */}
        {aroundEarth > 0 && (
          <div className="glass-card mb-4 !p-4 flex items-center gap-3 print:!bg-white print:!border-teal-200 print:!shadow-sm" style={{ background: "linear-gradient(90deg, rgba(13,148,136,0.15), rgba(30,58,95,0.1))" }}>
            <span className="text-lg">🌍</span>
            <div className="flex-1 h-2.5 bg-white/10 rounded-full overflow-hidden print:bg-slate-100">
              <div className="h-full rounded-full" style={{ width: `${Math.min(aroundEarth / 15 * 100, 100)}%`, background: "linear-gradient(90deg, #0D9488, #F59E0B)" }} />
            </div>
            <span className="text-sm font-bold text-white tabular-nums font-display print:text-slate-900">{aroundEarth.toFixed(1)}x</span>
            <span className="text-xs text-white/50 print:text-slate-500">Around Earth</span>
          </div>
        )}

        {/* Shortest / Longest flight */}
        {shortestFlight && longestFlight && (
          <div className="space-y-3 mb-4">
            <div className="glass-card !p-4 print:!bg-white print:!border-teal-200 print:!shadow-sm">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2 print:text-slate-400">Shortest flight</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/15 flex items-center justify-center">
                    <Plane className="w-3.5 h-3.5 text-teal-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white print:text-slate-900">{shortestFlight.departureCity} <ArrowRight className="w-3 h-3 inline text-white/30 print:text-slate-400" /> {shortestFlight.arrivalCity}</p>
                    <p className="text-[10px] text-white/30 print:text-slate-400">{shortestFlight.airline} {shortestFlight.flightNumber}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-white tabular-nums font-display print:text-slate-900">{Math.round(shortestFlight.distance || 0).toLocaleString()} <span className="text-xs text-white/40">mi</span></p>
              </div>
            </div>
            <div className="glass-card !p-4 print:!bg-white print:!border-teal-200 print:!shadow-sm">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2 print:text-slate-400">Longest flight</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/15 flex items-center justify-center">
                    <Plane className="w-3.5 h-3.5 text-teal-300" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white print:text-slate-900">{longestFlight.departureCity} <ArrowRight className="w-3 h-3 inline text-white/30 print:text-slate-400" /> {longestFlight.arrivalCity}</p>
                    <p className="text-[10px] text-white/30 print:text-slate-400">{longestFlight.airline} {longestFlight.flightNumber}</p>
                  </div>
                </div>
                <p className="text-lg font-bold text-white tabular-nums font-display print:text-slate-900">{Math.round(longestFlight.distance || 0).toLocaleString()} <span className="text-xs text-white/40">mi</span></p>
              </div>
            </div>
          </div>
        )}

        {/* Monthly sparkline */}
        <SectionHeader title="Monthly Activity" />
        <div className="glass-card mb-4 print:!bg-white print:!border-teal-200 print:!shadow-sm">
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
                <span className="text-[7px] text-white/25 font-medium print:text-slate-400">{monthLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Airports */}
        <SectionHeader title="Top Visited Airports" />
        <ExpandableCard
          className="mb-4"
          expandedContent={
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {Object.entries(airportCounts).sort((a, b) => b[1] - a[1]).map(([code, count]) => {
                const info = AIRPORTS[code];
                return (
                  <div key={code} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 print:border-slate-100">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-teal-300 print:text-teal-600">{code}</p>
                      <p className="text-[10px] text-white/40 truncate print:text-slate-400">{info ? `${info.name}, ${info.city}` : code}</p>
                    </div>
                    <span className="text-xs font-bold text-white/60 tabular-nums shrink-0 ml-2 print:text-slate-600">{count} visits</span>
                  </div>
                );
              })}
            </div>
          }
        >
          <p className="text-3xl font-extrabold text-white tabular-nums leading-none mb-0.5 font-display print:text-slate-900">{airportsSet.size}</p>
          <p className="text-xs text-white/30 mb-4 print:text-slate-400">total airports</p>
          <div className="space-y-0.5">
            {topAirports.map(([code, count]) => (
              <HBar key={code} label={code} count={count} max={maxAirportCount} color="#0D9488" />
            ))}
          </div>
        </ExpandableCard>

        {/* Top Airlines */}
        {topAirlines.length > 0 && (
          <>
            <SectionHeader title="Top Airlines" />
            <ExpandableCard
              className="mb-4"
              expandedContent={
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Object.entries(airlineCounts).sort((a, b) => b[1] - a[1]).map(([code, count]) => (
                    <div key={code} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 print:border-slate-100">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white print:text-slate-800">{AIRLINE_CODES[code] || code}</p>
                        <p className="text-[10px] text-white/30 print:text-slate-400">{code}</p>
                      </div>
                      <span className="text-xs font-bold text-teal-300 tabular-nums shrink-0 ml-2 print:text-teal-600">{count} flights</span>
                    </div>
                  ))}
                </div>
              }
            >
              <p className="text-3xl font-extrabold text-white tabular-nums leading-none mb-0.5 font-display print:text-slate-900">{airlinesSet.size}</p>
              <p className="text-xs text-white/30 mb-4 print:text-slate-400">total airlines</p>
              <div className="space-y-0.5">
                {topAirlines.map(([name, count]) => (
                  <HBar key={name} label={name.length > 6 ? name.substring(0, 6) : name} count={count} max={maxAirlineCount} color="#14B8A6" />
                ))}
              </div>
            </ExpandableCard>
          </>
        )}

        {/* Top Routes */}
        <SectionHeader title="Top Routes" />
        <ExpandableCard
          className="mb-4"
          expandedContent={
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(routeCounts).sort((a, b) => b[1] - a[1]).map(([route, count]) => {
                const [dep, arr] = route.split("-");
                const depInfo = AIRPORTS[dep];
                const arrInfo = AIRPORTS[arr];
                return (
                  <div key={route} className="flex items-center justify-between py-1.5 border-b border-white/5 last:border-0 print:border-slate-100">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white print:text-slate-800">{route}</p>
                      <p className="text-[10px] text-white/30 truncate print:text-slate-400">{depInfo?.city || dep} → {arrInfo?.city || arr}</p>
                    </div>
                    <span className="text-xs font-bold text-teal-300 tabular-nums shrink-0 ml-2 print:text-teal-600">{count}x</span>
                  </div>
                );
              })}
            </div>
          }
        >
          <p className="text-3xl font-extrabold text-white tabular-nums leading-none mb-0.5 font-display print:text-slate-900">{Object.keys(routeCounts).length}</p>
          <p className="text-xs text-white/30 mb-4 print:text-slate-400">total routes</p>
          <div className="space-y-0.5">
            {topRoutes.map(([route, count]) => (
              <HBar key={route} label={route} count={count} max={maxRouteCount} color="#0D9488" />
            ))}
          </div>
        </ExpandableCard>

        {/* Year in Review section */}
        <SectionHeader title="Year in Review" />
        <div className="glass-card mb-4 print:!bg-white print:!border-teal-200 print:!shadow-sm" style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.1), rgba(245,158,11,0.05))", border: "1px solid rgba(13,148,136,0.12)" }}>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-3xl font-extrabold text-white tabular-nums font-display print:text-slate-900">{filteredTrips.length}</p>
              <p className="text-[9px] text-white/40 uppercase tracking-wider print:text-slate-500">Trips</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-extrabold text-white tabular-nums font-display print:text-slate-900">{countries.length}</p>
              <p className="text-[9px] text-white/40 uppercase tracking-wider print:text-slate-500">Countries</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-extrabold text-white tabular-nums font-display print:text-slate-900">{citiesSet.size}</p>
              <p className="text-[9px] text-white/40 uppercase tracking-wider print:text-slate-500">Cities</p>
            </div>
          </div>
          <div className="h-px mb-4 print:bg-teal-200" style={{ background: "linear-gradient(90deg, transparent, rgba(13,148,136,0.2), transparent)" }} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider print:text-slate-400">Total Distance</p>
              <p className="text-2xl font-bold text-white tabular-nums font-display print:text-slate-900">{formatDistance(totalDistance)} <span className="text-sm text-white/40">mi</span></p>
            </div>
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-wider print:text-slate-400">Travel Time</p>
              <p className="text-2xl font-bold text-white tabular-nums font-display print:text-slate-900">{dur.primary} {dur.secondary}</p>
            </div>
          </div>
        </div>

        {/* Countries */}
        <SectionHeader title="Countries & Territories" />
        <ExpandableCard
          className="mb-4"
          expandedContent={
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {allCountriesSorted.map(([c, count]) => (
                <div key={c} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{getFlag(c)}</span>
                    <span className="text-sm font-semibold text-white print:text-slate-800">{c}</span>
                  </div>
                  <span className="text-xs text-white/40 tabular-nums print:text-slate-500">{count} trips</span>
                </div>
              ))}
            </div>
          }
        >
          <p className="text-3xl font-extrabold text-white tabular-nums leading-none mb-0.5 font-display print:text-slate-900">{countries.length}</p>
          <p className="text-xs text-white/30 mb-5 print:text-slate-400">total</p>
          <div className="space-y-3">
            {allCountriesSorted.slice(0, 6).map(([c, count]) => (
              <div key={c} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{getFlag(c)}</span>
                  <span className="text-sm font-semibold text-white print:text-slate-800">{c}</span>
                </div>
                <span className="text-xs text-white/40 tabular-nums print:text-slate-500">{count} trips</span>
              </div>
            ))}
          </div>
        </ExpandableCard>

        {/* Printable Extras */}
        <SectionHeader title="Printable Keepsakes" />
        <div className="grid grid-cols-3 gap-3 mb-4 print:hidden">
          <button
            onClick={() => setPrintableView("passport")}
            className="glass-card !p-4 text-center cursor-pointer hover:bg-white/5 transition-all group"
          >
            <Stamp className="w-6 h-6 text-teal-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-white">Travel Passport</p>
            <p className="text-[9px] text-white/30 mt-1">Stamp collection</p>
          </button>
          <button
            onClick={() => setPrintableView("year-review")}
            className="glass-card !p-4 text-center cursor-pointer hover:bg-white/5 transition-all group"
          >
            <Globe className="w-6 h-6 text-teal-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-white">Year in Review</p>
            <p className="text-[9px] text-white/30 mt-1">Stats poster</p>
          </button>
          <button
            onClick={() => setPrintableView("flight-log")}
            className="glass-card !p-4 text-center cursor-pointer hover:bg-white/5 transition-all group"
          >
            <Table2 className="w-6 h-6 text-teal-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs font-bold text-white">Flight Log</p>
            <p className="text-[9px] text-white/30 mt-1">Pilot's logbook</p>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center py-6 print:py-2">
          <div className="h-px mx-auto w-48 mb-4 print:bg-teal-200" style={{ background: "linear-gradient(90deg, transparent, rgba(13,148,136,0.2), transparent)" }} />
          <p className="text-[8px] font-mono text-white/15 tracking-[0.3em] uppercase print:text-slate-300">
            {selectedYear === "all" ? "ALL TIME" : selectedYear} · TRAVEL LIFE · GRANDLOOPSTUDIO.COM
          </p>
          <ChevronDown className="w-5 h-5 text-white/10 mx-auto mt-2 print:hidden" />
        </div>
      </div>

      {/* Printable overlay views */}
      {printableView && (
        <PrintableOverlay
          type={printableView}
          trips={filteredTrips}
          countries={countries}
          selectedYear={selectedYear}
          onClose={() => setPrintableView(null)}
        />
      )}
    </div>
  );
}
