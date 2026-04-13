/**
 * Flight route lookup via the free adsbdb.com API.
 * No API key needed. Returns origin/destination airports for a given flight number.
 * API format: https://api.adsbdb.com/v0/callsign/{IATA_FLIGHT_NUMBER}
 */

export interface FlightRouteResult {
  origin: {
    iata: string;
    city: string;
    country: string;
    name: string;
  };
  destination: {
    iata: string;
    city: string;
    country: string;
    name: string;
  };
  airlineName?: string;
}

interface AdsdbResponse {
  response:
    | string
    | {
        flightroute: {
          callsign_iata: string;
          airline?: {
            name: string;
            iata: string;
          };
          origin: {
            iata_code: string;
            municipality: string;
            country_name: string;
            name: string;
          };
          destination: {
            iata_code: string;
            municipality: string;
            country_name: string;
            name: string;
          };
        };
      };
}

// Simple in-memory cache to avoid duplicate requests
const cache = new Map<string, FlightRouteResult | null>();

/**
 * Look up a flight route by IATA flight number (e.g. "SK903", "BA115").
 * Returns null if the flight is unknown or the API is unreachable.
 */
export async function lookupFlightRoute(
  flightNumber: string
): Promise<FlightRouteResult | null> {
  const key = flightNumber.toUpperCase().replace(/\s+/g, "");
  if (key.length < 3) return null; // Need at least airline code + 1 digit

  // Check cache
  if (cache.has(key)) return cache.get(key) ?? null;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000); // 5s timeout

    const res = await fetch(
      `https://api.adsbdb.com/v0/callsign/${encodeURIComponent(key)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!res.ok) {
      cache.set(key, null);
      return null;
    }

    const data: AdsdbResponse = await res.json();

    if (typeof data.response === "string") {
      // "unknown callsign" or "invalid callsign"
      cache.set(key, null);
      return null;
    }

    const route = data.response.flightroute;
    const result: FlightRouteResult = {
      origin: {
        iata: route.origin.iata_code,
        city: route.origin.municipality,
        country: route.origin.country_name,
        name: route.origin.name,
      },
      destination: {
        iata: route.destination.iata_code,
        city: route.destination.municipality,
        country: route.destination.country_name,
        name: route.destination.name,
      },
      airlineName: route.airline?.name,
    };

    cache.set(key, result);
    return result;
  } catch {
    // Network error, timeout, CORS — fail silently
    cache.set(key, null);
    return null;
  }
}
