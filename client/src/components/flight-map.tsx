import { useState, useMemo } from "react";
import { AIRPORTS } from "@/lib/airport-data";
import type { Trip } from "@shared/schema";

/* ─── Fitted Bounding Box Projection ─── */
const VIEW_W = 960;
const VIEW_H = 520;

function createFittedProjection(airportCodes: string[]) {
  const coords = airportCodes
    .map((c) => AIRPORTS[c])
    .filter(Boolean)
    .map((a) => ({ lat: a.lat, lon: a.lon }));

  if (coords.length === 0) {
    return {
      project: (lat: number, lon: number) => ({
        x: ((lon + 180) / 360) * VIEW_W,
        y: (1 - (lat + 60) / 140) * VIEW_H,
      }),
    };
  }

  let minLat = Infinity, maxLat = -Infinity, minLon = Infinity, maxLon = -Infinity;
  for (const c of coords) {
    if (c.lat < minLat) minLat = c.lat;
    if (c.lat > maxLat) maxLat = c.lat;
    if (c.lon < minLon) minLon = c.lon;
    if (c.lon > maxLon) maxLon = c.lon;
  }

  const latRange = maxLat - minLat || 10;
  const lonRange = maxLon - minLon || 10;
  const padLat = latRange * 0.35;
  const padLon = lonRange * 0.35;
  minLat -= padLat;
  maxLat += padLat;
  minLon -= padLon;
  maxLon += padLon;
  minLat = Math.max(minLat, -70);
  maxLat = Math.min(maxLat, 80);

  function mercY(lat: number) {
    const latRad = (Math.max(-70, Math.min(80, lat)) * Math.PI) / 180;
    return Math.log(Math.tan(Math.PI / 4 + latRad / 2));
  }

  const yMin = mercY(minLat);
  const yMax = mercY(maxLat);
  const PAD = 60;

  function project(lat: number, lon: number) {
    const x = PAD + ((lon - minLon) / (maxLon - minLon)) * (VIEW_W - PAD * 2);
    const my = mercY(lat);
    const yNorm = (my - yMin) / (yMax - yMin);
    const y = VIEW_H - PAD - yNorm * (VIEW_H - PAD * 2);
    return { x, y };
  }

  return { project };
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

/* ─── Simplified coastlines ─── */
interface CoastPoint { lat: number; lon: number }

const COASTLINES: { name: string; points: CoastPoint[] }[] = [
  { name: "us-east", points: [
    { lat: 47.0, lon: -67.0 }, { lat: 45.0, lon: -67.0 }, { lat: 43.5, lon: -70.0 },
    { lat: 42.0, lon: -70.5 }, { lat: 41.2, lon: -72.0 }, { lat: 40.5, lon: -74.0 },
    { lat: 39.5, lon: -74.5 }, { lat: 38.5, lon: -75.5 }, { lat: 37.0, lon: -76.0 },
    { lat: 35.0, lon: -75.5 }, { lat: 33.5, lon: -78.0 }, { lat: 32.0, lon: -80.5 },
    { lat: 30.5, lon: -81.5 }, { lat: 28.0, lon: -80.5 }, { lat: 26.0, lon: -80.0 },
    { lat: 25.0, lon: -80.5 }, { lat: 24.5, lon: -81.8 }, { lat: 25.0, lon: -81.5 },
    { lat: 26.5, lon: -82.0 }, { lat: 28.0, lon: -82.8 }, { lat: 29.5, lon: -83.5 },
    { lat: 30.0, lon: -85.5 }, { lat: 30.2, lon: -88.0 }, { lat: 29.5, lon: -89.5 },
  ]},
  { name: "cuba", points: [
    { lat: 22.0, lon: -84.0 }, { lat: 22.5, lon: -81.5 }, { lat: 23.0, lon: -80.0 },
    { lat: 22.5, lon: -78.0 }, { lat: 21.5, lon: -77.0 }, { lat: 20.5, lon: -75.0 },
    { lat: 20.0, lon: -74.5 }, { lat: 20.5, lon: -76.0 }, { lat: 21.0, lon: -78.0 },
    { lat: 21.5, lon: -80.0 }, { lat: 22.0, lon: -82.0 }, { lat: 22.0, lon: -84.0 },
  ]},
  { name: "venezuela", points: [
    { lat: 12.0, lon: -72.0 }, { lat: 11.5, lon: -71.5 }, { lat: 11.0, lon: -70.0 },
    { lat: 10.5, lon: -68.0 }, { lat: 10.5, lon: -66.0 }, { lat: 10.5, lon: -64.0 },
  ]},
  { name: "colombia", points: [
    { lat: 12.5, lon: -72.0 }, { lat: 11.5, lon: -73.0 }, { lat: 11.0, lon: -75.0 },
    { lat: 10.5, lon: -76.0 }, { lat: 9.0, lon: -77.5 },
  ]},
  { name: "iberia", points: [
    { lat: 43.5, lon: -8.0 }, { lat: 42.5, lon: -9.0 }, { lat: 39.5, lon: -9.5 },
    { lat: 37.0, lon: -8.5 }, { lat: 36.0, lon: -5.5 }, { lat: 37.5, lon: -1.5 },
    { lat: 39.5, lon: 0.5 }, { lat: 41.5, lon: 2.0 }, { lat: 42.5, lon: 3.0 },
    { lat: 43.5, lon: 1.0 }, { lat: 43.5, lon: -2.0 }, { lat: 43.5, lon: -8.0 },
  ]},
  { name: "france-west", points: [
    { lat: 43.5, lon: -2.0 }, { lat: 46.0, lon: -1.5 }, { lat: 47.5, lon: -3.0 },
    { lat: 48.5, lon: -5.0 }, { lat: 48.8, lon: -3.5 }, { lat: 49.0, lon: -1.5 },
    { lat: 49.5, lon: 0.0 }, { lat: 51.0, lon: 2.0 },
  ]},
  { name: "britain", points: [
    { lat: 50.5, lon: -5.0 }, { lat: 51.5, lon: -5.0 }, { lat: 52.5, lon: -5.0 },
    { lat: 53.5, lon: -4.5 }, { lat: 54.5, lon: -5.5 }, { lat: 55.5, lon: -5.5 },
    { lat: 57.0, lon: -6.0 }, { lat: 58.5, lon: -5.0 }, { lat: 58.5, lon: -3.0 },
    { lat: 57.0, lon: -2.0 }, { lat: 55.5, lon: -1.5 }, { lat: 54.0, lon: -0.5 },
    { lat: 53.0, lon: 0.5 }, { lat: 52.0, lon: 1.5 }, { lat: 51.0, lon: 1.5 },
    { lat: 50.5, lon: 0.0 }, { lat: 50.5, lon: -3.0 }, { lat: 50.5, lon: -5.0 },
  ]},
  { name: "scandinavia-s", points: [
    { lat: 54.5, lon: 8.5 }, { lat: 55.0, lon: 8.5 }, { lat: 55.5, lon: 9.5 },
    { lat: 56.0, lon: 10.5 }, { lat: 56.5, lon: 10.0 }, { lat: 57.5, lon: 10.5 },
    { lat: 57.5, lon: 12.0 }, { lat: 56.5, lon: 13.0 }, { lat: 55.5, lon: 13.5 },
    { lat: 55.5, lon: 12.5 }, { lat: 55.0, lon: 12.0 },
  ]},
  { name: "north-europe", points: [
    { lat: 51.5, lon: 3.5 }, { lat: 52.5, lon: 5.0 }, { lat: 53.5, lon: 6.0 },
    { lat: 54.0, lon: 8.0 }, { lat: 54.5, lon: 8.5 },
  ]},
  { name: "nw-africa", points: [
    { lat: 36.0, lon: -5.5 }, { lat: 35.0, lon: -2.0 }, { lat: 34.0, lon: -1.5 },
    { lat: 33.0, lon: -1.0 }, { lat: 32.0, lon: -1.0 }, { lat: 30.0, lon: -3.0 },
    { lat: 28.0, lon: -9.5 }, { lat: 27.5, lon: -13.0 },
  ]},
  { name: "nw-africa-west", points: [
    { lat: 36.0, lon: -5.5 }, { lat: 35.5, lon: -6.0 }, { lat: 34.0, lon: -6.5 },
    { lat: 33.0, lon: -7.5 }, { lat: 32.0, lon: -9.0 }, { lat: 30.0, lon: -10.0 },
    { lat: 28.0, lon: -9.5 },
  ]},
];

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

interface FlightMapProps {
  trips: Trip[];
  variant?: "hero" | "background" | "compact";
  className?: string;
}

export default function FlightMap({ trips, variant = "hero", className = "" }: FlightMapProps) {
  const [hoveredArc, setHoveredArc] = useState<number | null>(null);

  const { airports, arcs, mostRecent, projection } = useMemo(() => {
    const flights = trips.filter(t => t.type === "flight" && t.status === "completed");

    const allCodes = new Set<string>();
    flights.forEach(t => {
      const depCode = (t as any).departureCode || (t as any).departure_code;
      const arrCode = (t as any).arrivalCode || (t as any).arrival_code;
      if (depCode) allCodes.add(depCode);
      if (arrCode) allCodes.add(arrCode);
    });

    const proj = createFittedProjection(Array.from(allCodes));

    const airportMap = new Map<string, { code: string; x: number; y: number; count: number; city: string }>();
    flights.forEach(t => {
      const depCode = (t as any).departureCode || (t as any).departure_code;
      const arrCode = (t as any).arrivalCode || (t as any).arrival_code;
      const depCity = (t as any).departureCity || (t as any).departure_city;
      const arrCity = (t as any).arrivalCity || (t as any).arrival_city;

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

    const arcList = flights.map((t, i) => {
      const depCode = (t as any).departureCode || (t as any).departure_code;
      const arrCode = (t as any).arrivalCode || (t as any).arrival_code;
      const depInfo = AIRPORTS[depCode];
      const arrInfo = AIRPORTS[arrCode];
      if (!depInfo || !arrInfo) return null;
      const from = proj.project(depInfo.lat, depInfo.lon);
      const to = proj.project(arrInfo.lat, arrInfo.lon);
      return {
        id: i,
        depCode,
        arrCode,
        depCity: (t as any).departureCity || (t as any).departure_city,
        arrCity: (t as any).arrivalCity || (t as any).arrival_city,
        date: (t as any).departureDate || (t as any).departure_date || "",
        airline: (t as any).airline || "",
        flightNum: (t as any).flightNumber || (t as any).flight_number || "",
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

  const isBackground = variant === "background";
  const isCompact = variant === "compact";

  const wrapperClasses = isBackground
    ? `absolute inset-0 w-full h-full ${className}`
    : isCompact
    ? `relative w-full overflow-hidden rounded-xl ${className}`
    : `relative w-full overflow-hidden rounded-2xl ${className}`;

  const heightStyle = isBackground
    ? {}
    : isCompact
    ? { minHeight: "300px" }
    : { minHeight: "420px", maxHeight: "560px" };

  return (
    <div
      className={wrapperClasses}
      style={{
        background: isBackground ? "transparent" : "linear-gradient(180deg, #0F172A 0%, #0D2137 50%, #0F172A 100%)",
        ...heightStyle,
      }}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden
      >
        <defs>
          <pattern id="fm-grid" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M60 0 L0 0 0 60" fill="none" stroke="rgba(20,184,166,0.035)" strokeWidth="0.5" />
          </pattern>

          <linearGradient id="fm-arc-glow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#14b8a6" stopOpacity="1" />
            <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="fm-arc-recent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#facc15" stopOpacity="1" />
            <stop offset="50%" stopColor="#f59e0b" stopOpacity="1" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.9" />
          </linearGradient>

          <filter id="fm-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="fm-glow-strong" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="fm-dot-glow" x="-60%" y="-60%" width="220%" height="220%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <symbol id="fm-plane" viewBox="0 0 24 24">
            <path d="M21 16v-2l-8-5V3.5A1.5 1.5 0 0 0 11.5 2 1.5 1.5 0 0 0 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" fill="currentColor" />
          </symbol>
        </defs>

        {/* Background grid */}
        <rect width={VIEW_W} height={VIEW_H} fill="url(#fm-grid)" />

        {/* Coastline outlines */}
        <g fill="none" stroke="rgba(20,184,166,0.12)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          {COASTLINES.map((coast) => (
            <polyline
              key={coast.name}
              points={coastToSvgPoints(coast.points, projection.project)}
              fill="none"
            />
          ))}
        </g>

        {/* Arc glow layer */}
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
                filter="url(#fm-glow)"
                className="animate-passport-arc"
                style={{ animationDelay: `${0.15 * i}s` }}
              />
            );
          })}
        </g>

        {/* Flight arcs */}
        <g fill="none">
          {arcs.map((arc: any, i: number) => {
            const isRecent = mostRecent && arc.id === mostRecent.id;
            const isHovered = hoveredArc === i;
            return (
              <path
                key={`arc-${i}`}
                d={arc.path}
                stroke={isRecent ? "url(#fm-arc-recent)" : "url(#fm-arc-glow)"}
                strokeWidth={isHovered ? 3 : isRecent ? 2.5 : 1.8}
                strokeLinecap="round"
                className="animate-passport-arc"
                style={{
                  animationDelay: `${0.15 * i}s`,
                  cursor: "pointer",
                  transition: "stroke-width 0.2s ease",
                }}
                filter={isHovered || isRecent ? "url(#fm-glow-strong)" : undefined}
                onMouseEnter={() => setHoveredArc(i)}
                onMouseLeave={() => setHoveredArc(null)}
              />
            );
          })}
        </g>

        {/* Animated plane */}
        {mostRecent && (
          <g className="animate-plane-travel" style={{ color: "#fbbf24" }}>
            <animateMotion
              dur="4s"
              begin="1.5s"
              repeatCount="indefinite"
              rotate="auto"
              path={mostRecent.path}
            />
            <use href="#fm-plane" x="-8" y="-8" width="16" height="16" />
          </g>
        )}

        {/* Airport dots */}
        {airports.map((ap, i) => {
          const isHub = ap.count >= 4;
          const baseR = isHub ? 6 : Math.min(4 + ap.count * 0.5, 5.5);
          return (
            <g key={ap.code}>
              <circle cx={ap.x} cy={ap.y} r={baseR * 2.5} fill={isHub ? "#22d3ee" : "#14b8a6"} fillOpacity="0.08" className="animate-dot-pulse">
                <animate attributeName="r" values={`${baseR * 2.5};${baseR * 3.5};${baseR * 2.5}`} dur={`${3 + i * 0.15}s`} repeatCount="indefinite" />
                <animate attributeName="fill-opacity" values="0.08;0.03;0.08" dur={`${3 + i * 0.15}s`} repeatCount="indefinite" />
              </circle>
              <circle cx={ap.x} cy={ap.y} r={baseR} fill={isHub ? "#22d3ee" : "#14b8a6"} fillOpacity="0.95" filter="url(#fm-dot-glow)" />
              <circle cx={ap.x} cy={ap.y} r={baseR * 0.3} fill="white" fillOpacity="0.9" />
            </g>
          );
        })}

        {/* Airport labels with leader lines */}
        {airports.map((ap) => {
          const isHub = ap.count >= 4;
          const fixedOffset = LABEL_OFFSETS[ap.code];
          const dx = fixedOffset ? fixedOffset.dx : 14;
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

      {/* "FLIGHT MAP" badge */}
      {!isBackground && (
        <div className="absolute top-3 left-4 flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono text-teal-300/60 tracking-wider uppercase">
            <span className="inline-block w-2 h-2 rounded-full bg-teal-400/80 animate-dot-pulse" />
            Flight Map
          </div>
          {mostRecent && (
            <div className="text-[9px] font-mono text-amber-300/50 tracking-wider ml-2">
              Latest: {mostRecent.depCode} → {mostRecent.arrCode}
            </div>
          )}
        </div>
      )}

      {/* Stats overlay */}
      {variant === "hero" && (
        <div className="absolute bottom-3 right-4 flex items-center gap-3">
          <div className="text-[10px] font-mono text-white/40 tabular-nums">
            {airports.length} airports
          </div>
          <div className="text-[10px] font-mono text-white/40 tabular-nums">
            {arcs.length} flights
          </div>
        </div>
      )}

      {/* Tooltip */}
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
    </div>
  );
}
