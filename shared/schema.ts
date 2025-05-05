import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// This file is kept minimal as we're using JSON storage instead of the database
// for the Pro Course examination platform as per requirements

// Define the type for our JSON-based user
export interface User {
  id: string;
  email: string;
  name: string;
  preferredField?: string; // Preferred certification field
}

// Keep the database schema for compatibility, but we're using the JSON-based User interface above
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type DBUser = typeof users.$inferSelect; // Renamed to DBUser to avoid confusion
