import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  theme: text("theme").default("light"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  password: true,
});

export const updateUserProfileSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  theme: z.enum(["light", "dark"]).optional(),
  onboardingCompleted: z.boolean().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateUserProfile = z.infer<typeof updateUserProfileSchema>;
export type User = typeof users.$inferSelect;

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  role: true,
  content: true,
});

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;

export const activities = pgTable("activities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertActivitySchema = createInsertSchema(activities).pick({
  userId: true,
  type: true,
  description: true,
  metadata: true,
});

export type InsertActivity = z.infer<typeof insertActivitySchema>;
export type Activity = typeof activities.$inferSelect;

export const savedItems = pgTable("saved_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(),
  title: text("title").notNull(),
  data: json("data").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSavedItemSchema = createInsertSchema(savedItems).pick({
  userId: true,
  type: true,
  title: true,
  data: true,
});

export type InsertSavedItem = z.infer<typeof insertSavedItemSchema>;
export type SavedItem = typeof savedItems.$inferSelect;

// AI API Request/Response Schemas

export const aiRewriteRequestSchema = z.object({
  content: z.string().min(1),
  targetKeyword: z.string().optional(),
  tone: z.enum(["professional", "casual", "technical"]).optional(),
});

export const aiRewriteResponseSchema = z.object({
  rewrittenContent: z.string(),
  suggestions: z.array(z.string()),
  mode: z.string(),
});

export const aiExecutiveSummaryRequestSchema = z.object({
  reportText: z.string().min(1),
  maxLength: z.number().optional(),
});

export const aiExecutiveSummaryResponseSchema = z.object({
  summary: z.string(),
  keyPoints: z.array(z.string()),
  actionItems: z.array(z.string()),
  mode: z.string(),
});

export const aiOutlineRefineRequestSchema = z.object({
  outlineSeed: z.string().min(1),
  targetKeyword: z.string().min(1),
  targetAudience: z.string().optional(),
});

export const aiOutlineRefineResponseSchema = z.object({
  refinedOutline: z.array(z.object({
    heading: z.string(),
    subheadings: z.array(z.string()),
    keyPoints: z.array(z.string()),
  })),
  estimatedWordCount: z.number(),
  mode: z.string(),
});

export const aiChatRequestSchema = z.object({
  message: z.string().min(1),
  sessionContext: z.string().optional(),
});

export const aiChatResponseSchema = z.object({
  response: z.string(),
  suggestions: z.array(z.string()),
  mode: z.string(),
});

export type AIRewriteRequest = z.infer<typeof aiRewriteRequestSchema>;
export type AIRewriteResponse = z.infer<typeof aiRewriteResponseSchema>;
export type AIExecutiveSummaryRequest = z.infer<typeof aiExecutiveSummaryRequestSchema>;
export type AIExecutiveSummaryResponse = z.infer<typeof aiExecutiveSummaryResponseSchema>;
export type AIOutlineRefineRequest = z.infer<typeof aiOutlineRefineRequestSchema>;
export type AIOutlineRefineResponse = z.infer<typeof aiOutlineRefineResponseSchema>;
export type AIChatRequest = z.infer<typeof aiChatRequestSchema>;
export type AIChatResponse = z.infer<typeof aiChatResponseSchema>;
