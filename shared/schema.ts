import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").notNull(),
  createdAt: text("created_at").notNull().default(new Date().toISOString()),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true }).extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  displayName: z.string().min(1, "Display name is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const trips = sqliteTable("trips", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("user_id"),
  type: text("type").notNull(), // "flight" or "train"
  // Flight fields
  airline: text("airline"),
  flightNumber: text("flight_number"),
  // Train fields
  trainOperator: text("train_operator"),
  trainNumber: text("train_number"),
  trainClass: text("train_class"), // "first", "second", "business"
  // Common fields
  departureCity: text("departure_city").notNull(),
  departureCode: text("departure_code").notNull(), // IATA for flights, station code for trains
  departureCountry: text("departure_country").notNull(),
  arrivalCity: text("arrival_city").notNull(),
  arrivalCode: text("arrival_code").notNull(),
  arrivalCountry: text("arrival_country").notNull(),
  departureDate: text("departure_date").notNull(), // ISO date string
  arrivalDate: text("arrival_date").notNull(),
  departureTime: text("departure_time").notNull(), // HH:mm
  arrivalTime: text("arrival_time").notNull(),
  duration: integer("duration").notNull(), // minutes
  distance: real("distance"), // miles
  status: text("status").notNull().default("completed"), // "completed", "upcoming", "cancelled"
  notes: text("notes"),
});

export const insertTripSchema = createInsertSchema(trips).omit({ id: true }).extend({
  type: z.enum(["flight", "train"]),
  userId: z.number().nullable().optional(),
  departureCity: z.string().min(1, "Departure city is required"),
  departureCode: z.string().min(1, "Departure code is required"),
  departureCountry: z.string().min(1, "Departure country is required"),
  arrivalCity: z.string().min(1, "Arrival city is required"),
  arrivalCode: z.string().min(1, "Arrival code is required"),
  arrivalCountry: z.string().min(1, "Arrival country is required"),
  departureDate: z.string().min(1, "Departure date is required"),
  arrivalDate: z.string().min(1, "Arrival date is required"),
  departureTime: z.string().min(1, "Departure time is required"),
  arrivalTime: z.string().min(1, "Arrival time is required"),
  duration: z.number().min(1, "Duration is required"),
  status: z.enum(["completed", "upcoming", "cancelled"]).default("completed"),
});

export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Trip = typeof trips.$inferSelect;
