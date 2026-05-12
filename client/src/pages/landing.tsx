import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { Plane, TrainFront, Globe, MapPin, Route, Plus, ArrowRight, Camera } from "lucide-react";
import { geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { AIRPORTS } from "@/lib/airport-data";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { SmartFlightForm, type FlightFormData } from "@/components/smart-flight-form";
import { SmartTrainForm, type TrainFormData } from "@/components/smart-train-form";
import type { Trip } from "@shared/schema";
import { getTrips, addTrip, computeAnalytics } from "@/lib/static-data";
import { getFlag } from "@/lib/country-flags";

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

/** Count-up animation hook */
function useCountUp(target: number, duration: number = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef(false);

  useEffect(() => {
    if (ref.current) return;
    ref.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return value;
}

/* HeroFlightMap replaced by shared FlightMap component */

/* ---------- Smart Train Dialog ---------- */
function AddTrainDialog({ trigger, onAdded }: { trigger: React.ReactNode; onAdded: () => void }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSubmit = (data: any) => {
    addTrip(data);
    setDialogOpen(false);
    onAdded();
    toast({ title: "Train ride added", description: "Your trip has been recorded." });
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <TrainFront className="w-5 h-5 text-amber-400" />
            Add Train Ride
          </DialogTitle>
        </DialogHeader>
        <SmartTrainForm onSubmit={handleSubmit} isPending={false} />
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Smart Flight Dialog ---------- */
function AddFlightDialog({ trigger, onAdded }: { trigger: React.ReactNode; onAdded: () => void }) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSubmit = (data: any) => {
    addTrip(data);
    setDialogOpen(false);
    onAdded();
    toast({ title: "Flight added", description: "Your flight has been recorded." });
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Plane className="w-5 h-5 text-teal-400" />
            Add Flight
          </DialogTitle>
        </DialogHeader>
        <SmartFlightForm onSubmit={handleSubmit} isPending={false} />
      </DialogContent>
    </Dialog>
  );
}

/* ═══════════════════════════════════════════════════════
   EUROPE MAP SCREENSHOT — draws entirely on Canvas 2D
   No SVG serialization, no blob URL, works on iOS Safari.
   ═══════════════════════════════════════════════════════ */

// Map viewport
const SC_W = 1080;   // phone-portrait width @3x
const SC_MAP_H = 720;
const SC_PAD = 40;
const SC_MIN_LON = -12, SC_MAX_LON = 36;
const SC_MIN_LAT = 33,  SC_MAX_LAT = 72;

function scMercY(lat: number) {
  const r = (Math.max(-80, Math.min(80, lat)) * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + r / 2));
}
const SC_YMIN = scMercY(SC_MIN_LAT);
const SC_YMAX = scMercY(SC_MAX_LAT);

function scProject(lat: number, lon: number): [number, number] {
  const x = SC_PAD + ((lon - SC_MIN_LON) / (SC_MAX_LON - SC_MIN_LON)) * (SC_W - SC_PAD * 2);
  const my = scMercY(lat);
  const yNorm = (my - SC_YMIN) / (SC_YMAX - SC_YMIN);
  const y = SC_MAP_H - SC_PAD - yNorm * (SC_MAP_H - SC_PAD * 2);
  return [x, y];
}

// Train station coords not in AIRPORTS
const SC_STATIONS: Record<string, { lat: number; lon: number; city: string }> = {
  STP: { lat: 51.5308, lon: -0.1238, city: "London" },
  PNO: { lat: 48.8767, lon:  2.3591, city: "Paris"  },
  MIL: { lat: 45.4642, lon:  9.1900, city: "Milan"  },
};

function scGetXY(code: string): [number, number] | null {
  if (AIRPORTS[code]) return scProject(AIRPORTS[code].lat, AIRPORTS[code].lon);
  if (SC_STATIONS[code]) return scProject(SC_STATIONS[code].lat, SC_STATIONS[code].lon);
  return null;
}
function scGetCity(code: string): string {
  if (AIRPORTS[code]) return AIRPORTS[code].city;
  if (SC_STATIONS[code]) return SC_STATIONS[code].city;
  return code;
}

function scDrawArc(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number,
  x2: number, y2: number,
  isTrain: boolean,
) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy) || 1;
  const c = Math.min(dist * 0.22, 110);
  const nx = -dy / dist, ny = dx / dist;
  const cx1 = mx + nx * c;
  const cy1 = my + ny * c * 0.25 - c * 0.35;

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx1, cy1, x2, y2);

  if (isTrain) {
    ctx.setLineDash([14, 7]);
    ctx.strokeStyle = "rgba(251,191,36,0.92)";
    ctx.lineWidth = 4;
  } else {
    ctx.setLineDash([]);
    ctx.strokeStyle = "rgba(125,209,252,0.92)";
    ctx.lineWidth = 5;
  }
  ctx.stroke();
  ctx.setLineDash([]);
}

function scFormatDate(d: string) {
  if (!d) return "";
  return new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

async function screenshotEuropeMap(trips: any[]): Promise<void> {
  // 1. Load world atlas
  const mod = await import("world-atlas/countries-10m.json");
  const data: any = (mod as any).default ?? mod;
  const fc = feature(
    data,
    data.objects.countries,
  ) as unknown as GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, { name: string }>;
  const countries = fc.features;

  // d3 geoPath stream adapter
  const scProjection = {
    stream(s: any) {
      return {
        point(lon: number, lat: number) {
          const [x, y] = scProject(lat, lon);
          s.point(x, y);
        },
        lineStart()   { s.lineStart(); },
        lineEnd()     { s.lineEnd(); },
        polygonStart(){ s.polygonStart(); },
        polygonEnd()  { s.polygonEnd(); },
        sphere()      { s.sphere(); },
      };
    },
  };
  const scPath = geoPath(scProjection as any);

  // 2. Filter European trips
  const euTrips = trips.filter((t: any) => {
    const dep = t.departureCode || t.departure_code || "";
    const arr = t.arrivalCode   || t.arrival_code   || "";
    const f = scGetXY(dep);
    const t2 = scGetXY(arr);
    if (!f || !t2) return false;
    const inBounds = ([x, y]: [number, number]) =>
      x > -20 && x < SC_W + 20 && y > -20 && y < SC_MAP_H + 20;
    return inBounds(f) && inBounds(t2);
  });

  // 3. Build canvas
  const ROW_H = 52;
  const TABLE_H = Math.max(ROW_H * (euTrips.length + 1) + 24, 80);
  const HEADER_H = 80;
  const TOTAL_H = HEADER_H + SC_MAP_H + TABLE_H + 40;

  const canvas = document.createElement("canvas");
  canvas.width  = SC_W;
  canvas.height = TOTAL_H;
  const ctx = canvas.getContext("2d")!;

  // --- Background ---
  const bgGrad = ctx.createLinearGradient(0, 0, 0, TOTAL_H);
  bgGrad.addColorStop(0,   "#071826");
  bgGrad.addColorStop(0.6, "#061020");
  bgGrad.addColorStop(1,   "#040c18");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, SC_W, TOTAL_H);

  // --- Header ---
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.font = "bold 38px -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("Europe Routes", SC_PAD, 52);
  const fCount = euTrips.filter((t: any) => t.type !== "train").length;
  const rCount = euTrips.filter((t: any) => t.type === "train").length;
  ctx.fillStyle = "rgba(125,209,252,0.65)";
  ctx.font = "500 22px -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";
  ctx.fillText(`${fCount} flights · ${rCount} rail`, SC_PAD, 76);

  // --- Map ocean ---
  const oceanGrad = ctx.createRadialGradient(SC_W * 0.48, HEADER_H + SC_MAP_H * 0.34, 0, SC_W * 0.48, HEADER_H + SC_MAP_H * 0.34, SC_W * 0.9);
  oceanGrad.addColorStop(0,   "#1C6680");
  oceanGrad.addColorStop(0.45,"#0D4A66");
  oceanGrad.addColorStop(0.8, "#082F49");
  oceanGrad.addColorStop(1,   "#061827");
  ctx.fillStyle = oceanGrad;
  ctx.fillRect(0, HEADER_H, SC_W, SC_MAP_H);

  // --- Country polygons ---
  const p2d = new Path2D();
  countries.forEach((country: any) => {
    const d = scPath(country);
    if (!d) return;
    // clip to europe viewport
    const [[x0, y0], [x1, y1]] = scPath.bounds(country);
    if (x1 < -60 || x0 > SC_W + 60 || y1 + HEADER_H < HEADER_H - 60 || y0 > SC_MAP_H + 60) return;
    const path = new Path2D(d);
    p2d.__proto__; // noop, just ensure Path2D is used
    ctx.save();
    ctx.translate(0, HEADER_H);
    ctx.fillStyle = "rgba(90,120,80,0.72)";
    ctx.fill(path);
    ctx.strokeStyle = "rgba(20,40,30,0.55)";
    ctx.lineWidth = 0.8;
    ctx.stroke(path);
    ctx.restore();
  });

  // --- Arcs ---
  euTrips.forEach((t: any) => {
    const dep = t.departureCode || t.departure_code || "";
    const arr = t.arrivalCode   || t.arrival_code   || "";
    const f = scGetXY(dep);
    const to = scGetXY(arr);
    if (!f || !to) return;
    ctx.save();
    ctx.translate(0, HEADER_H);
    scDrawArc(ctx, f[0], f[1], to[0], to[1], t.type === "train");
    ctx.restore();
  });

  // --- Airport dots + labels ---
  const dotMap = new Map<string, { xy: [number, number]; city: string; isTrain: boolean; count: number }>();
  euTrips.forEach((t: any) => {
    const isTrain = t.type === "train";
    for (const code of [
      t.departureCode || t.departure_code || "",
      t.arrivalCode   || t.arrival_code   || "",
    ]) {
      if (!code) continue;
      const xy = scGetXY(code);
      if (!xy) continue;
      const ex = dotMap.get(code);
      if (ex) ex.count++;
      else dotMap.set(code, { xy, city: scGetCity(code), isTrain, count: 1 });
    }
  });

  dotMap.forEach(({ xy: [x, y], code, isTrain, count }: any) => {
    const r = Math.min(6 + count, 11);
    const col = isTrain ? "rgba(251,191,36,0.95)" : "rgba(125,209,252,0.95)";
    ctx.save();
    ctx.translate(0, HEADER_H);
    // halo
    ctx.beginPath();
    ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = isTrain ? "rgba(251,191,36,0.12)" : "rgba(125,209,252,0.12)";
    ctx.fill();
    // dot
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = col;
    ctx.fill();
    // white center
    ctx.beginPath();
    ctx.arc(x, y, r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.restore();
  });

  // Code labels
  dotMap.forEach(({ xy: [x, y], isTrain }: any, code: string) => {
    ctx.save();
    ctx.translate(0, HEADER_H);
    const labelX = x + 10;
    const labelY = y - 6;
    const tw = code.length * 9 + 12;
    const th = 20;
    ctx.fillStyle = "rgba(3,7,18,0.86)";
    ctx.beginPath();
    ctx.roundRect(labelX, labelY - th + 4, tw, th, 4);
    ctx.fill();
    ctx.fillStyle = isTrain ? "rgba(253,230,138,0.95)" : "rgba(255,255,255,0.95)";
    ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(code, labelX + 6, labelY);
    ctx.restore();
  });

  // --- Legend ---
  const lx = SC_PAD, ly = HEADER_H + SC_MAP_H - 64;
  ctx.fillStyle = "rgba(3,7,18,0.82)";
  ctx.beginPath();
  ctx.roundRect(lx, ly, 220, 52, 10);
  ctx.fill();
  // flight line
  ctx.strokeStyle = "rgba(125,209,252,0.9)";
  ctx.lineWidth = 4;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(lx + 14, ly + 18); ctx.lineTo(lx + 60, ly + 18);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("FLIGHT", lx + 68, ly + 23);
  // rail line
  ctx.strokeStyle = "rgba(251,191,36,0.9)";
  ctx.lineWidth = 3.5;
  ctx.setLineDash([10, 5]);
  ctx.beginPath();
  ctx.moveTo(lx + 14, ly + 38); ctx.lineTo(lx + 60, ly + 38);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.fillText("RAIL", lx + 68, ly + 43);

  // --- Trip Table ---
  const tableY = HEADER_H + SC_MAP_H + 20;
  const cols = [
    { label: "TYPE",        w: 130 },
    { label: "FROM",        w: 220 },
    { label: "TO",          w: 220 },
    { label: "DATE",        w: 220 },
    { label: "CARRIER",     w: 290 },
  ];
  const totalW = cols.reduce((s, c) => s + c.w, 0);
  const tableX = (SC_W - totalW) / 2;

  // Table background
  ctx.fillStyle = "rgba(6,16,32,0.96)";
  ctx.beginPath();
  ctx.roundRect(tableX - 16, tableY, totalW + 32, TABLE_H, 16);
  ctx.fill();
  ctx.strokeStyle = "rgba(226,232,240,0.09)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Header row
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";
  ctx.textAlign = "left";
  let cx = tableX;
  cols.forEach(col => {
    ctx.fillText(col.label, cx, tableY + 28);
    cx += col.w;
  });

  // Separator
  ctx.strokeStyle = "rgba(226,232,240,0.07)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tableX - 16, tableY + 38);
  ctx.lineTo(tableX + totalW + 16, tableY + 38);
  ctx.stroke();

  // Data rows
  const sorted = [...euTrips].sort((a: any, b: any) =>
    (a.departureDate || a.departure_date || "").localeCompare(
     (b.departureDate || b.departure_date || ""))
  );
  sorted.forEach((t: any, i: number) => {
    const ry = tableY + 38 + i * ROW_H + 14;
    const isTrain = t.type === "train";
    const dep = t.departureCode || t.departure_code || "";
    const arr = t.arrivalCode   || t.arrival_code   || "";
    const depCity = t.departureCity || t.departure_city || dep;
    const arrCity = t.arrivalCity   || t.arrival_city   || arr;
    const date    = t.departureDate || t.departure_date || "";
    const carrier = isTrain
      ? (t.trainOperator || t.train_operator || "Rail")
      : (t.airline || "");

    // Row separator
    if (i > 0) {
      ctx.strokeStyle = "rgba(226,232,240,0.045)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(tableX - 16, ry - 14);
      ctx.lineTo(tableX + totalW + 16, ry - 14);
      ctx.stroke();
    }

    cx = tableX;

    // Type
    ctx.font = "bold 14px -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";
    ctx.fillStyle = isTrain ? "rgba(253,230,138,0.85)" : "rgba(186,230,253,0.85)";
    ctx.textAlign = "left";
    ctx.fillText(isTrain ? "✦ Rail" : "✈ Flight", cx, ry + 5);
    cx += cols[0].w;

    // From
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";
    ctx.fillText(depCity, cx, ry + 5);
    ctx.fillStyle = "rgba(255,255,255,0.32)";
    ctx.font = "500 12px -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";
    ctx.fillText(dep, cx, ry + 22);
    cx += cols[1].w;

    // To
    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";
    ctx.fillText(arrCity, cx, ry + 5);
    ctx.fillStyle = "rgba(255,255,255,0.32)";
    ctx.font = "500 12px -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";
    ctx.fillText(arr, cx, ry + 22);
    cx += cols[2].w;

    // Date
    ctx.fillStyle = "rgba(255,255,255,0.55)";
    ctx.font = "500 14px -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";
    ctx.fillText(scFormatDate(date), cx, ry + 5);
    cx += cols[3].w;

    // Carrier
    ctx.fillStyle = "rgba(255,255,255,0.42)";
    ctx.font = "500 14px -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";
    ctx.fillText(carrier, cx, ry + 5);
  });

  // Footer
  ctx.fillStyle = "rgba(255,255,255,0.12)";
  ctx.font = "500 16px -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("grandloopstudio.com", SC_W / 2, TOTAL_H - 16);

  // 4. Open PNG directly in browser
  const dataUrl = canvas.toDataURL("image/png");
  window.open(dataUrl, "_blank");
}

/** Animated stat number */
function AnimatedStat({ value, suffix }: { value: number; suffix?: string }) {
  const animated = useCountUp(value);
  return <>{animated.toLocaleString()}{suffix}</>;
}

export default function Landing() {
  const [, navigate] = useLocation();
  const [version, setVersion] = useState(0);
  const [isScreenshotting, setIsScreenshotting] = useState(false);

  const analytics = computeAnalytics() as unknown as Analytics;
  const trips = getTrips() as unknown as Trip[];
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _ = version;

  const onAdded = () => setVersion((v) => v + 1);

  const handleScreenshot = useCallback(async () => {
    if (isScreenshotting) return;
    setIsScreenshotting(true);
    try {
      await screenshotEuropeMap(trips as any[]);
    } catch (err) {
      console.error("Screenshot failed:", err);
    } finally {
      setIsScreenshotting(false);
    }
  }, [trips, isScreenshotting]);

  const hasData = analytics && analytics.totalTrips > 0;
  const recentTrips = trips.slice(0, 4);

  return (
    <div className="min-h-screen flex flex-col animate-page-enter" style={{ background: "linear-gradient(165deg, #0F172A 0%, #0B1929 25%, #0D2137 50%, #0F172A 75%, #091018 100%)" }}>
      {/* Hero Section */}
      <div className="relative flex-1 flex flex-col items-center px-5 pt-10 sm:pt-16 pb-6 overflow-hidden">
        {/* Gradient orbs — teal themed */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[15%] w-[500px] h-[500px] rounded-full" style={{ background: "radial-gradient(circle, rgba(13,148,136,0.12) 0%, transparent 70%)" }} />
          <div className="absolute bottom-[10%] right-[10%] w-[400px] h-[400px] rounded-full" style={{ background: "radial-gradient(circle, rgba(30,58,95,0.15) 0%, transparent 70%)" }} />
          <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full" style={{ background: "radial-gradient(circle, rgba(245,158,11,0.04) 0%, transparent 70%)" }} />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(13,148,136,0.2), rgba(30,58,95,0.15))", border: "1px solid rgba(13,148,136,0.2)" }}>
              <svg viewBox="0 0 32 32" fill="none" className="w-8 h-8 text-teal-300" aria-label="Travel Life">
                <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" />
                <path d="M8 18 C10 14, 14 12, 16 10 C18 12, 22 14, 24 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                <circle cx="16" cy="10" r="1.5" fill="currentColor" />
                <path d="M12 22 L16 16 L20 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <line x1="16" y1="16" x2="16" y2="22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Title — large display type */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-4 font-display" style={{ background: "linear-gradient(135deg, #ffffff 0%, #99F6E4 40%, #14B8A6 60%, #0D9488 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Travel Life
          </h1>
          <p className="text-sm sm:text-base md:text-lg max-w-xs sm:max-w-md mx-auto mb-8 leading-relaxed px-2" style={{ color: "rgba(255,255,255,0.7)" }}>
            Track every flight and train ride. Visualize your journeys.
          </p>

          {/* Hero stats — key numbers */}
          {hasData && (
            <div className="flex items-center justify-center gap-6 sm:gap-10 mb-8 px-4">
              {[
                { value: analytics.totalFlights, label: "Flights" },
                { value: Math.round(analytics.totalDistance / 1000 * 10) / 10, label: "k Miles", isDecimal: true },
                { value: analytics.uniqueCountries, label: "Countries" },
              ].map(({ value, label, isDecimal }) => (
                <div key={label} className="text-center">
                  <p className="text-3xl sm:text-4xl font-extrabold tabular-nums font-display animate-count-up" style={{ color: "#ffffff" }}>
                    {isDecimal ? `${value}` : <AnimatedStat value={value} />}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider font-medium mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{label}</p>
                </div>
              ))}
            </div>
          )}

          {/* Primary action buttons — gold/amber accent */}
          <div className="flex flex-row items-center justify-center gap-3 mb-8 px-4">
            <AddFlightDialog
              onAdded={onAdded}
              trigger={
                <Button size="lg" className="gap-2 px-6 text-sm font-semibold shadow-lg flex-1 sm:flex-none rounded-xl card-hover" style={{ background: "linear-gradient(135deg, #F59E0B, #D97706)", border: "none", color: "#0F172A" }}>
                  <Plus className="w-4 h-4" />
                  <Plane className="w-4 h-4" />
                  Add Flight
                </Button>
              }
            />
            <AddTrainDialog
              onAdded={onAdded}
              trigger={
                <Button size="lg" className="gap-2 px-6 text-sm font-semibold shadow-lg flex-1 sm:flex-none rounded-xl card-hover" style={{ background: "linear-gradient(135deg, #0D9488, #1E3A5F)", border: "none" }}>
                  <Plus className="w-4 h-4" />
                  <TrainFront className="w-4 h-4" />
                  Add Train
                </Button>
              }
            />
          </div>

          {/* Navigation buttons — minimal, clean */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6 px-4">
            {[
              { label: "Map", icon: MapPin, path: "/map" },
              { label: "Dashboard", icon: Route, path: "/dashboard" },
              { label: "Infographics", icon: Globe, path: "/infographics" },
              { label: "All Trips", icon: Plane, path: "/trips" },
            ].map(({ label, icon: Icon, path }) => (
              <Button
                key={label}
                variant="outline"
                size="sm"
                className="gap-1.5 px-3 sm:px-5 text-xs sm:text-sm font-semibold border-teal-400/15 text-white/60 hover:bg-teal-500/10 hover:text-white hover:border-teal-400/25 rounded-xl"
                onClick={() => navigate(path)}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {label}
              </Button>
            ))}
            <Button
              size="sm"
              disabled={isScreenshotting}
              onClick={handleScreenshot}
              className="gap-1.5 px-4 sm:px-6 text-xs sm:text-sm font-bold rounded-xl shadow-lg disabled:opacity-60 disabled:cursor-wait"
              style={{ background: "linear-gradient(135deg, rgba(91,200,240,0.22), rgba(30,58,95,0.28))", border: "1px solid rgba(147,197,253,0.35)", color: "#7DD3FC" }}
            >
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {isScreenshotting ? "Building map…" : "Screenshot Map"}
            </Button>
          </div>
        </div>

        {/* Stats section — glass cards */}
        {hasData && analytics && (
          <div className="relative z-10 w-full max-w-4xl mx-auto">
            {/* KPI Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {[
                { icon: Route, value: analytics.totalTrips, label: "Trips", href: "/trips" },
                { icon: Plane, value: analytics.totalFlights, label: "Flights", href: "/trips?filter=flight" },
                { icon: TrainFront, value: analytics.totalTrains, label: "Train Rides", href: "/trips?filter=train" },
                { icon: Globe, value: analytics.uniqueCountries, label: "Countries", href: "/infographics" },
              ].map(({ icon: Icon, value, label, href }) => (
                <button
                  key={label}
                  onClick={() => navigate(href)}
                  className="glass-card !p-4 text-center card-hover cursor-pointer"
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2.5" style={{ background: "rgba(13,148,136,0.1)" }}>
                    <Icon className="w-5 h-5 text-teal-400" />
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-white font-display"><AnimatedStat value={value} /></p>
                  <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium mt-0.5">{label}</p>
                </button>
              ))}
            </div>

            {/* Distance + Flags row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className="glass-card !p-5 flex items-center gap-5">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(13,148,136,0.12)" }}>
                  <MapPin className="w-6 h-6 text-teal-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-white font-display">
                    {formatDistance(analytics.totalDistance)} <span className="text-sm font-normal text-white/30">miles</span>
                  </p>
                  <p className="text-xs text-white/30">
                    {formatDuration(analytics.totalDuration)} travel time · {analytics.uniqueCities} cities
                  </p>
                </div>
              </div>

              {analytics.countries.length > 0 && (
                <div className="glass-card !p-5 flex items-center gap-3">
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
              <div className="glass-card !p-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[11px] text-white/30 uppercase tracking-wider font-medium">Recent Journeys</p>
                  <button onClick={() => navigate("/trips")} className="text-[11px] text-teal-400 hover:text-teal-300 cursor-pointer font-medium">
                    View all <ArrowRight className="w-3 h-3 inline" />
                  </button>
                </div>
                <div className="space-y-2">
                  {recentTrips.map((trip) => (
                    <div key={trip.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl card-hover" style={{ background: "rgba(13,148,136,0.04)" }}>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: trip.type === "flight" ? "rgba(13,148,136,0.12)" : "rgba(245,158,11,0.12)" }}>
                          {trip.type === "flight" ? (
                            <Plane className="w-4 h-4 text-teal-400" />
                          ) : (
                            <TrainFront className="w-4 h-4 text-amber-400" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{trip.departureCode} → {trip.arrivalCode}</p>
                          <p className="text-[11px] text-white/25">
                            {trip.departureCity} → {trip.arrivalCity}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-white/25 tabular-nums">
                        {new Date(trip.departureDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Earth circumference comparison + extra desktop content */}
            {analytics.totalDistance > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                {/* Earth comparison */}
                <div className="glass-card !p-4 md:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🌍</span>
                    <span className="text-[10px] text-white/40 uppercase tracking-wider">Around the Earth</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{
                        width: `${Math.min((analytics.totalDistance / 24901) * 100, 100)}%`,
                        background: "linear-gradient(90deg, #0D9488, #14B8A6, #F59E0B)",
                      }} />
                    </div>
                    <span className="text-sm font-bold text-white tabular-nums font-display">
                      {((analytics.totalDistance / 24901) * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className="text-[10px] text-white/25 mt-1">
                    {formatDistance(analytics.totalDistance)} of 24,901 miles
                  </p>
                </div>

                {/* Flights per month sparkline-like display */}
                <div className="glass-card !p-4">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2">This Month</p>
                  <p className="text-3xl font-extrabold text-white tabular-nums font-display">{analytics.totalFlights}</p>
                  <p className="text-[10px] text-teal-400/60">total flights</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {!hasData && (
          <div className="relative z-10 w-full max-w-md mx-auto text-center mt-auto mb-auto">
            <div className="glass-card w-full text-center">
              <Globe className="w-12 h-12 text-teal-400/30 mx-auto mb-4" />
              <p className="text-white/40 text-sm leading-relaxed">
                Add your first flight or train ride to start tracking your journeys.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer — no V3.0 */}
      <div className="px-6 py-4 mt-auto" style={{ borderTop: "1px solid rgba(13,148,136,0.08)" }}>
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <p className="text-[10px] text-white/15 uppercase tracking-wider">Travel Life</p>
          <p className="text-[10px] text-white/15">Grand Loop Studio</p>
        </div>
      </div>
    </div>
  );
}
