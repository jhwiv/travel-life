import { useState, useMemo, useEffect, useRef } from "react";
import { AIRPORTS } from "@/lib/airport-data";
import { getTrips, computeAnalytics } from "@/lib/static-data";
import type { Trip } from "@shared/schema";
import { getFlag } from "@/lib/country-flags";
import { CalendarDays, MapPin, Plane, Route } from "lucide-react";
import { geoPath } from "d3-geo";
import { feature } from "topojson-client";
import worldAtlas from "world-atlas/countries-110m.json";

/* ─── Fitted Bounding Box Projection ─── */
const VIEW_W = 960;
const VIEW_H = 580;

type Point = { x: number; y: number };
type CountryFeature = GeoJSON.Feature<GeoJSON.Polygon | GeoJSON.MultiPolygon, { name: string }>;

const WORLD_COUNTRIES = (
  feature(
    worldAtlas as any,
    (worldAtlas as any).objects.countries,
  ) as unknown as GeoJSON.FeatureCollection<GeoJSON.Polygon | GeoJSON.MultiPolygon, { name: string }>
).features;

const COUNTRY_NAME_ALIASES: Record<string, string> = {
  "United Kingdom": "United Kingdom",
  "United States": "United States of America",
  USA: "United States of America",
  "U.S.": "United States of America",
  "U.K.": "United Kingdom",
};

const FEATURE_NAME_ALIASES: Record<string, string> = {
  "United States of America": "United States",
};

function normalizeCountryName(name: string) {
  return COUNTRY_NAME_ALIASES[name] || name;
}

const COUNTRY_LABEL_POINTS: Record<string, { lat: number; lon: number; label?: string }> = {
  "United Kingdom": { lat: 54.4, lon: -2.7, label: "United Kingdom" },
  France: { lat: 46.6, lon: 2.4 },
  Netherlands: { lat: 52.2, lon: 5.3 },
  Denmark: { lat: 56.0, lon: 10.0 },
  Germany: { lat: 51.1, lon: 10.4 },
  Switzerland: { lat: 46.8, lon: 8.2 },
  Spain: { lat: 40.2, lon: -3.5 },
  Portugal: { lat: 39.6, lon: -8.0 },
  Italy: { lat: 42.8, lon: 12.5 },
  Greece: { lat: 39.1, lon: 22.8 },
};

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
    const project = (lat: number, lon: number): Point => ({
      x: ((lon + 180) / 360) * VIEW_W,
      y: (1 - (lat + 60) / 140) * VIEW_H,
    });
    const projection = {
      stream(stream: any) {
        return {
          point(lon: number, lat: number) {
            const { x, y } = project(lat, lon);
            stream.point(x, y);
          },
          lineStart() { stream.lineStart(); },
          lineEnd() { stream.lineEnd(); },
          polygonStart() { stream.polygonStart(); },
          polygonEnd() { stream.polygonEnd(); },
          sphere() { stream.sphere(); },
        };
      },
    };

    return {
      project,
      path: geoPath(projection as any),
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

  function project(lat: number, lon: number): Point {
    const x = PAD + ((lon - minLon) / (maxLon - minLon)) * (VIEW_W - PAD * 2);
    const my = mercY(lat);
    const yNorm = (my - yMin) / (yMax - yMin);
    const y = VIEW_H - PAD - yNorm * (VIEW_H - PAD * 2);
    return { x, y };
  }

  const projection = {
    stream(stream: any) {
      return {
        point(lon: number, lat: number) {
          const { x, y } = project(lat, lon);
          stream.point(x, y);
        },
        lineStart() {
          stream.lineStart();
        },
        lineEnd() {
          stream.lineEnd();
        },
        polygonStart() {
          stream.polygonStart();
        },
        polygonEnd() {
          stream.polygonEnd();
        },
        sphere() {
          stream.sphere();
        },
      };
    },
  };

  return { project, path: geoPath(projection as any), bounds: { minLon, maxLon, minLat, maxLat } };
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

/* ─── Legacy simplified coastline data retained as a fallback reference only ─── */
interface CoastPoint { lat: number; lon: number }
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
  LHR: { dx: -76, dy: -24, anchor: "end", leaderLine: true },
  CDG: { dx: 24, dy: 28, anchor: "start", leaderLine: true },
  AMS: { dx: 16, dy: -30, anchor: "start", leaderLine: true },
  BCN: { dx: -54, dy: 32, anchor: "end", leaderLine: true },
  FCO: { dx: 24, dy: 34, anchor: "start", leaderLine: true },
  MUC: { dx: 20, dy: -22, anchor: "start", leaderLine: true },
  LIS: { dx: -18, dy: 30, anchor: "end", leaderLine: true },
  ATH: { dx: 20, dy: 24, anchor: "start", leaderLine: true },
  SRQ: { dx: -100, dy: -55, anchor: "end", leaderLine: true },
  RSW: { dx: -100, dy: 0, anchor: "end", leaderLine: true },
  PBI: { dx: 80, dy: -50, anchor: "start", leaderLine: true },
  EYW: { dx: -100, dy: 55, anchor: "end", leaderLine: true },
  AUA: { dx: 20, dy: 8, anchor: "start" },
  CPH: { dx: 16, dy: -16, anchor: "start" },
  ZRH: { dx: 16, dy: 20, anchor: "start" },
};

const MAP_CITY_LABELS = [
  { label: "London", lat: 51.5072, lon: -0.1276, scale: "major" },
  { label: "Paris", lat: 48.8566, lon: 2.3522, scale: "major" },
  { label: "Amsterdam", lat: 52.3676, lon: 4.9041, scale: "minor" },
  { label: "Copenhagen", lat: 55.6761, lon: 12.5683, scale: "minor" },
  { label: "Munich", lat: 48.1351, lon: 11.582, scale: "minor" },
  { label: "Zurich", lat: 47.3769, lon: 8.5417, scale: "minor" },
  { label: "Milan", lat: 45.4642, lon: 9.19, scale: "minor" },
  { label: "Barcelona", lat: 41.3874, lon: 2.1686, scale: "minor" },
  { label: "Lisbon", lat: 38.7223, lon: -9.1393, scale: "minor" },
  { label: "Rome", lat: 41.9028, lon: 12.4964, scale: "minor" },
  { label: "Athens", lat: 37.9838, lon: 23.7275, scale: "minor" },
  { label: "North Sea", lat: 56.2, lon: 2.2, scale: "water" },
  { label: "Mediterranean Sea", lat: 38.0, lon: 10.0, scale: "water" },
  { label: "Atlantic Ocean", lat: 45.0, lon: -15.0, scale: "water" },
] as const;

function formatDistance(miles: number) {
  return miles.toLocaleString();
}

function formatDuration(minutes: number) {
  const days = Math.floor(minutes / 1440);
  const hours = Math.floor((minutes % 1440) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  return `${hours}h ${minutes % 60}m`;
}

function formatDate(dateString: string) {
  if (!dateString) return "";
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatShortDate(dateString: string) {
  if (!dateString) return "";
  return new Date(`${dateString}T12:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
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

  const { airports, arcs, mostRecent, projection, mapLabels, countryShapes, countryLabels } = useMemo(() => {
    const flights = trips.filter((t: any) => t.type === "flight" && t.status === "completed");
    const completedTrips = trips.filter((t: any) => t.status === "completed");
    const traveledCountries = new Set<string>();

    completedTrips.forEach((t: any) => {
      const depCountry = t.departureCountry || t.departure_country;
      const arrCountry = t.arrivalCountry || t.arrival_country;
      if (depCountry) traveledCountries.add(normalizeCountryName(depCountry));
      if (arrCountry) traveledCountries.add(normalizeCountryName(arrCountry));
    });

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
    const labelList = MAP_CITY_LABELS.map((label) => {
      const point = proj.project(label.lat, label.lon);
      return { ...label, ...point };
    }).filter((label) => label.x > 12 && label.x < VIEW_W - 12 && label.y > 12 && label.y < VIEW_H - 12);

    const shapes = WORLD_COUNTRIES.map((country: CountryFeature) => {
      const path = proj.path(country);
      if (!path) return null;
      const [[x0, y0], [x1, y1]] = proj.path.bounds(country);
      const visible = x1 >= -80 && x0 <= VIEW_W + 80 && y1 >= -80 && y0 <= VIEW_H + 80;
      if (!visible) return null;

      const rawName = country.properties?.name || "";
      const displayName = FEATURE_NAME_ALIASES[rawName] || rawName;
      const highlight = traveledCountries.has(rawName) || traveledCountries.has(displayName);

      return {
        id: rawName,
        name: displayName,
        path,
        highlight,
      };
    }).filter(Boolean) as { id: string; name: string; path: string; highlight: boolean }[];

    const labels = Array.from(traveledCountries)
      .map((countryName) => {
        const labelPoint = COUNTRY_LABEL_POINTS[countryName];
        if (!labelPoint) return null;
        const point = proj.project(labelPoint.lat, labelPoint.lon);
        if (point.x < 16 || point.x > VIEW_W - 16 || point.y < 16 || point.y > VIEW_H - 16) return null;
        return {
          name: labelPoint.label || countryName,
          x: point.x,
          y: point.y,
        };
      })
      .filter(Boolean) as { name: string; x: number; y: number }[];

    return {
      airports: Array.from(airportMap.values()),
      arcs: arcList,
      mostRecent: mostRecentArc,
      projection: proj,
      mapLabels: labelList,
      countryShapes: shapes,
      countryLabels: labels,
    };
  }, [trips]);

  const countries = analytics.countries || [];
  const totalFlights = analytics.totalFlights || 0;
  const totalDistance = analytics.totalDistance || 0;
  const totalDuration = analytics.totalDuration || 0;
  const uniqueAirports = analytics.uniqueAirports || 0;
  const uniqueAirlines = analytics.uniqueAirlines || 0;
  const uniqueCountries = analytics.uniqueCountries || 0;
  const sortedArcs = [...arcs].sort((a: any, b: any) => b.date.localeCompare(a.date));
  const routeManifest = sortedArcs.slice(0, 6);
  const hubList = [...airports].sort((a, b) => b.count - a.count).slice(0, 5);
  const yearTabs = Object.keys(analytics.tripsByYear || {}).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="min-h-screen animate-page-enter" style={{ background: "linear-gradient(180deg, #07131F 0%, #0A2032 38%, #071826 72%, #050B12 100%)" }}>
      {/* Full-width fitted map */}
      <div className="relative w-full overflow-hidden" style={{ height: "min(70vh, 720px)", minHeight: "520px" }}>
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          aria-hidden
        >
          <defs>
            {/* Ocean and terrain gradients: higher contrast, Flighty-passport inspired */}
            <radialGradient id="pp-ocean" cx="48%" cy="34%" r="82%">
              <stop offset="0%" stopColor="#1C6680" />
              <stop offset="42%" stopColor="#0D4A66" />
              <stop offset="78%" stopColor="#082F49" />
              <stop offset="100%" stopColor="#061827" />
            </radialGradient>

            <linearGradient id="pp-land" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9CB872" stopOpacity="0.74" />
              <stop offset="45%" stopColor="#5F8A64" stopOpacity="0.72" />
              <stop offset="100%" stopColor="#314F43" stopOpacity="0.82" />
            </linearGradient>

            <radialGradient id="pp-land-highlight" cx="50%" cy="42%" r="65%">
              <stop offset="0%" stopColor="#D3CDA1" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#2E5949" stopOpacity="0" />
            </radialGradient>

            <filter id="pp-terrain-texture" x="-10%" y="-10%" width="120%" height="120%">
              <feTurbulence type="fractalNoise" baseFrequency="0.012 0.04" numOctaves="3" seed="9" />
              <feColorMatrix type="saturate" values="0.32" />
              <feComponentTransfer>
                <feFuncA type="table" tableValues="0 0.16" />
              </feComponentTransfer>
            </filter>

            {/* Arc glow gradient — bright blue-white for more contrast */}
            <linearGradient id="pp-arc-glow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F8FBFF" stopOpacity="1" />
              <stop offset="42%" stopColor="#BFDBFE" stopOpacity="1" />
              <stop offset="100%" stopColor="#67E8F9" stopOpacity="0.95" />
            </linearGradient>

            {/* Gold gradient for most recent arc */}
            <linearGradient id="pp-arc-recent" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#facc15" stopOpacity="1" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
              <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.9" />
            </linearGradient>

            {/* Glow filters */}
            <filter id="pp-glow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
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

          {/* Ocean base, texture, and subtle navigation grid */}
          <rect width={VIEW_W} height={VIEW_H} fill="url(#pp-ocean)" />
          <rect width={VIEW_W} height={VIEW_H} fill="#ffffff" filter="url(#pp-terrain-texture)" opacity="0.42" />
          <pattern id="pp-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M60 0 L0 0 0 60" fill="none" stroke="rgba(219,234,254,0.075)" strokeWidth="0.5" />
          </pattern>
          <rect width={VIEW_W} height={VIEW_H} fill="url(#pp-grid)" />

          {/* Accurate country polygons from Natural Earth / world-atlas */}
          <g strokeLinecap="round" strokeLinejoin="round">
            {countryShapes.map((country) => (
              <path
                key={country.id}
                d={country.path}
                fill={country.highlight ? "url(#pp-land)" : "rgba(51,85,75,0.58)"}
                stroke={country.highlight ? "rgba(254,243,199,0.68)" : "rgba(203,213,225,0.24)"}
                strokeWidth={country.highlight ? 1.15 : 0.55}
                opacity={country.highlight ? 0.96 : 0.62}
              >
                <title>{country.name}</title>
              </path>
            ))}
          </g>
          <rect width={VIEW_W} height={VIEW_H} fill="url(#pp-land-highlight)" opacity="0.55" />

          {/* Geographic labels */}
          <g pointerEvents="none">
            {mapLabels.map((label) => {
              const isWater = label.scale === "water";
              const isMajor = label.scale === "major";
              return (
                <text
                  key={label.label}
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  fontFamily="'Satoshi', 'General Sans', 'Inter', ui-sans-serif, sans-serif"
                  fontSize={isMajor ? 15 : isWater ? 13 : 11}
                  fontWeight={isMajor ? 800 : 650}
                  letterSpacing={isWater ? "0.08em" : "0.01em"}
                  fill={isWater ? "rgba(219,234,254,0.54)" : "rgba(255,255,255,0.88)"}
                  stroke="rgba(2,6,23,0.82)"
                  strokeWidth={isWater ? 2.6 : 3.2}
                  paintOrder="stroke"
                  opacity={isWater ? 0.74 : 0.96}
                >
                  {label.label}
                </text>
              );
            })}
          </g>

          {/* Traveled country labels */}
          <g pointerEvents="none">
            {countryLabels.map((label) => (
              <text
                key={`country-${label.name}`}
                x={label.x}
                y={label.y}
                textAnchor="middle"
                fontFamily="'Satoshi', 'General Sans', 'Inter', ui-sans-serif, sans-serif"
                fontSize={12}
                fontWeight={850}
                letterSpacing="0.08em"
                fill="rgba(254,243,199,0.86)"
                stroke="rgba(2,6,23,0.86)"
                strokeWidth={3}
                paintOrder="stroke"
                opacity={0.88}
              >
                {label.name.toUpperCase()}
              </text>
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
                  stroke={isRecent ? "#facc15" : "#E0F2FE"}
                  strokeWidth={isHovered ? 15 : isRecent ? 12 : 8}
                  strokeOpacity={isHovered ? 0.55 : isRecent ? 0.36 : 0.25}
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
                  strokeWidth={isHovered ? 4.8 : isRecent ? 4 : 3.1}
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
            const baseR = isHub ? 7 : Math.min(4.6 + ap.count * 0.55, 6.3);
            return (
              <g key={ap.code}>
                {/* Outer pulse ring */}
                <circle cx={ap.x} cy={ap.y} r={baseR * 2.7} fill={isHub ? "#e0f2fe" : "#bae6fd"} fillOpacity="0.16" className="animate-dot-pulse">
                  <animate attributeName="r" values={`${baseR * 2.5};${baseR * 3.5};${baseR * 2.5}`} dur={`${3 + i * 0.15}s`} repeatCount="indefinite" />
                  <animate attributeName="fill-opacity" values="0.16;0.05;0.16" dur={`${3 + i * 0.15}s`} repeatCount="indefinite" />
                </circle>
                {/* Inner solid dot */}
                <circle cx={ap.x} cy={ap.y} r={baseR} fill={isHub ? "#7dd3fc" : "#e0f2fe"} fillOpacity="0.98" filter="url(#pp-dot-glow)" />
                {/* White center */}
                <circle cx={ap.x} cy={ap.y} r={baseR * 0.38} fill="white" fillOpacity="1" />
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
                    stroke="rgba(219,234,254,0.6)"
                    strokeWidth="1.1"
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
                  fill="rgba(3,7,18,0.82)"
                  stroke="rgba(219,234,254,0.34)"
                  strokeWidth="0.8"
                />
                {/* Label text */}
                <text
                  x={lx}
                  y={ly}
                  fill={isHub ? "#fef3c7" : "rgba(255,255,255,0.96)"}
                  fontSize={fontSize}
                  fontWeight="800"
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

        {/* Passport-style map header overlay */}
        <div className="absolute left-4 top-4 right-4 z-10 flex flex-col gap-3 sm:left-6 sm:right-6 md:flex-row md:items-start md:justify-between">
          <div className="rounded-[28px] px-5 py-4 shadow-2xl" style={{ background: "rgba(3,7,18,0.72)", border: "1px solid rgba(226,232,240,0.22)", backdropFilter: "blur(18px)" }}>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] font-bold" style={{ color: "rgba(191,219,254,0.72)" }}>
              <Plane className="w-3.5 h-3.5" />
              All-Time Passport
            </div>
            <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-1">
              <p className="text-3xl font-extrabold text-white tabular-nums font-display leading-none">
                {totalFlights}
              </p>
              <p className="pb-1 text-sm font-semibold text-white/72">
                flights across {uniqueCountries} countries
              </p>
            </div>
            <p className="mt-1 text-xs text-white/54">
              {formatDistance(totalDistance)} miles · {formatDuration(totalDuration)} in the air · {uniqueAirports} airports
            </p>
          </div>

          <div className="hidden rounded-2xl px-4 py-3 text-right shadow-2xl sm:block" style={{ background: "rgba(3,7,18,0.58)", border: "1px solid rgba(226,232,240,0.18)", backdropFilter: "blur(16px)" }}>
            <p className="text-[10px] uppercase tracking-[0.22em] text-white/42 font-bold">Latest Route</p>
            <p className="mt-1 text-lg font-extrabold text-white font-display">
              {mostRecent ? `${mostRecent.depCode} → ${mostRecent.arrCode}` : "No flights yet"}
            </p>
            {mostRecent && (
              <p className="text-xs text-white/52">
                {mostRecent.airline} {mostRecent.flightNum} · {formatShortDate(mostRecent.date)}
              </p>
            )}
          </div>
        </div>

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
        <div className="absolute bottom-0 left-0 right-0 h-32 pointer-events-none" style={{ background: "linear-gradient(180deg, transparent 0%, rgba(7,24,38,0.78) 58%, #071826 100%)" }} />
      </div>

      {/* Stats section below the map */}
      <div className="relative z-10 max-w-5xl mx-auto px-5 pb-16 -mt-16">
        <div className="rounded-[32px] p-4 sm:p-6 shadow-2xl" style={{ background: "rgba(248,250,252,0.94)", border: "1px solid rgba(255,255,255,0.72)", color: "#08111F", backdropFilter: "blur(20px)" }}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight font-display text-slate-950">
                Passport
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                A denser route map with city labels, hub counts, and a quick travel manifest.
              </p>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
              <span className="shrink-0 rounded-full bg-slate-950 px-4 py-2 text-xs font-bold text-white shadow-sm">All-Time</span>
              {yearTabs.map((year) => (
                <span key={year} className="shrink-0 rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500">
                  {year}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { label: "Flights", value: totalFlights.toLocaleString(), icon: Plane },
              { label: "Distance", value: `${formatDistance(totalDistance)} mi`, icon: Route },
              { label: "Airports", value: uniqueAirports.toLocaleString(), icon: MapPin },
              { label: "Countries", value: uniqueCountries.toLocaleString(), icon: CalendarDays },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200/80">
                <Icon className="mb-3 h-5 w-5 text-sky-700" />
                <p className="text-2xl font-extrabold tabular-nums text-slate-950 font-display">{value}</p>
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">{label}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-[1.35fr_0.9fr]">
            <div className="rounded-3xl p-4 sm:p-5" style={{ background: "linear-gradient(135deg, #1B0B4B 0%, #230049 52%, #071826 100%)" }}>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.26em] text-sky-200/64 font-bold">Passport · Pass · Pasaporte</p>
                  <h2 className="mt-1 text-xl font-extrabold text-white font-display">Route Manifest</h2>
                </div>
                <div className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold text-white/72">
                  {routeManifest.length} shown
                </div>
              </div>
              <div className="space-y-2">
                {routeManifest.map((arc: any) => (
                  <div key={`${arc.depCode}-${arc.arrCode}-${arc.date}-${arc.flightNum}`} className="flex items-center justify-between gap-3 rounded-2xl bg-white/[0.08] px-3 py-3 ring-1 ring-white/10">
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-white">
                        {arc.depCode} → {arc.arrCode}
                        <span className="ml-2 text-xs font-semibold text-sky-100/54">{arc.depCity} to {arc.arrCity}</span>
                      </p>
                      <p className="mt-0.5 truncate text-xs text-white/45">
                        {arc.airline} {arc.flightNum} · {formatDate(arc.date)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-extrabold tabular-nums text-amber-200">
                      {arc.distance?.toLocaleString()} mi
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-3xl bg-slate-950 p-5 text-white">
                <p className="text-[10px] uppercase tracking-[0.24em] text-sky-200/50 font-bold">Busiest Hubs</p>
                <div className="mt-4 space-y-3">
                  {hubList.map((hub) => (
                    <div key={hub.code} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-extrabold">{hub.code}</p>
                        <p className="text-xs text-white/42">{hub.city}</p>
                      </div>
                      <span className="rounded-full bg-sky-400/14 px-3 py-1 text-xs font-bold text-sky-100">
                        {hub.count} visits
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {countries.length > 0 && (
                <div className="rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200/80">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400 font-bold">Country Stamps</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {countries.map((c: string) => (
                      <span key={c} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600" title={c}>
                        <span className="mr-1.5">{getFlag(c)}</span>
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Country flags row */}
        {countries.length > 0 && (
          <div className="flex flex-wrap items-center justify-center gap-3 my-8">
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
