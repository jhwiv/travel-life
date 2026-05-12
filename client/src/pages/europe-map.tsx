import { useState, useMemo, useRef, useCallback } from "react";
import { AIRPORTS } from "@/lib/airport-data";
import { getTrips } from "@/lib/static-data";
import type { Trip } from "@shared/schema";
import { Plane, TrainFront, Camera, ArrowUpDown } from "lucide-react";

/* ─── Europe fixed bounding box (Mercator) ─── */
const VIEW_W = 1200;
const VIEW_H = 820;

// Fixed Europe viewport: lon -13 → 34, lat 34 → 72
const EUROPE_MIN_LON = -13;
const EUROPE_MAX_LON = 34;
const EUROPE_MIN_LAT = 34;
const EUROPE_MAX_LAT = 72;
const PAD = 48;

function mercY(lat: number) {
  const latRad = (Math.max(-80, Math.min(80, lat)) * Math.PI) / 180;
  return Math.log(Math.tan(Math.PI / 4 + latRad / 2));
}
const yMin = mercY(EUROPE_MIN_LAT);
const yMax = mercY(EUROPE_MAX_LAT);

function project(lat: number, lon: number): { x: number; y: number } {
  const x = PAD + ((lon - EUROPE_MIN_LON) / (EUROPE_MAX_LON - EUROPE_MIN_LON)) * (VIEW_W - PAD * 2);
  const my = mercY(lat);
  const yNorm = (my - yMin) / (yMax - yMin);
  const y = VIEW_H - PAD - yNorm * (VIEW_H - PAD * 2);
  return { x, y };
}

function arcPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return `M${x1},${y1} L${x2},${y2}`;
  const curvature = Math.min(dist * 0.22, 90);
  const nx = -dy / dist;
  const ny = dx / dist;
  const cx = mx + nx * curvature;
  const cy = my + ny * curvature * 0.25 - curvature * 0.35;
  return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
}

/* ─── Rail line: slightly straighter S-curve to differentiate from flights ─── */
function trainPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist === 0) return `M${x1},${y1} L${x2},${y2}`;
  // Tighter arc, slight opposite side curve
  const curvature = Math.min(dist * 0.12, 45);
  const nx = dy / dist;  // opposite normal
  const ny = -dx / dist;
  const cx = mx + nx * curvature;
  const cy = my + ny * curvature * 0.3;
  return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
}

/* ─── Europe coastlines — high-res outlines ─── */
const EUROPE_COASTS = [
  // Iberian Peninsula
  { name: "iberia", points: [
    [43.8,-8.5],[43.2,-9.1],[42.0,-8.9],[41.5,-8.7],[40.5,-8.8],[38.7,-9.5],
    [37.0,-8.9],[36.2,-7.4],[36.0,-5.6],[36.4,-4.8],[36.7,-3.5],[37.5,-1.5],
    [38.3,-0.4],[39.5,0.3],[40.8,0.8],[41.2,1.3],[41.7,2.1],[42.4,3.1],
    [43.3,2.0],[43.4,1.2],[43.5,-0.5],[43.5,-2.0],[43.7,-4.5],[43.8,-8.5],
  ]},
  // South France coast (Mediterranean)
  { name: "france-med", points: [
    [43.3,3.0],[43.1,3.9],[43.2,5.3],[43.5,6.9],[43.7,7.4],[43.8,7.6],
  ]},
  // France west/north coast
  { name: "france-west", points: [
    [43.5,-2.0],[44.0,-1.5],[45.5,-1.2],[46.5,-1.8],[47.3,-2.6],[47.6,-3.8],
    [48.4,-5.1],[48.7,-4.0],[48.8,-3.0],[49.0,-1.7],[49.3,-0.3],[49.7,0.3],
    [50.0,1.6],[50.8,1.9],[51.1,2.3],
  ]},
  // Great Britain
  { name: "britain", points: [
    [50.0,-5.7],[50.3,-4.1],[50.5,-3.5],[50.7,-1.8],[50.8,-0.5],[51.0,1.4],
    [51.4,1.5],[52.0,1.7],[52.8,1.9],[53.2,0.5],[54.0,-0.4],[54.7,-1.2],
    [55.0,-1.6],[55.5,-2.0],[56.0,-2.6],[57.0,-2.0],[57.7,-1.8],[58.5,-3.0],
    [58.7,-4.0],[58.6,-5.3],[57.5,-5.7],[57.0,-6.3],[55.8,-5.2],[55.2,-5.5],
    [54.6,-5.5],[54.0,-4.5],[53.4,-4.5],[52.8,-5.0],[52.5,-5.3],[51.6,-5.1],
    [51.1,-5.0],[50.6,-5.4],[50.0,-5.7],
  ]},
  // Ireland
  { name: "ireland", points: [
    [51.5,-9.7],[52.0,-10.2],[53.0,-10.2],[54.0,-10.1],[55.2,-8.0],
    [55.5,-7.3],[54.7,-5.9],[54.0,-6.0],[53.2,-6.1],[52.2,-6.4],
    [51.8,-9.0],[51.5,-9.7],
  ]},
  // Belgium/Netherlands coast
  { name: "benelux-coast", points: [
    [51.1,2.3],[51.4,3.3],[51.8,3.9],[52.0,4.1],[52.5,4.8],[52.9,5.0],
    [53.1,5.5],[53.4,6.2],[53.5,7.0],[54.0,8.0],
  ]},
  // Denmark/Jutland
  { name: "denmark", points: [
    [54.5,8.0],[55.0,8.2],[55.5,8.5],[56.0,9.5],[56.5,10.5],[57.0,10.6],
    [57.7,10.6],[58.0,11.2],[57.7,12.2],[56.5,12.7],[55.8,12.5],[55.5,12.1],
    [55.5,10.5],[55.2,10.0],[54.8,9.8],[54.5,8.9],[54.5,8.0],
  ]},
  // Scandinavia south/Norway coast
  { name: "norway-coast", points: [
    [58.0,7.0],[58.5,6.0],[59.0,5.5],[59.5,5.3],[60.0,5.0],[60.5,4.9],
    [61.0,5.1],[61.5,5.5],[62.0,5.5],[62.5,6.2],[63.0,8.0],[63.5,9.5],
    [64.0,10.0],[64.5,11.0],[65.0,14.0],[66.0,14.0],[67.0,15.0],[68.0,16.5],
    [69.0,18.0],[70.0,20.0],[71.0,26.0],
  ]},
  // Sweden west/south
  { name: "sweden-w", points: [
    [58.0,11.2],[58.5,11.0],[59.0,11.0],[59.5,10.8],[60.0,11.5],[60.5,11.4],
    [61.0,11.0],[62.0,13.0],[63.0,14.5],[64.0,16.0],
  ]},
  // Sweden east coast
  { name: "sweden-e", points: [
    [55.5,13.5],[56.0,15.5],[56.5,16.5],[57.0,17.0],[58.0,18.5],
    [59.0,18.5],[59.5,19.0],[60.0,19.0],[60.5,18.5],[61.0,17.5],
  ]},
  // Italy west coast (Tyrrhenian)
  { name: "italy-w", points: [
    [43.8,7.6],[44.0,8.1],[44.0,9.0],[43.5,10.0],[42.5,11.2],[41.5,12.5],
    [41.0,13.5],[40.5,14.5],[40.0,15.3],[39.2,16.2],[38.5,16.5],
    [38.0,15.7],[38.2,15.5],[38.5,15.3],[39.0,15.0],[40.0,14.0],
    [41.0,13.0],[42.0,11.5],[43.0,10.5],[44.0,12.5],[44.5,12.5],[45.5,13.5],
  ]},
  // Italy east coast (Adriatic)
  { name: "italy-e", points: [
    [45.5,13.5],[45.2,13.6],[44.8,14.0],[44.0,14.5],[43.0,14.5],
    [42.0,14.2],[41.5,14.5],[41.0,15.0],[40.5,16.0],[40.2,17.0],
    [39.8,18.0],[39.5,19.5],[38.5,20.5],[38.0,20.8],
  ]},
  // Greece
  { name: "greece", points: [
    [41.8,20.0],[41.5,20.5],[40.8,20.8],[40.5,21.5],[40.0,22.0],
    [40.0,22.8],[40.5,23.5],[40.7,24.5],[41.0,25.0],[41.5,26.0],
    [40.8,26.0],[40.5,26.5],[40.0,26.0],[39.5,25.5],[37.5,24.5],
    [36.5,22.5],[36.8,21.5],[37.5,21.0],[38.0,21.5],[38.5,22.0],
    [38.0,23.0],[37.5,22.5],[37.0,22.0],[36.8,21.5],[37.5,20.5],
    [38.0,20.0],[38.5,19.5],[39.5,19.5],[40.0,20.5],
  ]},
  // Adriatic east coast (Croatia/Albania simplified)
  { name: "adriatic-e", points: [
    [45.8,13.8],[45.0,14.2],[44.5,14.5],[44.0,15.0],[43.5,16.0],
    [43.0,16.5],[42.5,18.0],[42.0,19.5],[41.5,19.3],[41.0,19.5],
    [40.5,19.5],[40.0,20.0],
  ]},
  // Baltic coast simplified
  { name: "baltic", points: [
    [54.5,18.5],[54.5,19.5],[55.0,20.5],[55.5,21.0],[56.0,21.0],
    [56.5,21.0],[57.0,21.5],[57.5,23.0],[57.5,24.5],[58.0,26.5],
    [59.5,28.0],[60.0,27.5],[59.5,24.0],[60.0,22.5],[60.5,21.5],
    [61.0,21.0],[61.5,21.5],[62.0,22.0],[64.0,24.0],
  ]},
  // Finland coast simplified
  { name: "finland", points: [
    [60.0,20.0],[60.2,21.0],[60.5,22.0],[61.0,22.5],[61.5,23.0],
    [62.0,23.5],[63.0,23.0],[64.0,24.0],[65.0,25.5],[66.0,26.0],
    [67.0,28.5],[68.5,29.0],[69.0,28.0],[69.5,28.5],[70.0,28.5],
  ]},
  // NW Africa (Morocco/Algeria coast — just for south edge)
  { name: "nw-africa", points: [
    [36.0,-5.6],[35.5,-4.0],[35.0,-2.0],[34.5,-0.5],[34.0,1.0],
    [36.8,3.0],[36.9,5.0],[37.0,7.5],[37.5,9.5],[37.0,11.0],
    [33.5,11.5],[32.5,13.0],[31.5,15.0],
  ]},
  // Turkey west coast
  { name: "turkey-w", points: [
    [40.5,26.0],[40.0,26.5],[39.0,27.0],[38.5,27.5],[37.5,27.5],
    [37.0,28.0],[36.5,29.0],[36.5,30.0],[36.0,30.5],[36.0,31.5],
    [36.5,32.0],[36.5,34.0],[37.0,35.5],
  ]},
];

/* ─── Country name labels ─── */
const COUNTRY_LABELS = [
  { name: "UK", lat: 53.5, lon: -2.0 },
  { name: "FRANCE", lat: 46.8, lon: 2.4 },
  { name: "GERMANY", lat: 51.2, lon: 10.5 },
  { name: "SPAIN", lat: 40.2, lon: -3.5 },
  { name: "ITALY", lat: 42.8, lon: 12.5 },
  { name: "PORTUGAL", lat: 39.6, lon: -8.0 },
  { name: "NETHERLANDS", lat: 52.3, lon: 5.3 },
  { name: "DENMARK", lat: 56.0, lon: 10.0 },
  { name: "NORWAY", lat: 65.0, lon: 13.0 },
  { name: "SWEDEN", lat: 62.0, lon: 16.0 },
  { name: "FINLAND", lat: 65.0, lon: 28.0 },
  { name: "GREECE", lat: 39.5, lon: 22.0 },
  { name: "SWITZERLAND", lat: 46.8, lon: 8.2 },
  { name: "POLAND", lat: 52.0, lon: 19.5 },
  { name: "CZECHIA", lat: 49.8, lon: 15.5 },
  { name: "AUSTRIA", lat: 47.5, lon: 14.5 },
  { name: "CROATIA", lat: 45.0, lon: 16.0 },
  { name: "TURKEY", lat: 39.0, lon: 29.5 },
];

/* ─── Water labels ─── */
const WATER_LABELS = [
  { name: "North Sea", lat: 56.0, lon: 2.5 },
  { name: "Baltic Sea", lat: 58.0, lon: 20.0 },
  { name: "Mediterranean Sea", lat: 37.5, lon: 13.0 },
  { name: "Atlantic Ocean", lat: 50.0, lon: -8.0 },
  { name: "Adriatic Sea", lat: 43.0, lon: 15.5 },
  { name: "Bay of Biscay", lat: 45.5, lon: -5.5 },
];

/* ─── Airport coordinate lookup (train stations use city lat/lon) ─── */
const STATION_COORDS: Record<string, { lat: number; lon: number; city: string }> = {
  STP: { lat: 51.5308, lon: -0.1238, city: "London" },
  PNO: { lat: 48.8767, lon: 2.3591, city: "Paris" },
  AMS: { lat: 52.3791, lon: 4.9003, city: "Amsterdam" },
  ZRH: { lat: 47.3769, lon: 8.5417, city: "Zurich" },
  MIL: { lat: 45.4642, lon: 9.1900, city: "Milan" },
  MAD: { lat: 40.4155, lon: -3.7026, city: "Madrid" },
  BCN: { lat: 41.3797, lon: 2.1403, city: "Barcelona" },
  BER: { lat: 52.5244, lon: 13.4105, city: "Berlin" },
  MUC: { lat: 48.1402, lon: 11.5584, city: "Munich" },
};

function getCoords(code: string): { lat: number; lon: number } | null {
  if (AIRPORTS[code]) return { lat: AIRPORTS[code].lat, lon: AIRPORTS[code].lon };
  if (STATION_COORDS[code]) return { lat: STATION_COORDS[code].lat, lon: STATION_COORDS[code].lon };
  return null;
}

function getCityName(code: string, fallback: string): string {
  if (AIRPORTS[code]) return AIRPORTS[code].city;
  if (STATION_COORDS[code]) return STATION_COORDS[code].city;
  return fallback;
}

function formatDate(d: string) {
  if (!d) return "";
  return new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

type SortKey = "date" | "type" | "origin" | "destination";
type SortDir = "asc" | "desc";

function coastToPath(points: number[][]): string {
  return points.map((p, i) => {
    const { x, y } = project(p[0], p[1]);
    return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ");
}

export default function EuropeMapPage() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [isCapturing, setIsCapturing] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);

  const trips = getTrips() as unknown as Trip[];

  /* ─── Build arc list for all trips (both flights and trains) ─── */
  const arcs = useMemo(() => {
    const completed = trips.filter((t: any) => t.status === "completed");
    return completed.map((t: any, i: number) => {
      const depCode = t.departureCode || t.departure_code || "";
      const arrCode = t.arrivalCode || t.arrival_code || t.departureCode || "";
      const depCoords = getCoords(depCode);
      const arrCoords = getCoords(arrCode);
      if (!depCoords || !arrCoords) return null;

      // Check if inside Europe viewport (loose check)
      const inEurope = (
        depCoords.lon > -16 && depCoords.lon < 38 &&
        depCoords.lat > 32 && depCoords.lat < 74 &&
        arrCoords.lon > -16 && arrCoords.lon < 38 &&
        arrCoords.lat > 32 && arrCoords.lat < 74
      );
      if (!inEurope) return null;

      const from = project(depCoords.lat, depCoords.lon);
      const to = project(arrCoords.lat, arrCoords.lon);
      const isTrain = t.type === "train";
      const pathD = isTrain
        ? trainPath(from.x, from.y, to.x, to.y)
        : arcPath(from.x, from.y, to.x, to.y);

      return {
        id: i,
        type: t.type,
        depCode,
        arrCode,
        depCity: getCityName(depCode, t.departureCity || t.departure_city || depCode),
        arrCity: getCityName(arrCode, t.arrivalCity || t.arrival_city || arrCode),
        date: t.departureDate || t.departure_date || "",
        airline: t.airline || t.trainOperator || t.train_operator || "",
        flightNum: t.flightNumber || t.flight_number || t.trainNumber || t.train_number || "",
        path: pathD,
        from,
        to,
        isTrain,
      };
    }).filter(Boolean) as NonNullable<ReturnType<typeof arcs[0]>>[];
  }, [trips]);

  /* ─── Airport/station dots ─── */
  const dots = useMemo(() => {
    const map = new Map<string, { code: string; x: number; y: number; city: string; count: number; isTrain: boolean }>();
    arcs.forEach((arc) => {
      for (const [code, city, isTrain] of [[arc.depCode, arc.depCity, arc.isTrain], [arc.arrCode, arc.arrCity, arc.isTrain]] as [string, string, boolean][]) {
        if (!code) continue;
        const coords = getCoords(code);
        if (!coords) continue;
        const { x, y } = project(coords.lat, coords.lon);
        const ex = map.get(code);
        if (ex) ex.count++;
        else map.set(code, { code, x, y, city, count: 1, isTrain });
      }
    });
    return Array.from(map.values());
  }, [arcs]);

  /* ─── Sorted table data ─── */
  const tableRows = useMemo(() => {
    return [...arcs].sort((a, b) => {
      let va = "", vb = "";
      if (sortKey === "date") { va = a.date; vb = b.date; }
      else if (sortKey === "type") { va = a.type; vb = b.type; }
      else if (sortKey === "origin") { va = a.depCity; vb = b.depCity; }
      else if (sortKey === "destination") { va = a.arrCity; vb = b.arrCity; }
      const cmp = va.localeCompare(vb);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [arcs, sortKey, sortDir]);

  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }, [sortKey]);

  /* ─── Phone screenshot capture ─── */
  const handleCapture = useCallback(async () => {
    if (!captureRef.current || isCapturing) return;
    setIsCapturing(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      // Phone screen: 390×844 (iPhone 14)
      const PHONE_W = 390;
      const PHONE_H = 844;

      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: "#07131F",
        scale: 3,
        useCORS: true,
        width: captureRef.current.offsetWidth,
        height: captureRef.current.offsetHeight,
      });

      // Create phone-sized canvas
      const phoneCanvas = document.createElement("canvas");
      phoneCanvas.width = PHONE_W * 3;
      phoneCanvas.height = PHONE_H * 3;
      const ctx = phoneCanvas.getContext("2d");
      if (!ctx) return;

      ctx.fillStyle = "#07131F";
      ctx.fillRect(0, 0, phoneCanvas.width, phoneCanvas.height);

      // Scale the captured content to phone width, letterbox if needed
      const srcW = canvas.width;
      const srcH = canvas.height;
      const scale = (PHONE_W * 3) / srcW;
      const destH = srcH * scale;
      const destY = Math.max(0, (PHONE_H * 3 - destH) / 2);

      ctx.drawImage(canvas, 0, destY, PHONE_W * 3, destH);

      const dataUrl = phoneCanvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `europe-map-phone-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Capture failed:", err);
    } finally {
      setIsCapturing(false);
    }
  }, [isCapturing]);

  const flightCount = arcs.filter(a => !a.isTrain).length;
  const trainCount = arcs.filter(a => a.isTrain).length;

  return (
    <div
      className="min-h-screen animate-page-enter"
      style={{ background: "linear-gradient(180deg, #07131F 0%, #0A2032 38%, #071826 72%, #050B12 100%)" }}
    >
      {/* Page header */}
      <div className="px-5 pl-14 lg:pl-8 pt-5 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Europe Routes</h1>
          <p className="text-[11px] text-white/35 mt-0.5 font-mono tracking-wider">
            {flightCount} flight{flightCount !== 1 ? "s" : ""} · {trainCount} rail ride{trainCount !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={handleCapture}
          disabled={isCapturing}
          className="flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] shadow-xl transition disabled:opacity-60 disabled:cursor-wait hover:scale-[1.03] active:scale-[0.98]"
          style={{
            background: "rgba(3,7,18,0.78)",
            border: "1px solid rgba(226,232,240,0.28)",
            color: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(14px)",
          }}
        >
          <Camera className="h-3.5 w-3.5" />
          {isCapturing ? "Capturing…" : "Phone Screenshot"}
        </button>
      </div>

      {/* Capture target: map + table */}
      <div ref={captureRef}>
        {/* ─── HIGH-RES SVG MAP ─── */}
        <div
          className="relative w-full overflow-hidden"
          style={{ height: "min(68vh, 680px)", minHeight: "480px" }}
        >
          <svg
            viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
            shapeRendering="geometricPrecision"
            aria-hidden
          >
            <defs>
              {/* Ocean gradient */}
              <radialGradient id="eu-ocean" cx="38%" cy="28%" r="88%">
                <stop offset="0%" stopColor="#1A5F7A" />
                <stop offset="40%" stopColor="#0D4A66" />
                <stop offset="80%" stopColor="#072D44" />
                <stop offset="100%" stopColor="#051826" />
              </radialGradient>

              {/* Land gradient */}
              <linearGradient id="eu-land" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8FB464" stopOpacity="0.78" />
                <stop offset="45%" stopColor="#4A7A56" stopOpacity="0.76" />
                <stop offset="100%" stopColor="#2B4A3C" stopOpacity="0.88" />
              </linearGradient>

              {/* Terrain noise */}
              <filter id="eu-terrain" x="-10%" y="-10%" width="120%" height="120%">
                <feTurbulence type="fractalNoise" baseFrequency="0.018 0.05" numOctaves="3" seed="7" />
                <feColorMatrix type="saturate" values="0.28" />
                <feComponentTransfer>
                  <feFuncA type="table" tableValues="0 0.13" />
                </feComponentTransfer>
              </filter>

              {/* Flight arc gradient — bright white-blue */}
              <linearGradient id="eu-arc-flight" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F0F9FF" stopOpacity="1" />
                <stop offset="50%" stopColor="#BAE6FD" stopOpacity="1" />
                <stop offset="100%" stopColor="#67E8F9" stopOpacity="0.9" />
              </linearGradient>

              {/* Rail arc gradient — warm amber/gold */}
              <linearGradient id="eu-arc-rail" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FDE68A" stopOpacity="1" />
                <stop offset="50%" stopColor="#F59E0B" stopOpacity="1" />
                <stop offset="100%" stopColor="#FBBF24" stopOpacity="0.9" />
              </linearGradient>

              {/* Hover highlight arc gradient */}
              <linearGradient id="eu-arc-hover" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
                <stop offset="100%" stopColor="#E0F2FE" stopOpacity="1" />
              </linearGradient>

              {/* Glow filters */}
              <filter id="eu-glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="eu-glow-strong" x="-40%" y="-40%" width="180%" height="180%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="eu-dot-glow" x="-60%" y="-60%" width="220%" height="220%">
                <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Navigation grid */}
              <pattern id="eu-grid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M80 0 L0 0 0 80" fill="none" stroke="rgba(219,234,254,0.045)" strokeWidth="0.5" />
              </pattern>

              {/* Latitude lines pattern */}
              <pattern id="eu-lat-lines" x="0" y="0" width={VIEW_W} height="1" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2={VIEW_W} y2="0" stroke="rgba(186,230,253,0.04)" strokeWidth="0.4" />
              </pattern>
            </defs>

            {/* Ocean base */}
            <rect width={VIEW_W} height={VIEW_H} fill="url(#eu-ocean)" />
            <rect width={VIEW_W} height={VIEW_H} fill="#ffffff" filter="url(#eu-terrain)" opacity="0.38" />
            <rect width={VIEW_W} height={VIEW_H} fill="url(#eu-grid)" />

            {/* Latitude guide lines at 40°, 50°, 60°, 70° */}
            {[40, 50, 60, 70].map((lat) => {
              const { y } = project(lat, 0);
              return (
                <line key={`lat-${lat}`} x1={0} y1={y} x2={VIEW_W} y2={y}
                  stroke="rgba(186,230,253,0.06)" strokeWidth="0.8" strokeDasharray="4,8" />
              );
            })}
            {/* Longitude guide lines at -10°, 0°, 10°, 20°, 30° */}
            {[-10, 0, 10, 20, 30].map((lon) => {
              const { x } = project(50, lon);
              return (
                <line key={`lon-${lon}`} x1={x} y1={0} x2={x} y2={VIEW_H}
                  stroke="rgba(186,230,253,0.06)" strokeWidth="0.8" strokeDasharray="4,8" />
              );
            })}

            {/* Coastlines / land mass outlines */}
            <g fill="url(#eu-land)" fillOpacity="0.82" stroke="rgba(254,243,199,0.38)" strokeWidth="0.9" strokeLinejoin="round" strokeLinecap="round">
              {EUROPE_COASTS.map((coast) => (
                <path
                  key={coast.name}
                  d={coastToPath(coast.points)}
                  fill="url(#eu-land)"
                  fillOpacity="0"
                />
              ))}
            </g>
            {/* Coastline strokes only */}
            <g fill="none" stroke="rgba(203,228,196,0.55)" strokeWidth="1.3" strokeLinejoin="round" strokeLinecap="round">
              {EUROPE_COASTS.map((coast) => (
                <path key={`stroke-${coast.name}`} d={coastToPath(coast.points)} />
              ))}
            </g>

            {/* Water labels */}
            <g pointerEvents="none">
              {WATER_LABELS.map((lbl) => {
                const pt = project(lbl.lat, lbl.lon);
                if (pt.x < 10 || pt.x > VIEW_W - 10 || pt.y < 10 || pt.y > VIEW_H - 10) return null;
                return (
                  <text key={lbl.name} x={pt.x} y={pt.y} textAnchor="middle"
                    fontFamily="'Satoshi', 'General Sans', 'Inter', ui-sans-serif, sans-serif"
                    fontSize={13} fontWeight={500} letterSpacing="0.1em" fontStyle="italic"
                    fill="rgba(186,230,253,0.42)" stroke="rgba(2,6,23,0.55)" strokeWidth={2.2} paintOrder="stroke">
                    {lbl.name}
                  </text>
                );
              })}
            </g>

            {/* Country labels */}
            <g pointerEvents="none">
              {COUNTRY_LABELS.map((lbl) => {
                const pt = project(lbl.lat, lbl.lon);
                if (pt.x < 20 || pt.x > VIEW_W - 20 || pt.y < 20 || pt.y > VIEW_H - 20) return null;
                return (
                  <text key={lbl.name} x={pt.x} y={pt.y} textAnchor="middle"
                    fontFamily="'Satoshi', 'General Sans', 'Inter', ui-sans-serif, sans-serif"
                    fontSize={9} fontWeight={700} letterSpacing="0.18em"
                    fill="rgba(254,243,199,0.62)" stroke="rgba(2,6,23,0.7)" strokeWidth={2.8} paintOrder="stroke">
                    {lbl.name}
                  </text>
                );
              })}
            </g>

            {/* ─── Glow halos under arcs ─── */}
            <g fill="none">
              {arcs.map((arc, i) => {
                const isHov = hoveredIdx === i;
                return (
                  <path key={`glow-${i}`} d={arc.path}
                    stroke={arc.isTrain ? "#F59E0B" : "#BAE6FD"}
                    strokeWidth={isHov ? 10 : arc.isTrain ? 6 : 5}
                    strokeOpacity={isHov ? 0.38 : 0.16}
                    filter="url(#eu-glow)"
                    style={{ animationDelay: `${0.12 * i}s` }}
                    className="animate-passport-arc"
                  />
                );
              })}
            </g>

            {/* ─── Flight arcs — crisp main stroke ─── */}
            <g fill="none" shapeRendering="geometricPrecision">
              {arcs.map((arc, i) => {
                const isHov = hoveredIdx === i;
                return (
                  <path key={`arc-${i}`} d={arc.path}
                    stroke={isHov ? "url(#eu-arc-hover)" : arc.isTrain ? "url(#eu-arc-rail)" : "url(#eu-arc-flight)"}
                    strokeWidth={isHov ? 3.8 : arc.isTrain ? 2.2 : 2.6}
                    strokeLinecap="round"
                    strokeDasharray={arc.isTrain ? "6,3" : undefined}
                    filter={isHov ? "url(#eu-glow-strong)" : undefined}
                    className="animate-passport-arc"
                    style={{
                      animationDelay: `${0.12 * i}s`,
                      cursor: "pointer",
                      transition: "stroke-width 0.18s ease",
                    }}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                  />
                );
              })}
            </g>

            {/* ─── Airport / station dots ─── */}
            {dots.map((dot) => {
              const isHub = dot.count >= 3;
              const baseR = isHub ? 7.5 : Math.min(4.5 + dot.count * 0.6, 6.5);
              const color = dot.isTrain ? "#FDE68A" : "#7DD3FC";
              return (
                <g key={dot.code}>
                  <circle cx={dot.x} cy={dot.y} r={baseR * 2.8} fill={color} fillOpacity="0.1" />
                  <circle cx={dot.x} cy={dot.y} r={baseR} fill={isHub ? "#E0F2FE" : color} fillOpacity="0.96"
                    filter="url(#eu-dot-glow)" />
                  <circle cx={dot.x} cy={dot.y} r={baseR * 0.38} fill="white" fillOpacity="1" />
                </g>
              );
            })}

            {/* ─── Airport / station code labels ─── */}
            {dots.map((dot) => {
              const isHub = dot.count >= 3;
              const dx = 10;
              const dy = -12;
              const lx = dot.x + dx;
              const ly = dot.y + dy;
              const fontSize = 10;
              const textW = dot.code.length * 6.8 + 8;
              const textH = fontSize + 5;
              return (
                <g key={`lbl-${dot.code}`}>
                  <rect x={lx - 4} y={ly - textH + 3} width={textW} height={textH}
                    rx={3.5} ry={3.5} fill="rgba(3,7,18,0.84)"
                    stroke="rgba(219,234,254,0.3)" strokeWidth="0.7" />
                  <text x={lx} y={ly} fill={isHub ? "#FEF3C7" : "rgba(255,255,255,0.95)"}
                    fontSize={fontSize} fontWeight="800" textAnchor="start"
                    fontFamily="'Satoshi', 'General Sans', 'Inter', ui-sans-serif, sans-serif"
                    letterSpacing="0.4">
                    {dot.code}
                  </text>
                </g>
              );
            })}

            {/* ─── Map legend ─── */}
            <g>
              <rect x={16} y={VIEW_H - 56} width={180} height={44} rx={8} ry={8}
                fill="rgba(3,7,18,0.76)" stroke="rgba(226,232,240,0.18)" strokeWidth="0.8" />
              <line x1={28} y1={VIEW_H - 38} x2={62} y2={VIEW_H - 38}
                stroke="url(#eu-arc-flight)" strokeWidth="2.6" strokeLinecap="round" />
              <text x={70} y={VIEW_H - 34} fontSize={9} fontWeight={700} letterSpacing="0.1em"
                fill="rgba(255,255,255,0.7)"
                fontFamily="'Satoshi', 'General Sans', 'Inter', ui-sans-serif, sans-serif">
                FLIGHT
              </text>
              <line x1={28} y1={VIEW_H - 22} x2={62} y2={VIEW_H - 22}
                stroke="url(#eu-arc-rail)" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="5,2.5" />
              <text x={70} y={VIEW_H - 18} fontSize={9} fontWeight={700} letterSpacing="0.1em"
                fill="rgba(255,255,255,0.7)"
                fontFamily="'Satoshi', 'General Sans', 'Inter', ui-sans-serif, sans-serif">
                RAIL
              </text>
            </g>

            {/* ─── Hover tooltip ─── */}
            {hoveredIdx !== null && arcs[hoveredIdx] && (() => {
              const arc = arcs[hoveredIdx];
              const mx = (arc.from.x + arc.to.x) / 2;
              const my = (arc.from.y + arc.to.y) / 2;
              const tipW = 200;
              const tipH = 48;
              const tipX = Math.min(Math.max(mx - tipW / 2, 8), VIEW_W - tipW - 8);
              const tipY = Math.max(my - tipH - 16, 8);
              return (
                <g pointerEvents="none">
                  <rect x={tipX} y={tipY} width={tipW} height={tipH} rx={8} ry={8}
                    fill="rgba(3,7,18,0.92)" stroke={arc.isTrain ? "rgba(245,158,11,0.4)" : "rgba(147,197,253,0.4)"}
                    strokeWidth="1" />
                  <text x={tipX + tipW / 2} y={tipY + 18} textAnchor="middle"
                    fill="white" fontSize={12} fontWeight={800}
                    fontFamily="'Satoshi', 'General Sans', 'Inter', ui-sans-serif, sans-serif">
                    {arc.depCity} → {arc.arrCity}
                  </text>
                  <text x={tipX + tipW / 2} y={tipY + 34} textAnchor="middle"
                    fill="rgba(255,255,255,0.5)" fontSize={9.5} fontWeight={600} letterSpacing="0.05em"
                    fontFamily="'Satoshi', 'General Sans', 'Inter', ui-sans-serif, sans-serif">
                    {arc.isTrain ? "🚂" : "✈"} {arc.airline} {arc.flightNum} · {formatDate(arc.date)}
                  </text>
                </g>
              );
            })()}
          </svg>

          {/* Map overlay header */}
          <div className="absolute left-4 top-4 right-4 z-10 flex items-start justify-between pointer-events-none">
            <div className="rounded-[24px] px-5 py-3.5 shadow-2xl"
              style={{ background: "rgba(3,7,18,0.72)", border: "1px solid rgba(226,232,240,0.22)", backdropFilter: "blur(18px)" }}>
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] font-bold" style={{ color: "rgba(191,219,254,0.72)" }}>
                <Plane className="w-3.5 h-3.5" />
                Europe Route Map
              </div>
              <div className="mt-1.5 flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Plane className="w-3 h-3" style={{ color: "#BAE6FD" }} />
                  <span className="text-sm font-extrabold text-white tabular-nums">{flightCount}</span>
                  <span className="text-xs text-white/50">flights</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrainFront className="w-3 h-3" style={{ color: "#F59E0B" }} />
                  <span className="text-sm font-extrabold text-white tabular-nums">{trainCount}</span>
                  <span className="text-xs text-white/50">rail</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom gradient fade */}
          <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
            style={{ background: "linear-gradient(180deg, transparent 0%, rgba(7,19,31,0.75) 60%, #07131F 100%)" }} />
        </div>

        {/* ─── TRIPS TABLE ─── */}
        <div className="px-4 pl-14 lg:pl-6 pr-4 lg:pr-6 pb-10 mt-4">
          <div className="rounded-2xl overflow-hidden shadow-2xl"
            style={{ background: "rgba(8,17,31,0.92)", border: "1px solid rgba(226,232,240,0.1)" }}>
            {/* Table header */}
            <div className="px-5 py-3.5 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(226,232,240,0.07)", background: "rgba(3,7,18,0.5)" }}>
              <h2 className="text-xs font-bold uppercase tracking-[0.22em] text-white/50">Trip Log</h2>
              <span className="text-[10px] font-mono text-white/25">{arcs.length} segments</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(226,232,240,0.06)" }}>
                    {([
                      { key: "type" as SortKey, label: "Type", w: "w-20" },
                      { key: "origin" as SortKey, label: "Origin", w: "w-auto" },
                      { key: "destination" as SortKey, label: "Destination", w: "w-auto" },
                      { key: "date" as SortKey, label: "Date", w: "w-36" },
                    ]).map(({ key, label, w }) => (
                      <th key={key}
                        className={`${w} px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em] cursor-pointer select-none hover:text-white/70 transition-colors`}
                        style={{ color: sortKey === key ? "rgba(186,230,253,0.85)" : "rgba(255,255,255,0.35)" }}
                        onClick={() => handleSort(key)}>
                        <span className="flex items-center gap-1.5">
                          {label}
                          <ArrowUpDown className={`w-3 h-3 transition-opacity ${sortKey === key ? "opacity-80" : "opacity-25"}`} />
                        </span>
                      </th>
                    ))}
                    <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.2em]"
                      style={{ color: "rgba(255,255,255,0.35)" }}>
                      Carrier / Train
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((arc, i) => {
                    const isHov = hoveredIdx === arc.id;
                    return (
                      <tr key={`${arc.depCode}-${arc.arrCode}-${arc.date}-${i}`}
                        onMouseEnter={() => setHoveredIdx(arc.id)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        className="transition-colors cursor-default"
                        style={{
                          borderBottom: "1px solid rgba(226,232,240,0.05)",
                          background: isHov
                            ? (arc.isTrain ? "rgba(245,158,11,0.07)" : "rgba(147,197,253,0.07)")
                            : "transparent",
                        }}>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5">
                            {arc.isTrain
                              ? <TrainFront className="w-3.5 h-3.5 shrink-0" style={{ color: "#F59E0B" }} />
                              : <Plane className="w-3.5 h-3.5 shrink-0" style={{ color: "#7DD3FC" }} />}
                            <span className="text-[10px] font-bold uppercase tracking-wider"
                              style={{ color: arc.isTrain ? "rgba(253,230,138,0.8)" : "rgba(186,230,253,0.8)" }}>
                              {arc.isTrain ? "Rail" : "Flight"}
                            </span>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-white">{arc.depCity}</span>
                          <span className="text-white/35 text-xs ml-1.5 font-mono">{arc.depCode}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-bold text-white">{arc.arrCity}</span>
                          <span className="text-white/35 text-xs ml-1.5 font-mono">{arc.arrCode}</span>
                        </td>
                        <td className="px-4 py-3 text-white/60 text-xs font-mono tabular-nums">
                          {formatDate(arc.date)}
                        </td>
                        <td className="px-4 py-3 text-white/45 text-xs">
                          {arc.airline && <span>{arc.airline}</span>}
                          {arc.flightNum && (
                            <span className="ml-1.5 font-mono text-white/30">{arc.flightNum}</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {arcs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-white/25 text-sm">
                        No European trips recorded yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer branding */}
          <div className="text-center pt-6">
            <div className="h-px mx-auto w-32 mb-4"
              style={{ background: "linear-gradient(90deg, transparent, rgba(20,184,166,0.15), transparent)" }} />
            <p className="text-[8px] font-mono tracking-[0.3em] uppercase"
              style={{ color: "rgba(153,246,228,0.12)" }}>
              Travel Life &middot; grandloopstudio.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
