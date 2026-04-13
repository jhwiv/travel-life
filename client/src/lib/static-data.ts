// LocalStorage-backed trip store — data persists across sessions
import seedTrips from "./trip-data.json";

const STORAGE_KEY = "travel-life-trips";

export interface Trip {
  id: number;
  type: string;
  airline: string | null;
  flight_number: string | null;
  train_operator: string | null;
  train_number: string | null;
  train_class: string | null;
  departure_city: string;
  departure_code: string;
  departure_country: string;
  arrival_city: string;
  arrival_code: string;
  arrival_country: string;
  departure_date: string;
  arrival_date: string;
  departure_time: string;
  arrival_time: string;
  duration: number;
  distance: number | null;
  status: string;
  notes: string | null;
}

function toCamelCase(trip: any): Trip & Record<string, any> {
  return {
    id: trip.id,
    type: trip.type,
    airline: trip.airline,
    flightNumber: trip.flightNumber || trip.flight_number,
    trainOperator: trip.trainOperator || trip.train_operator,
    trainNumber: trip.trainNumber || trip.train_number,
    trainClass: trip.trainClass || trip.train_class,
    departureCity: trip.departureCity || trip.departure_city,
    departureCode: trip.departureCode || trip.departure_code,
    departureCountry: trip.departureCountry || trip.departure_country,
    arrivalCity: trip.arrivalCity || trip.arrival_city,
    arrivalCode: trip.arrivalCode || trip.arrival_code,
    arrivalCountry: trip.arrivalCountry || trip.arrival_country,
    departureDate: trip.departureDate || trip.departure_date,
    arrivalDate: trip.arrivalDate || trip.arrival_date,
    departureTime: trip.departureTime || trip.departure_time,
    arrivalTime: trip.arrivalTime || trip.arrival_time,
    duration: trip.duration,
    distance: trip.distance,
    status: trip.status,
    notes: trip.notes,
    // Keep snake_case versions too for compat
    flight_number: trip.flightNumber || trip.flight_number,
    train_operator: trip.trainOperator || trip.train_operator,
    train_number: trip.trainNumber || trip.train_number,
    train_class: trip.trainClass || trip.train_class,
    departure_city: trip.departureCity || trip.departure_city,
    departure_code: trip.departureCode || trip.departure_code,
    departure_country: trip.departureCountry || trip.departure_country,
    arrival_city: trip.arrivalCity || trip.arrival_city,
    arrival_code: trip.arrivalCode || trip.arrival_code,
    arrival_country: trip.arrivalCountry || trip.arrival_country,
    departure_date: trip.departureDate || trip.departure_date,
    arrival_date: trip.arrivalDate || trip.arrival_date,
    departure_time: trip.departureTime || trip.departure_time,
    arrival_time: trip.arrivalTime || trip.arrival_time,
  };
}

function loadFromStorage(): (Trip & Record<string, any>)[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed with pre-populated flight data on first visit
      const seeded = (seedTrips as any[]).map(toCamelCase);
      saveToStorage(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(toCamelCase);
  } catch {
    return [];
  }
}

function saveToStorage(trips: (Trip & Record<string, any>)[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch {
    // Storage full or unavailable — fail silently
  }
}

// In-memory store backed by localStorage
let _trips = loadFromStorage();
let _nextId = _trips.length > 0 ? Math.max(..._trips.map(t => t.id)) + 1 : 1;

export function getTrips() {
  return [..._trips];
}

export function addTrip(data: any) {
  const newTrip = toCamelCase({ ...data, id: _nextId++ });
  _trips.push(newTrip);
  saveToStorage(_trips);
  return newTrip;
}

export function deleteTrip(id: number) {
  _trips = _trips.filter(t => t.id !== id);
  saveToStorage(_trips);
}

export function computeAnalytics() {
  const completedTrips = _trips.filter(t => t.status === "completed");
  const flights = completedTrips.filter(t => t.type === "flight");
  const trains = completedTrips.filter(t => t.type === "train");

  const totalDistance = completedTrips.reduce((sum, t) => sum + (t.distance || 0), 0);
  const totalDuration = completedTrips.reduce((sum, t) => sum + t.duration, 0);

  const allCities = new Set<string>();
  const allCountries = new Set<string>();
  const allAirlines = new Set<string>();
  const allTrainOperators = new Set<string>();
  const allStations = new Set<string>();

  completedTrips.forEach(t => {
    allCities.add(t.departureCity || t.departure_city);
    allCities.add(t.arrivalCity || t.arrival_city);
    allCountries.add(t.departureCountry || t.departure_country);
    allCountries.add(t.arrivalCountry || t.arrival_country);
    if (t.type === "flight") {
      allStations.add(t.departureCode || t.departure_code);
      allStations.add(t.arrivalCode || t.arrival_code);
      if (t.airline) allAirlines.add(t.airline);
    }
    if (t.type === "train" && (t.trainOperator || t.train_operator)) {
      allTrainOperators.add(t.trainOperator || t.train_operator);
    }
  });

  const tripsByYear: Record<string, number> = {};
  completedTrips.forEach(t => {
    const date = t.departureDate || t.departure_date;
    const year = date.substring(0, 4);
    tripsByYear[year] = (tripsByYear[year] || 0) + 1;
  });

  const currentYear = new Date().getFullYear().toString();
  const tripsByMonth: Record<string, number> = {};
  completedTrips
    .filter(t => (t.departureDate || t.departure_date).startsWith(currentYear))
    .forEach(t => {
      const date = t.departureDate || t.departure_date;
      const month = date.substring(5, 7);
      tripsByMonth[month] = (tripsByMonth[month] || 0) + 1;
    });

  const routeCounts: Record<string, number> = {};
  completedTrips.forEach(t => {
    const depCode = t.departureCode || t.departure_code;
    const arrCode = t.arrivalCode || t.arrival_code;
    const route = `${depCode} → ${arrCode}`;
    routeCounts[route] = (routeCounts[route] || 0) + 1;
  });
  const topRoutes = Object.entries(routeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([route, count]) => ({ route, count }));

  const flightDistance = flights.reduce((s, t) => s + (t.distance || 0), 0);
  const trainDistance = trains.reduce((s, t) => s + (t.distance || 0), 0);

  return {
    totalTrips: completedTrips.length,
    totalFlights: flights.length,
    totalTrains: trains.length,
    totalDistance: Math.round(totalDistance),
    totalDuration,
    uniqueCities: allCities.size,
    uniqueCountries: allCountries.size,
    uniqueAirports: allStations.size,
    uniqueAirlines: allAirlines.size,
    uniqueTrainOperators: allTrainOperators.size,
    countries: Array.from(allCountries),
    tripsByYear,
    tripsByMonth,
    topRoutes,
    flightDistance: Math.round(flightDistance),
    trainDistance: Math.round(trainDistance),
  };
}
