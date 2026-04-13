import { type Trip, type InsertTrip, trips } from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

export interface IStorage {
  getTrips(): Promise<Trip[]>;
  getTrip(id: number): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: number, trip: Partial<InsertTrip>): Promise<Trip | undefined>;
  deleteTrip(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getTrips(): Promise<Trip[]> {
    return db.select().from(trips).orderBy(desc(trips.departureDate)).all();
  }

  async getTrip(id: number): Promise<Trip | undefined> {
    return db.select().from(trips).where(eq(trips.id, id)).get();
  }

  async createTrip(trip: InsertTrip): Promise<Trip> {
    return db.insert(trips).values(trip).returning().get();
  }

  async updateTrip(id: number, trip: Partial<InsertTrip>): Promise<Trip | undefined> {
    return db.update(trips).set(trip).where(eq(trips.id, id)).returning().get();
  }

  async deleteTrip(id: number): Promise<void> {
    db.delete(trips).where(eq(trips.id, id)).run();
  }
}

export const storage = new DatabaseStorage();
