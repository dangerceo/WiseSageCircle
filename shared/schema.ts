import { pgTable, text, serial, integer, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { sages as sagesData } from "@/lib/sages";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  username: text("username"),
  credits: integer("credits").notNull().default(10),
  createdAt: timestamp("created_at").defaultNow()
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  content: text("content").notNull(),
  response: text("response").notNull(),
  sages: json("sages").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

export const insertUserSchema = createInsertSchema(users).pick({
  sessionId: true,
  username: true
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  sages: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type User = typeof users.$inferSelect;
export type Message = typeof messages.$inferSelect;

export const sageSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  image: z.string(),
  prompt: z.string()
});

export type Sage = z.infer<typeof sageSchema>;
export const sages = sagesData;