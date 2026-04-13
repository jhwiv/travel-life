import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTripSchema } from "@shared/schema";
import { requireAuth } from "./auth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Get all trips (filtered by user)
  app.get("/api/trips", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const trips = await storage.getTrips(userId);
    res.json(trips);
  });

  // Get single trip
  app.get("/api/trips/:id", requireAuth, async (req, res) => {
    const trip = await storage.getTrip(Number(req.params.id));
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    if (trip.userId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
    res.json(trip);
  });

  // Create trip
  app.post("/api/trips", requireAuth, async (req, res) => {
    const result = insertTripSchema.safeParse({
      ...req.body,
      userId: req.user!.id,
    });
    if (!result.success) {
      return res.status(400).json({ error: result.error.flatten() });
    }
    const trip = await storage.createTrip(result.data);
    res.status(201).json(trip);
  });

  // Update trip
  app.patch("/api/trips/:id", requireAuth, async (req, res) => {
    const existing = await storage.getTrip(Number(req.params.id));
    if (!existing) return res.status(404).json({ error: "Trip not found" });
    if (existing.userId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
    const trip = await storage.updateTrip(Number(req.params.id), req.body);
    if (!trip) return res.status(404).json({ error: "Trip not found" });
    res.json(trip);
  });

  // Delete trip
  app.delete("/api/trips/:id", requireAuth, async (req, res) => {
    const existing = await storage.getTrip(Number(req.params.id));
    if (!existing) return res.status(404).json({ error: "Trip not found" });
    if (existing.userId !== req.user!.id) return res.status(403).json({ error: "Forbidden" });
    await storage.deleteTrip(Number(req.params.id));
    res.status(204).end();
  });

  // Analytics endpoint (filtered by user)
  app.get("/api/analytics", requireAuth, async (req, res) => {
    const userId = req.user!.id;
    const trips = await storage.getTrips(userId);

    const completedTrips = trips.filter(t => t.status === "completed");
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
      allCities.add(t.departureCity);
      allCities.add(t.arrivalCity);
      allCountries.add(t.departureCountry);
      allCountries.add(t.arrivalCountry);
      if (t.type === "flight") {
        allStations.add(t.departureCode);
        allStations.add(t.arrivalCode);
        if (t.airline) allAirlines.add(t.airline);
      }
      if (t.type === "train" && t.trainOperator) {
        allTrainOperators.add(t.trainOperator);
      }
    });

    const tripsByYear: Record<string, number> = {};
    completedTrips.forEach(t => {
      const year = t.departureDate.substring(0, 4);
      tripsByYear[year] = (tripsByYear[year] || 0) + 1;
    });

    const currentYear = new Date().getFullYear().toString();
    const tripsByMonth: Record<string, number> = {};
    completedTrips.filter(t => t.departureDate.startsWith(currentYear)).forEach(t => {
      const month = t.departureDate.substring(5, 7);
      tripsByMonth[month] = (tripsByMonth[month] || 0) + 1;
    });

    const routeCounts: Record<string, number> = {};
    completedTrips.forEach(t => {
      const route = `${t.departureCode} → ${t.arrivalCode}`;
      routeCounts[route] = (routeCounts[route] || 0) + 1;
    });
    const topRoutes = Object.entries(routeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([route, count]) => ({ route, count }));

    const flightDistance = flights.reduce((s, t) => s + (t.distance || 0), 0);
    const trainDistance = trains.reduce((s, t) => s + (t.distance || 0), 0);

    res.json({
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
    });
  });

  return httpServer;
}
