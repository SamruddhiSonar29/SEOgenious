import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, json, integer } from "drizzle-orm/pg-core";
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

// SEO Audits Table
export const audits = pgTable("audits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  url: text("url").notNull(),
  score: integer("score").notNull().default(0),
  status: text("status").notNull().default("pending"),
  findings: json("findings").$type<AuditFinding[]>().notNull(),
  recommendations: json("recommendations").$type<string[]>().notNull(),
  metadata: json("metadata").$type<AuditMetadata>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAuditSchema = createInsertSchema(audits).pick({
  userId: true,
  url: true,
  score: true,
  status: true,
  findings: true,
  recommendations: true,
  metadata: true,
});

export type InsertAudit = z.infer<typeof insertAuditSchema>;
export type Audit = typeof audits.$inferSelect;

// SEO Audit Types
export type AuditFinding = {
  category: string;
  severity: "critical" | "warning" | "info";
  message: string;
  element?: string;
  suggestion?: string;
};

export type AuditMetadata = {
  crawlTimeMs?: number;
  pageSize?: number;
  loadTime?: number;
  resourceCount?: number;
  totalLinks?: number;
  internalLinks?: number;
  externalLinks?: number;
};

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

// SEO Audit API Request/Response Schemas

export const runAuditRequestSchema = z.object({
  url: z.string().url("Must be a valid URL"),
});

export const runAuditResponseSchema = z.object({
  id: z.string(),
  status: z.string(),
  message: z.string(),
});

export const auditResultResponseSchema = z.object({
  id: z.string(),
  url: z.string(),
  score: z.number().int().min(0).max(100),
  status: z.string(),
  findings: z.array(z.object({
    category: z.string(),
    severity: z.enum(["critical", "warning", "info"]),
    message: z.string(),
    element: z.string().optional(),
    suggestion: z.string().optional(),
  })),
  recommendations: z.array(z.string()),
  metadata: z.object({
    crawlTimeMs: z.number().optional(),
    pageSize: z.number().optional(),
    loadTime: z.number().optional(),
    resourceCount: z.number().optional(),
    totalLinks: z.number().optional(),
    internalLinks: z.number().optional(),
    externalLinks: z.number().optional(),
  }).optional(),
  createdAt: z.string(),
});

export const auditHistoryResponseSchema = z.object({
  audits: z.array(auditResultResponseSchema),
  total: z.number(),
});

export type RunAuditRequest = z.infer<typeof runAuditRequestSchema>;
export type RunAuditResponse = z.infer<typeof runAuditResponseSchema>;
export type AuditResultResponse = z.infer<typeof auditResultResponseSchema>;
export type AuditHistoryResponse = z.infer<typeof auditHistoryResponseSchema>;

// Rank Tracking Tables
export const keywords = pgTable("keywords", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  keyword: text("keyword").notNull(),
  targetUrl: text("target_url").notNull(),
  searchEngine: text("search_engine").notNull().default("google"),
  location: text("location"),
  device: text("device").notNull().default("desktop"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertKeywordSchema = createInsertSchema(keywords).pick({
  userId: true,
  keyword: true,
  targetUrl: true,
  searchEngine: true,
  location: true,
  device: true,
});

export type InsertKeyword = z.infer<typeof insertKeywordSchema>;
export type Keyword = typeof keywords.$inferSelect;

export const rankSnapshots = pgTable("rank_snapshots", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  keywordId: varchar("keyword_id").notNull(),
  rank: integer("rank"),
  page: integer("page"),
  url: text("url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRankSnapshotSchema = createInsertSchema(rankSnapshots).pick({
  keywordId: true,
  rank: true,
  page: true,
  url: true,
});

export type InsertRankSnapshot = z.infer<typeof insertRankSnapshotSchema>;
export type RankSnapshot = typeof rankSnapshots.$inferSelect;

// Rank Tracking API Schemas
export const addKeywordRequestSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
  targetUrl: z.string().url("Must be a valid URL"),
  searchEngine: z.enum(["google", "bing", "yahoo"]).default("google"),
  location: z.string().optional(),
  device: z.enum(["desktop", "mobile"]).default("desktop"),
});

export const trackRankRequestSchema = z.object({
  keywordId: z.string(),
});

export const keywordWithRankDataSchema = z.object({
  id: z.string(),
  keyword: z.string(),
  targetUrl: z.string(),
  searchEngine: z.string(),
  location: z.string().nullable(),
  device: z.string(),
  createdAt: z.string(),
  currentRank: z.number().nullable(),
  previousRank: z.number().nullable(),
  rankChange: z.number().nullable(),
  snapshots: z.array(z.object({
    rank: z.number().nullable(),
    createdAt: z.string(),
  })),
});

export type AddKeywordRequest = z.infer<typeof addKeywordRequestSchema>;
export type TrackRankRequest = z.infer<typeof trackRankRequestSchema>;
export type KeywordWithRankData = z.infer<typeof keywordWithRankDataSchema>;
