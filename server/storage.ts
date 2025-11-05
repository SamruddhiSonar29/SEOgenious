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
  users,
  chatMessages,
  activities,
  savedItems
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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatMessages: Map<string, ChatMessage>;
  private activities: Map<string, Activity>;
  private savedItems: Map<string, SavedItem>;

  constructor() {
    this.users = new Map();
    this.chatMessages = new Map();
    this.activities = new Map();
    this.savedItems = new Map();
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
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
