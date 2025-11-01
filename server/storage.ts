import { 
  type User, 
  type InsertUser, 
  type UpdateUserProfile,
  type ChatMessage, 
  type InsertChatMessage,
  type Activity,
  type InsertActivity,
  type SavedItem,
  type InsertSavedItem
} from "@shared/schema";
import { randomUUID } from "crypto";

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

export const storage = new MemStorage();
