import { 
  type User, 
  type InsertUser, 
  type UpdateUserProfile,
  type ChatMessage, 
  type InsertChatMessage,
  type Activity,
  type InsertActivity,
  type SavedItem,
  type InsertSavedItem,
  type Audit,
  type InsertAudit,
  type Keyword,
  type InsertKeyword,
  type RankSnapshot,
  type InsertRankSnapshot,
  users,
  chatMessages,
  activities,
  savedItems,
  audits,
  keywords,
  rankSnapshots
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserProfile(userId: string, updates: UpdateUserProfile): Promise<User | undefined>;
  getChatMessages(userId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getActivities(userId: string, limit?: number): Promise<Activity[]>;
  createActivity(activity: InsertActivity): Promise<Activity>;
  getSavedItems(userId: string, type?: string): Promise<SavedItem[]>;
  createSavedItem(item: InsertSavedItem): Promise<SavedItem>;
  deleteSavedItem(id: string, userId: string): Promise<boolean>;
  getUserStats(userId: string): Promise<{
    totalKeywords: number;
    totalContent: number;
    totalCompetitors: number;
    savedItems: number;
  }>;
  createAudit(audit: InsertAudit): Promise<Audit>;
  getAudit(id: string, userId: string): Promise<Audit | undefined>;
  getAudits(userId: string, limit?: number): Promise<Audit[]>;
  updateAuditStatus(id: string, status: string): Promise<Audit | undefined>;
  createKeyword(keyword: InsertKeyword): Promise<Keyword>;
  getKeyword(id: string, userId: string): Promise<Keyword | undefined>;
  getKeywords(userId: string): Promise<Keyword[]>;
  deleteKeyword(id: string, userId: string): Promise<boolean>;
  createRankSnapshot(snapshot: InsertRankSnapshot): Promise<RankSnapshot>;
  getRankSnapshots(keywordId: string, limit?: number): Promise<RankSnapshot[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatMessages: Map<string, ChatMessage>;
  private activities: Map<string, Activity>;
  private savedItems: Map<string, SavedItem>;
  private audits: Map<string, Audit>;
  private keywords: Map<string, Keyword>;
  private rankSnapshots: Map<string, RankSnapshot>;

  constructor() {
    this.users = new Map();
    this.chatMessages = new Map();
    this.activities = new Map();
    this.savedItems = new Map();
    this.audits = new Map();
    this.keywords = new Map();
    this.rankSnapshots = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      theme: "light",
      onboardingCompleted: false,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserProfile(userId: string, updates: UpdateUserProfile): Promise<User | undefined> {
    const user = this.users.get(userId);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(userId, updatedUser);
    return updatedUser;
  }

  async getChatMessages(userId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter((msg) => msg.userId === userId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = randomUUID();
    const message: ChatMessage = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getActivities(userId: string, limit: number = 10): Promise<Activity[]> {
    return Array.from(this.activities.values())
      .filter((activity) => activity.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = randomUUID();
    const activity: Activity = {
      id,
      userId: insertActivity.userId,
      type: insertActivity.type,
      description: insertActivity.description,
      metadata: insertActivity.metadata ?? null,
      createdAt: new Date(),
    };
    this.activities.set(id, activity);
    return activity;
  }

  async getSavedItems(userId: string, type?: string): Promise<SavedItem[]> {
    return Array.from(this.savedItems.values())
      .filter((item) => item.userId === userId && (!type || item.type === type))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createSavedItem(insertItem: InsertSavedItem): Promise<SavedItem> {
    const id = randomUUID();
    const item: SavedItem = {
      ...insertItem,
      id,
      createdAt: new Date(),
    };
    this.savedItems.set(id, item);
    return item;
  }

  async deleteSavedItem(id: string, userId: string): Promise<boolean> {
    const item = this.savedItems.get(id);
    if (!item || item.userId !== userId) return false;
    return this.savedItems.delete(id);
  }

  async getUserStats(userId: string): Promise<{
    totalKeywords: number;
    totalContent: number;
    totalCompetitors: number;
    savedItems: number;
  }> {
    const userActivities = Array.from(this.activities.values())
      .filter((activity) => activity.userId === userId);
    
    const userSavedItems = Array.from(this.savedItems.values())
      .filter((item) => item.userId === userId);

    return {
      totalKeywords: userActivities.filter(a => a.type === 'keyword_research').length,
      totalContent: userActivities.filter(a => a.type === 'content_outline' || a.type === 'content_optimize').length,
      totalCompetitors: userActivities.filter(a => a.type === 'competitor_analysis').length,
      savedItems: userSavedItems.length,
    };
  }

  async createAudit(insertAudit: InsertAudit): Promise<Audit> {
    const id = randomUUID();
    const audit: Audit = {
      id,
      userId: insertAudit.userId,
      url: insertAudit.url,
      score: insertAudit.score ?? 0,
      status: insertAudit.status ?? 'pending',
      findings: insertAudit.findings ?? [],
      recommendations: insertAudit.recommendations ?? [],
      metadata: insertAudit.metadata ?? null,
      createdAt: new Date(),
    };
    this.audits.set(id, audit);
    return audit;
  }

  async getAudit(id: string, userId: string): Promise<Audit | undefined> {
    const audit = this.audits.get(id);
    if (!audit || audit.userId !== userId) return undefined;
    return audit;
  }

  async getAudits(userId: string, limit: number = 10): Promise<Audit[]> {
    return Array.from(this.audits.values())
      .filter((audit) => audit.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async updateAuditStatus(id: string, status: string): Promise<Audit | undefined> {
    const audit = this.audits.get(id);
    if (!audit) return undefined;
    const updatedAudit = { ...audit, status };
    this.audits.set(id, updatedAudit);
    return updatedAudit;
  }

  async createKeyword(insertKeyword: InsertKeyword): Promise<Keyword> {
    const id = randomUUID();
    const keyword: Keyword = {
      id,
      userId: insertKeyword.userId,
      keyword: insertKeyword.keyword,
      targetUrl: insertKeyword.targetUrl,
      searchEngine: insertKeyword.searchEngine ?? 'google',
      location: insertKeyword.location ?? null,
      device: insertKeyword.device ?? 'desktop',
      createdAt: new Date(),
    };
    this.keywords.set(id, keyword);
    return keyword;
  }

  async getKeyword(id: string, userId: string): Promise<Keyword | undefined> {
    const keyword = this.keywords.get(id);
    if (!keyword || keyword.userId !== userId) return undefined;
    return keyword;
  }

  async getKeywords(userId: string): Promise<Keyword[]> {
    return Array.from(this.keywords.values())
      .filter((keyword) => keyword.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async deleteKeyword(id: string, userId: string): Promise<boolean> {
    const keyword = this.keywords.get(id);
    if (!keyword || keyword.userId !== userId) return false;
    return this.keywords.delete(id);
  }

  async createRankSnapshot(insertSnapshot: InsertRankSnapshot): Promise<RankSnapshot> {
    const id = randomUUID();
    const snapshot: RankSnapshot = {
      id,
      keywordId: insertSnapshot.keywordId,
      rank: insertSnapshot.rank ?? null,
      page: insertSnapshot.page ?? null,
      url: insertSnapshot.url ?? null,
      createdAt: new Date(),
    };
    this.rankSnapshots.set(id, snapshot);
    return snapshot;
  }

  async getRankSnapshots(keywordId: string, limit: number = 30): Promise<RankSnapshot[]> {
    return Array.from(this.rankSnapshots.values())
      .filter((snapshot) => snapshot.keywordId === keywordId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }
}

// PostgreSQL database storage implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserProfile(userId: string, updates: UpdateUserProfile): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    return user || undefined;
  }

  async getChatMessages(userId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.userId, userId))
      .orderBy(chatMessages.createdAt);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getActivities(userId: string, limit: number = 10): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt))
      .limit(limit);
  }

  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const [activity] = await db
      .insert(activities)
      .values(insertActivity)
      .returning();
    return activity;
  }

  async getSavedItems(userId: string, type?: string): Promise<SavedItem[]> {
    if (type) {
      return await db
        .select()
        .from(savedItems)
        .where(and(eq(savedItems.userId, userId), eq(savedItems.type, type)))
        .orderBy(desc(savedItems.createdAt));
    }
    return await db
      .select()
      .from(savedItems)
      .where(eq(savedItems.userId, userId))
      .orderBy(desc(savedItems.createdAt));
  }

  async createSavedItem(insertItem: InsertSavedItem): Promise<SavedItem> {
    const [item] = await db
      .insert(savedItems)
      .values(insertItem)
      .returning();
    return item;
  }

  async deleteSavedItem(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(savedItems)
      .where(and(eq(savedItems.id, id), eq(savedItems.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getUserStats(userId: string): Promise<{
    totalKeywords: number;
    totalContent: number;
    totalCompetitors: number;
    savedItems: number;
  }> {
    const userActivities = await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId));
    
    const userSavedItems = await db
      .select()
      .from(savedItems)
      .where(eq(savedItems.userId, userId));

    return {
      totalKeywords: userActivities.filter(a => a.type === 'keyword_research' || a.type === 'keyword_clustering').length,
      totalContent: userActivities.filter(a => a.type === 'content_outline' || a.type === 'content_optimize' || a.type === 'content_optimization').length,
      totalCompetitors: userActivities.filter(a => a.type === 'competitor_analysis' || a.type === 'serp_analysis').length,
      savedItems: userSavedItems.length,
    };
  }

  async createAudit(insertAudit: InsertAudit): Promise<Audit> {
    const [audit] = await db
      .insert(audits)
      .values(insertAudit)
      .returning();
    return audit;
  }

  async getAudit(id: string, userId: string): Promise<Audit | undefined> {
    const [audit] = await db
      .select()
      .from(audits)
      .where(and(eq(audits.id, id), eq(audits.userId, userId)));
    return audit || undefined;
  }

  async getAudits(userId: string, limit: number = 10): Promise<Audit[]> {
    return await db
      .select()
      .from(audits)
      .where(eq(audits.userId, userId))
      .orderBy(desc(audits.createdAt))
      .limit(limit);
  }

  async updateAuditStatus(id: string, status: string): Promise<Audit | undefined> {
    const [audit] = await db
      .update(audits)
      .set({ status })
      .where(eq(audits.id, id))
      .returning();
    return audit || undefined;
  }

  async createKeyword(insertKeyword: InsertKeyword): Promise<Keyword> {
    const [keyword] = await db
      .insert(keywords)
      .values(insertKeyword)
      .returning();
    return keyword;
  }

  async getKeyword(id: string, userId: string): Promise<Keyword | undefined> {
    const [keyword] = await db
      .select()
      .from(keywords)
      .where(and(eq(keywords.id, id), eq(keywords.userId, userId)));
    return keyword || undefined;
  }

  async getKeywords(userId: string): Promise<Keyword[]> {
    return await db
      .select()
      .from(keywords)
      .where(eq(keywords.userId, userId))
      .orderBy(desc(keywords.createdAt));
  }

  async deleteKeyword(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(keywords)
      .where(and(eq(keywords.id, id), eq(keywords.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async createRankSnapshot(insertSnapshot: InsertRankSnapshot): Promise<RankSnapshot> {
    const [snapshot] = await db
      .insert(rankSnapshots)
      .values(insertSnapshot)
      .returning();
    return snapshot;
  }

  async getRankSnapshots(keywordId: string, limit: number = 30): Promise<RankSnapshot[]> {
    return await db
      .select()
      .from(rankSnapshots)
      .where(eq(rankSnapshots.keywordId, keywordId))
      .orderBy(desc(rankSnapshots.createdAt))
      .limit(limit);
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
