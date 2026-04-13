import { type Trip, type InsertTrip, type User, type InsertUser, trips, users } from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq, desc } from "drizzle-orm";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

export interface IStorage {
  // User methods
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>;
  // Trip methods
  getTrips(userId?: number): Promise<Trip[]>;
  getTrip(id: number): Promise<Trip | undefined>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  updateTrip(id: number, trip: Partial<InsertTrip>): Promise<Trip | undefined>;
  deleteTrip(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createUser(user: InsertUser): Promise<User> {
    return db.insert(users).values(user).returning().get();
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.username, username)).get();
  }

  async getUserById(id: number): Promise<User | undefined> {
    return db.select().from(users).where(eq(users.id, id)).get();
  }

  async getTrips(userId?: number): Promise<Trip[]> {
    if (userId !== undefined) {
      return db.select().from(trips).where(eq(trips.userId, userId)).orderBy(desc(trips.departureDate)).all();
    }
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
