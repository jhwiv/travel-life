import { useState, useMemo, useEffect, useRef } from "react";
import { AIRPORTS } from "@/lib/airport-data";
import { getTrips, computeAnalytics } from "@/lib/static-data";
import type { Trip } from "@shared/schema";
import { getFlag } from "@/lib/country-flags";

/* ─── Fitted Bounding Box Projection ─── */
const VIEW_W = 960;
const VIEW_H = 580;

/**
 * Compute a fitted Mercator projection that zooms to the user's actual airports.
 * Returns a project() function and the viewBox bounds.
 */
function createFittedProjection(airportCodes: string[]) {
  const coords = airportCodes
    .map((c) => AIRPORTS[c])
    .filter(Boolean)
    .map((a) => ({ lat: a.lat, lon: a.lon }));

  if (coords.length === 0) {
    // fallback: whole world
    return {
      project: (lat: number, lon: number) => ({
        x: ((lon + 180) / 360) * VIEW_W,
        y: (1 - (lat + 60) / 140) * VIEW_H,
      }),
      bounds: { minLon: -180, maxLon: 180, minLat: -60, maxLat: 80 },
    };
  }

  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  for (const c of coords) {
    if (c.lat < minLat) minLat = c.lat;
    if (c.lat > maxLat) maxLat = c.lat;
    if (c.lon < minLon) minLon = c.lon;
    if (c.lon > maxLon) maxLon = c.lon;
  }

  // Add 35% padding on each side
  const latRange = maxLat - minLat || 10;
  const lonRange = maxLon - minLon || 10;
  const padLat = latRange * 0.35;
  const padLon = lonRange * 0.35;
  minLat -= padLat;
  maxLat += padLat;
  minLon -= padLon;
  maxLon += padLon;

  // Clamp
  minLat = Math.max(minLat, -70);
  maxLat = Math.min(maxLat, 80);

  // Mercator y conversion
  function mercY(lat: number) {
    const latRad = (Math.max(-70, Math.min(80, lat)) * Math.PI) / 180;
    return Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  }

  const yMin = mercY(minLat);
  const yMax = mercY(maxLat);

  const PAD = 50; // pixel padding inside SVG

  function project(lat: number, lon: number) {
    const x = PAD + ((lon - minLon) / (maxLon - minLon)) * (VIEW_W - PAD * 2);
    const my = mercY(lat);
    const yNorm = (my - yMin) / (yMax - yMin);
    const y = VIEW_H - PAD - yNorm * (VIEW_H - PAD * 2);
    return { x, y };
  }

  return { project, bounds: { minLon, maxLon, minLat, maxLat } };
}

function arcPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const curvature = Math.min(dist * 0.25, 80);
  const nx = -dy / dist;
  const ny = dx / dist;
  const cx = mx + nx * curvature;
  const cy = my + ny * curvature * 0.3 - curvature * 0.4;
  return `M${x1},${y1} Q${cx},${cy} ${x2},${y2}`;
}

/* ─── Simplified continent outlines ─── */
/* These are simplified geographic outlines projected via Mercator.
   We draw them at absolute lat/lon and project them via the fitted projection. */

interface CoastPoint { lat: number; lon: number }

// Simplified coastline data (key outlines for the Atlantic region)
const COASTLINES: { name: string; points: CoastPoint[] }[] = [
  // US East Coast (simplified)
  { name: "us-east", points: [
    { lat: 47.0, lon: -67.0 }, { lat: 45.0, lon: -67.0 }, { lat: 43.5, lon: -70.0 },
    { lat: 42.0, lon: -70.5 }, { lat: 41.2, lon: -72.0 }, { lat: 40.5, lon: -74.0 },
    { lat: 39.5, lon: -74.5 }, { lat: 38.5, lon: -75.5 }, { lat: 37.0, lon: -76.0 },
    { lat: 35.0, lon: -75.5 }, { lat: 33.5, lon: -78.0 }, { lat: 32.0, lon: -80.5 },
    { lat: 30.5, lon: -81.5 }, { lat: 28.0, lon: -80.5 }, { lat: 26.0, lon: -80.0 },
    { lat: 25.0, lon: -80.5 }, { lat: 24.5, lon: -81.8 }, { lat: 25.0, lon: -81.5 },
    { lat: 26.5, lon: -82.0 }, { lat: 28.0, lon: -82.8 }, { lat: 29.5, lon: -83.5 },
    { lat: 30.0, lon: -85.5 }, { lat: 30.2, lon: -88.0 }, { lat: 29.5, lon: -89.5 },
    { lat: 29.0, lon: -90.0 },
  ]},
  // Florida Keys
  { name: "fl-keys", points: [
    { lat: 25.0, lon: -80.5 }, { lat: 24.7, lon: -81.0 }, { lat: 24.5, lon: -81.8 },
  ]},
  // Caribbean Islands (Aruba region)
  { name: "caribbean-aruba", points: [
    { lat: 12.6, lon: -70.2 }, { lat: 12.5, lon: -69.9 }, { lat: 12.4, lon: -69.8 },
    { lat: 12.5, lon: -70.1 }, { lat: 12.6, lon: -70.2 },
  ]},
  // Caribbean larger islands (Cuba simplified)
  { name: "cuba", points: [
    { lat: 22.0, lon: -84.0 }, { lat: 22.5, lon: -81.5 }, { lat: 23.0, lon: -80.0 },
    { lat: 22.5, lon: -78.0 }, { lat: 21.5, lon: -77.0 }, { lat: 20.5, lon: -75.0 },
    { lat: 20.0, lon: -74.5 }, { lat: 20.5, lon: -76.0 }, { lat: 21.0, lon: -78.0 },
    { lat: 21.5, lon: -80.0 }, { lat: 22.0, lon: -82.0 }, { lat: 22.0, lon: -84.0 },
  ]},
  // Hispaniola (simplified)
  { name: "hispaniola", points: [
    { lat: 19.5, lon: -72.5 }, { lat: 19.8, lon: -71.5 }, { lat: 19.5, lon: -70.0 },
    { lat: 18.8, lon: -69.0 }, { lat: 18.2, lon: -68.5 }, { lat: 18.0, lon: -69.5 },
    { lat: 18.2, lon: -71.0 }, { lat: 18.5, lon: -72.5 }, { lat: 19.0, lon: -73.5 },
    { lat: 19.5, lon: -72.5 },
  ]},
  // Puerto Rico
  { name: "puerto-rico", points: [
    { lat: 18.5, lon: -67.0 }, { lat: 18.4, lon: -66.0 }, { lat: 18.0, lon: -65.5 },
    { lat: 18.0, lon: -67.0 }, { lat: 18.5, lon: -67.0 },
  ]},
  // Venezuela coast (simplified)
  { name: "venezuela", points: [
    { lat: 12.0, lon: -72.0 }, { lat: 11.5, lon: -71.5 }, { lat: 11.0, lon: -70.0 },
    { lat: 10.5, lon: -68.0 }, { lat: 10.5, lon: -66.0 }, { lat: 10.5, lon: -64.0 },
    { lat: 10.0, lon: -62.0 }, { lat: 9.5, lon: -61.0 },
  ]},
  // Colombia north coast
  { name: "colombia", points: [
    { lat: 12.5, lon: -72.0 }, { lat: 11.5, lon: -73.0 }, { lat: 11.0, lon: -75.0 },
    { lat: 10.5, lon: -76.0 }, { lat: 9.0, lon: -77.5 }, { lat: 8.0, lon: -77.0 },
  ]},
  // Central America simplified
  { name: "central-am", points: [
    { lat: 18.5, lon: -88.0 }, { lat: 17.0, lon: -88.5 }, { lat: 15.5, lon: -88.0 },
    { lat: 14.0, lon: -87.5 }, { lat: 13.0, lon: -87.0 }, { lat: 11.5, lon: -85.5 },
    { lat: 10.0, lon: -84.0 }, { lat: 9.0, lon: -83.0 }, { lat: 8.5, lon: -80.0 },
    { lat: 9.5, lon: -79.5 },
  ]},
  // Western Europe — Iberian Peninsula
  { name: "iberia", points: [
    { lat: 43.5, lon: -8.0 }, { lat: 42.5, lon: -9.0 }, { lat: 39.5, lon: -9.5 },
    { lat: 37.0, lon: -8.5 }, { lat: 36.0, lon: -5.5 }, { lat: 37.5, lon: -1.5 },
    { lat: 39.5, lon: 0.5 }, { lat: 41.5, lon: 2.0 }, { lat: 42.5, lon: 3.0 },
    { lat: 43.5, lon: 1.0 }, { lat: 43.5, lon: -2.0 }, { lat: 43.5, lon: -8.0 },
  ]},
  // France coast
  { name: "france", points: [
    { lat: 43.5, lon: 1.0 }, { lat: 43.0, lon: 3.0 }, { lat: 43.3, lon: 5.0 },
    { lat: 43.5, lon: 7.0 }, { lat: 44.0, lon: 8.0 },
  ]},
  // France west/north coast
  { name: "france-west", points: [
    { lat: 43.5, lon: -2.0 }, { lat: 46.0, lon: -1.5 }, { lat: 47.5, lon: -3.0 },
    { lat: 48.5, lon: -5.0 }, { lat: 48.8, lon: -3.5 }, { lat: 49.0, lon: -1.5 },
    { lat: 49.5, lon: 0.0 }, { lat: 51.0, lon: 2.0 },
  ]},
  // British Isles
  { name: "britain", points: [
    { lat: 50.5, lon: -5.0 }, { lat: 51.5, lon: -5.0 }, { lat: 52.5, lon: -5.0 },
    { lat: 53.5, lon: -4.5 }, { lat: 54.5, lon: -5.5 }, { lat: 55.5, lon: -5.5 },
    { lat: 57.0, lon: -6.0 }, { lat: 58.5, lon: -5.0 }, { lat: 58.5, lon: -3.0 },
    { lat: 57.0, lon: -2.0 }, { lat: 55.5, lon: -1.5 }, { lat: 54.0, lon: -0.5 },
    { lat: 53.0, lon: 0.5 }, { lat: 52.0, lon: 1.5 }, { lat: 51.0, lon: 1.5 },
    { lat: 50.5, lon: 0.0 }, { lat: 50.5, lon: -1.0 }, { lat: 50.5, lon: -3.0 },
    { lat: 50.5, lon: -5.0 },
  ]},
  // Ireland
  { name: "ireland", points: [
    { lat: 52.0, lon: -10.0 }, { lat: 53.5, lon: -10.0 }, { lat: 55.0, lon: -8.5 },
    { lat: 55.5, lon: -7.5 }, { lat: 54.5, lon: -6.0 }, { lat: 53.0, lon: -6.0 },
    { lat: 52.0, lon: -6.5 }, { lat: 51.5, lon: -9.5 }, { lat: 52.0, lon: -10.0 },
  ]},
  // Scandinavia — Denmark/southern Sweden
  { name: "scandinavia-s", points: [
    { lat: 54.5, lon: 8.5 }, { lat: 55.0, lon: 8.5 }, { lat: 55.5, lon: 9.5 },
    { lat: 56.0, lon: 10.5 }, { lat: 56.5, lon: 10.0 }, { lat: 57.5, lon: 10.5 },
    { lat: 57.5, lon: 12.0 }, { lat: 56.5, lon: 13.0 }, { lat: 55.5, lon: 13.5 },
    { lat: 55.5, lon: 12.5 }, { lat: 55.0, lon: 12.0 },
  ]},
  // North/Central Europe coast (Netherlands, Germany, Denmark)
  { name: "north-europe", points: [
    { lat: 51.5, lon: 3.5 }, { lat: 52.5, lon: 5.0 }, { lat: 53.5, lon: 6.0 },
    { lat: 54.0, lon: 8.0 }, { lat: 54.5, lon: 8.5 },
  ]},
  // Italy
  { name: "italy", points: [
    { lat: 44.0, lon: 8.0 }, { lat: 43.5, lon: 10.0 }, { lat: 42.0, lon: 12.0 },
    { lat: 41.0, lon: 13.5 }, { lat: 40.5, lon: 15.0 }, { lat: 39.0, lon: 16.5 },
    { lat: 38.0, lon: 16.0 }, { lat: 38.0, lon: 15.5 }, { lat: 39.5, lon: 15.0 },
    { lat: 40.5, lon: 14.0 }, { lat: 41.0, lon: 13.0 }, { lat: 42.0, lon: 11.5 },
    { lat: 44.0, lon: 12.5 }, { lat: 45.5, lon: 13.5 },
  ]},
  // NW Africa (Morocco)
  { name: "nw-africa", points: [
    { lat: 36.0, lon: -5.5 }, { lat: 35.0, lon: -2.0 }, { lat: 34.0, lon: -1.5 },
    { lat: 33.0, lon: -1.0 }, { lat: 32.0, lon: -1.0 }, { lat: 30.0, lon: -3.0 },
    { lat: 28.0, lon: -9.5 }, { lat: 27.5, lon: -13.0 },
  ]},
  // NW Africa west coast
  { name: "nw-africa-west", points: [
    { lat: 36.0, lon: -5.5 }, { lat: 35.5, lon: -6.0 }, { lat: 34.0, lon: -6.5 },
    { lat: 33.0, lon: -7.5 }, { lat: 32.0, lon: -9.0 }, { lat: 30.0, lon: -10.0 },
    { lat: 28.0, lon: -9.5 },
  ]},
  // South America east coast (north portion)
  { name: "sa-north", points: [
    { lat: 9.5, lon: -61.0 }, { lat: 8.0, lon: -60.0 }, { lat: 6.0, lon: -57.0 },
    { lat: 4.0, lon: -52.0 }, { lat: 2.0, lon: -50.0 }, { lat: 0.0, lon: -49.0 },
    { lat: -2.0, lon: -44.0 }, { lat: -5.0, lon: -35.0 },
  ]},
];

/** Build SVG polyline from lat/lon coastline using the fitted projection */
function coastToSvgPoints(
  coast: CoastPoint[],
  projectFn: (lat: number, lon: number) => { x: number; y: number },
): string {
  return coast
    .map((p) => {
      const { x, y } = projectFn(p.lat, p.lon);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

/* Label offsets — very aggressive for Florida cluster separation */
const LABEL_OFFSETS: Record<string, { dx: number; dy: number; anchor: string; leaderLine?: boolean }> = {
  EWR: { dx: -22, dy: -12, anchor: "end" },
  SRQ: { dx: -100, dy: -55, anchor: "end", leaderLine: true },
  RSW: { dx: -100, dy: 0, anchor: "end", leaderLine: true },
  PBI: { dx: 80, dy: -50, anchor: "start", leaderLine: true },
  EYW: { dx: -100, dy: 55, anchor: "end", leaderLine: true },
  AUA: { dx: 20, dy: 8, anchor: "start" },
  CPH: { dx: 16, dy: -16, anchor: "start" },
  ZRH: { dx: 16, dy: 20, anchor: "start" },
};

function formatDistance(miles: number) {
  return miles.toLocaleString();
}

function formatDuration(minutes: number) {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${minutes % 60}m`;
}

/** Animated count-up */
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

function AnimatedStat({ value, suffix }: { value: number; suffix?: string }) {
  const animated = useCountUp(value);
  return <>{animated.toLocaleString()}{suffix}</>;
}

export default function MapPage() {
  const [hoveredArc, setHoveredArc] = useState<number | null>(null);
  const trips = getTrips() as unknown as Trip[];
  const analytics = computeAnalytics();

  const { airports, arcs, mostRecent, projection } = useMemo(() => {
    const flights = trips.filter((t: any) => t.type === "flight" && t.status === "completed");

    // Collect all airport codes first for bounding box
    const allCodes = new Set<string>();
    flights.forEach((t: any) => {
      const depCode = t.departureCode || t.departure_code;
      const arrCode = t.arrivalCode || t.arrival_code;
      if (depCode) allCodes.add(depCode);
      if (arrCode) allCodes.add(arrCode);
    });

    const proj = createFittedProjection(Array.from(allCodes));

    const airportMap = new Map<string, { code: string; x: number; y: number; count: number; city: string }>();
    flights.forEach((t: any) => {
      const depCode = t.departureCode || t.departure_code;
      const arrCode = t.arrivalCode || t.arrival_code;
      const depCity = t.departureCity || t.departure_city;
      const arrCity = t.arrivalCity || t.arrival_city;

      for (const [code, city] of [[depCode, depCity], [arrCode, arrCity]] as [string, string][]) {
        if (!code) continue;
        const info = AIRPORTS[code];
        if (info) {
          const { x, y } = proj.project(info.lat, info.lon);
          const existing = airportMap.get(code);
          if (existing) {
            existing.count++;
          } else {
            airportMap.set(code, { code, x, y, count: 1, city });
          }
        }
      }
    });

    const arcList = flights.map((t: any, i: number) => {
      const depCode = t.departureCode || t.departure_code;
      const arrCode = t.arrivalCode || t.arrival_code;
      const depInfo = AIRPORTS[depCode];
      const arrInfo = AIRPORTS[arrCode];
      if (!depInfo || !arrInfo) return null;
      const from = proj.project(depInfo.lat, depInfo.lon);
      const to = proj.project(arrInfo.lat, arrInfo.lon);
      return {
        id: i,
        depCode,
        arrCode,
        depCity: t.departureCity || t.departure_city,
        arrCity: t.arrivalCity || t.arrival_city,
        date: t.departureDate || t.departure_date || "",
        airline: t.airline || "",
        flightNum: t.flightNumber || t.flight_number || "",
        path: arcPath(from.x, from.y, to.x, to.y),
        from,
        to,
        distance: t.distance || 0,
      };
    }).filter(Boolean) as any[];

    const sorted = [...arcList].sort((a: any, b: any) => a.date.localeCompare(b.date));
    const mostRecentArc = sorted.length > 0 ? sorted[sorted.length - 1] : null;

    return {
      airports: Array.from(airportMap.values()),
      arcs: arcList,
      mostRecent: mostRecentArc,
      projection: proj,
    };
  }, [trips]);

  const countries = analytics.countries || [];
  const totalFlights = analytics.totalFlights || 0;
  const totalDistance = analytics.totalDistance || 0;
  const totalDuration = analytics.totalDuration || 0;
  const uniqueAirports = analytics.uniqueAirports || 0;
  const uniqueAirlines = analytics.uniqueAirlines || 0;
  const uniqueCountries = analytics.uniqueCountries || 0;

  return (
    <div className="min-h-screen animate-page-enter" style={{ background: "linear-gradient(180deg, #0F172A 0%, #0D2137 30%, #0B1929 60%, #091018 100%)" }}>
      {/* Full-width fitted map */}
      <div className="relative w-full" style={{ height: "min(56vh, 560px)" }}>
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <defs>
            {/* Arc glow gradient — purple/violet */}
            <linearGradient id="pp-arc-glow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#14b8a6" stopOpacity="1" />
              <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
            </linearGradient>

            {/* Gold gradient for most recent arc */}
            <linearGradient id="pp-arc-recent" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#facc15" stopOpacity="1" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.9" />
            </linearGradient>

            {/* Glow filters */}
            <filter id="pp-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="pp-glow-strong" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="pp-dot-glow" x="-60%" y="-60%" width="220%" height="220%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* Label background filter — subtle dark pill */}
            <filter id="pp-label-bg" x="-0.15" y="-0.1" width="1.3" height="1.3">
              <feFlood floodColor="#0F172A" floodOpacity="0.75" result="bg" />
              <feMerge>
                <feMergeNode in="bg" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Plane icon symbol */}
            <symbol id="pp-plane" viewBox="0 0 24 24">
              <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor" />
            </symbol>
          </defs>

          {/* Subtle grid pattern */}
          <pattern id="pp-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M60 0 L0 0 0 60" fill="none" stroke="rgba(20,184,166,0.035)" strokeWidth="0.5" />
          </pattern>
          <rect width={VIEW_W} height={VIEW_H} fill="url(#pp-grid)" />

          {/* Continent outlines — subtle, just slightly lighter than background */}
          <g fill="none" stroke="rgba(20,184,166,0.12)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            {COASTLINES.map((coast) => (
              <polyline
                key={coast.name}
                points={coastToSvgPoints(coast.points, projection.project)}
                fill="none"
              />
            ))}
          </g>

          {/* Arc glow layer (behind) */}
          <g fill="none">
            {arcs.map((arc: any, i: number) => {
              const isRecent = mostRecent && arc.id === mostRecent.id;
              const isHovered = hoveredArc === i;
              return (
                <path
                  key={`glow-${i}`}
                  d={arc.path}
                  stroke={isRecent ? "#facc15" : "#14b8a6"}
                  strokeWidth={isHovered ? 12 : isRecent ? 9 : 6}
                  strokeOpacity={isHovered ? 0.45 : isRecent ? 0.3 : 0.15}
                  filter="url(#pp-glow)"
                  className="animate-passport-arc"
                  style={{ animationDelay: `${0.15 * i}s` }}
                />
              );
            })}
          </g>

          {/* Flight arcs — main stroke */}
          <g fill="none">
            {arcs.map((arc: any, i: number) => {
              const isRecent = mostRecent && arc.id === mostRecent.id;
              const isHovered = hoveredArc === i;
              return (
                <path
                  key={`arc-${i}`}
                  d={arc.path}
                  stroke={isRecent ? "url(#pp-arc-recent)" : "url(#pp-arc-glow)"}
                  strokeWidth={isHovered ? 3 : isRecent ? 2.5 : 1.8}
                  strokeLinecap="round"
                  className="animate-passport-arc"
                  style={{
                    animationDelay: `${0.15 * i}s`,
                    cursor: "pointer",
                    transition: "stroke-width 0.2s ease",
                  }}
                  filter={isHovered || isRecent ? "url(#pp-glow-strong)" : undefined}
                  onMouseEnter={() => setHoveredArc(i)}
                  onMouseLeave={() => setHoveredArc(null)}
                />
              );
            })}
          </g>

          {/* Animated plane on most recent route */}
          {mostRecent && (
            <g className="animate-plane-travel" style={{ color: "#fbbf24" }}>
              <animateMotion
                dur="4s"
                begin="1.5s"
                repeatCount="indefinite"
                rotate="auto"
                path={mostRecent.path}
              />
              <use href="#pp-plane" x="-8" y="-8" width="16" height="16" />
            </g>
          )}

          {/* Airport dots */}
          {airports.map((ap, i) => {
            const isHub = ap.count >= 4;
            const baseR = isHub ? 6 : Math.min(4 + ap.count * 0.5, 5.5);
            return (
              <g key={ap.code}>
                {/* Outer pulse ring */}
                <circle cx={ap.x} cy={ap.y} r={baseR * 2.5} fill={isHub ? "#22d3ee" : "#14b8a6"} fillOpacity="0.08" className="animate-dot-pulse">
                  <animate attributeName="r" values={`${baseR * 2.5};${baseR * 3.5};${baseR * 2.5}`} dur={`${3 + i * 0.15}s`} repeatCount="indefinite" />
                  <animate attributeName="fill-opacity" values="0.08;0.03;0.08" dur={`${3 + i * 0.15}s`} repeatCount="indefinite" />
                </circle>
                {/* Inner solid dot */}
                <circle cx={ap.x} cy={ap.y} r={baseR} fill={isHub ? "#22d3ee" : "#14b8a6"} fillOpacity="0.95" filter="url(#pp-dot-glow)" />
                {/* White center */}
                <circle cx={ap.x} cy={ap.y} r={baseR * 0.3} fill="white" fillOpacity="0.9" />
              </g>
            );
          })}

          {/* Airport labels with fixed offsets, leader lines, and background pills */}
          {airports.map((ap) => {
            const isHub = ap.count >= 4;
            const fixedOffset = LABEL_OFFSETS[ap.code];
            const dx = fixedOffset ? fixedOffset.dx : 10;
            const dy = fixedOffset ? fixedOffset.dy : -10;
            const showLeader = fixedOffset?.leaderLine ?? false;
            const anchor = (fixedOffset ? fixedOffset.anchor : "start") as "start" | "middle" | "end";
            const lx = ap.x + dx;
            const ly = ap.y + dy;
            const fontSize = 10;
            const textW = ap.code.length * 6.5 + 8;
            const textH = fontSize + 5;
            const pillX = anchor === "end" ? lx - textW + 2 : anchor === "middle" ? lx - textW / 2 : lx - 4;
            const pillY = ly - textH + 3;

            return (
              <g key={`label-${ap.code}`}>
                {/* Leader line from dot to label */}
                {showLeader && (
                  <line
                    x1={ap.x}
                    y1={ap.y}
                    x2={lx + (anchor === "end" ? -textW / 2 + 2 : anchor === "start" ? textW / 2 - 2 : 0)}
                    y2={ly - textH / 2 + 3}
                    stroke="rgba(20,184,166,0.35)"
                    strokeWidth="0.8"
                  />
                )}
                {/* Background pill */}
                <rect
                  x={pillX}
                  y={pillY}
                  width={textW}
                  height={textH}
                  rx={4}
                  ry={4}
                  fill="rgba(10,10,46,0.8)"
                  stroke="rgba(20,184,166,0.2)"
                  strokeWidth="0.5"
                />
                {/* Label text */}
                <text
                  x={lx}
                  y={ly}
                  fill={isHub ? "#ccfbf1" : "rgba(255,255,255,0.9)"}
                  fontSize={fontSize}
                  fontWeight="600"
                  textAnchor={anchor}
                  fontFamily="'Satoshi', 'General Sans', 'Inter', ui-sans-serif, sans-serif"
                  letterSpacing="0.5"
                >
                  {ap.code}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip on hover */}
        {hoveredArc !== null && arcs[hoveredArc] && (
          <div
            className="absolute z-20 pointer-events-none px-3 py-2 rounded-lg text-xs font-mono"
            style={{
              left: "50%",
              bottom: "16px",
              transform: "translateX(-50%)",
              background: "rgba(10,10,46,0.95)",
              border: "1px solid rgba(20,184,166,0.3)",
              backdropFilter: "blur(8px)",
              boxShadow: "0 4px 20px rgba(0,0,0,0.5), 0 0 15px rgba(20,184,166,0.15)",
            }}
          >
            <div className="flex items-center gap-2 text-white/90">
              <span className="text-teal-300 font-bold">{arcs[hoveredArc].depCode}</span>
              <span className="text-white/30">&rarr;</span>
              <span className="text-teal-300 font-bold">{arcs[hoveredArc].arrCode}</span>
              {arcs[hoveredArc].distance > 0 && (
                <span className="text-white/40 ml-1">{arcs[hoveredArc].distance.toLocaleString()} mi</span>
              )}
            </div>
            <div className="text-white/40 mt-0.5">
              {arcs[hoveredArc].depCity} &rarr; {arcs[hoveredArc].arrCity}
              {arcs[hoveredArc].airline && <span className="ml-2 text-amber-300/60">{arcs[hoveredArc].airline} {arcs[hoveredArc].flightNum}</span>}
            </div>
          </div>
        )}

        {/* Bottom gradient fade into stats section */}
        <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none" style={{ background: "linear-gradient(180deg, transparent 0%, #0B1929 100%)" }} />
      </div>

      {/* Stats section below the map */}
      <div className="relative z-10 max-w-2xl mx-auto px-5 pb-16 -mt-4">
        {/* Country flags row */}
        {countries.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
            {countries.map((c: string) => (
              <span key={c} className="drop-shadow-lg" style={{ fontSize: "30px" }} title={c}>
                {getFlag(c)}
              </span>
            ))}
          </div>
        )}

        {/* Section title with divider */}
        <div className="text-center mb-8">
          <div className="h-px mx-auto w-32 mb-4" style={{ background: "linear-gradient(90deg, transparent, rgba(20,184,166,0.3), transparent)" }} />
          <h2 className="text-lg font-extrabold tracking-[0.2em] uppercase font-display" style={{ color: "#ccfbf1" }}>
            My Travel Passport
          </h2>
          <div className="h-px mx-auto w-32 mt-4" style={{ background: "linear-gradient(90deg, transparent, rgba(20,184,166,0.3), transparent)" }} />
        </div>

        {/* Stats grid — 3x2 layout, no orphaned stats */}
        <div className="grid grid-cols-3 gap-5 mb-8">
          {/* Row 1 */}
          <div className="text-center">
            <p className="text-4xl font-extrabold text-white tabular-nums font-display leading-none">
              <AnimatedStat value={totalFlights} />
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] mt-2 font-medium" style={{ color: "rgba(153,246,228,0.5)" }}>Flights</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold text-white tabular-nums font-display leading-none">
              {formatDistance(totalDistance)}
              <span className="text-base font-semibold ml-1" style={{ color: "rgba(153,246,228,0.5)" }}>mi</span>
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] mt-2 font-medium" style={{ color: "rgba(153,246,228,0.5)" }}>Distance</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-extrabold text-white tabular-nums font-display leading-none">
              {formatDuration(totalDuration)}
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] mt-2 font-medium" style={{ color: "rgba(153,246,228,0.5)" }}>Flight Time</p>
          </div>

          {/* Row 2 */}
          <div className="text-center">
            <p className="text-4xl font-extrabold text-white tabular-nums font-display leading-none">
              <AnimatedStat value={uniqueAirports} />
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] mt-2 font-medium" style={{ color: "rgba(153,246,228,0.5)" }}>Airports</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-extrabold text-white tabular-nums font-display leading-none">
              <AnimatedStat value={uniqueAirlines} />
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] mt-2 font-medium" style={{ color: "rgba(153,246,228,0.5)" }}>Airlines</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-extrabold text-white tabular-nums font-display leading-none">
              <AnimatedStat value={uniqueCountries} />
            </p>
            <p className="text-[10px] uppercase tracking-[0.2em] mt-2 font-medium" style={{ color: "rgba(153,246,228,0.5)" }}>Countries</p>
          </div>
        </div>

        {/* Earth circumference comparison */}
        {totalDistance > 0 && (
          <div className="rounded-2xl p-5 mb-6" style={{ background: "rgba(20,184,166,0.06)", border: "1px solid rgba(20,184,166,0.1)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🌍</span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-medium" style={{ color: "rgba(153,246,228,0.4)" }}>Around the Earth</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ background: "rgba(20,184,166,0.1)" }}>
                <div className="h-full rounded-full transition-all duration-1000" style={{
                  width: `${Math.min((totalDistance / 24901) * 100, 100)}%`,
                  background: "linear-gradient(90deg, #0d9488, #14b8a6, #facc15)",
                }} />
              </div>
              <span className="text-sm font-bold text-white tabular-nums font-display">
                {((totalDistance / 24901) * 100).toFixed(0)}%
              </span>
            </div>
            <p className="text-[10px] mt-1.5" style={{ color: "rgba(153,246,228,0.3)" }}>
              {formatDistance(totalDistance)} of 24,901 miles
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center pt-6">
          <div className="h-px mx-auto w-32 mb-4" style={{ background: "linear-gradient(90deg, transparent, rgba(20,184,166,0.15), transparent)" }} />
          <p className="text-[8px] font-mono tracking-[0.3em] uppercase" style={{ color: "rgba(153,246,228,0.15)" }}>
            Travel Life &middot; grandloopstudio.com
          </p>
        </div>
      </div>
    </div>
  );
}
