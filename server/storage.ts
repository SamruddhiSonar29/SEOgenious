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
  type AuditFinding,
  type AuditMetadata,
  type Keyword,
  type InsertKeyword,
  type RankSnapshot,
  type InsertRankSnapshot,
  type BacklinkProfile,
  type InsertBacklinkProfile,
  type BacklinkSnapshot,
  type InsertBacklinkSnapshot,
  type TrendSearch,
  type InsertTrendSearch,
  type TrendSnapshot,
  type InsertTrendSnapshot,
  type ContentItem,
  type InsertContentItem,
  type UpdateContentItem,
  type SeoScore,
  users,
  chatMessages,
  activities,
  savedItems,
  audits,
  keywords,
  rankSnapshots,
  backlinkProfiles,
  backlinkSnapshots,
  trendSearches,
  trendSnapshots,
  contentItems,
  seoScores
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
  updateAudit(id: string, updates: {
    score?: number;
    status?: string;
    findings?: AuditFinding[];
    recommendations?: string[];
    metadata?: AuditMetadata;
  }): Promise<Audit | undefined>;
  createKeyword(keyword: InsertKeyword): Promise<Keyword>;
  getKeyword(id: string, userId: string): Promise<Keyword | undefined>;
  getKeywords(userId: string): Promise<Keyword[]>;
  deleteKeyword(id: string, userId: string): Promise<boolean>;
  createRankSnapshot(snapshot: InsertRankSnapshot): Promise<RankSnapshot>;
  getRankSnapshots(keywordId: string, limit?: number): Promise<RankSnapshot[]>;
  createBacklinkProfile(profile: InsertBacklinkProfile): Promise<BacklinkProfile>;
  getBacklinkProfile(id: string, userId: string): Promise<BacklinkProfile | undefined>;
  getBacklinkProfiles(userId: string): Promise<BacklinkProfile[]>;
  updateBacklinkProfile(id: string, updates: {
    totalBacklinks?: number;
    domainAuthority?: number;
    spamScore?: number;
    lastCheckedAt?: Date;
  }): Promise<BacklinkProfile | undefined>;
  deleteBacklinkProfile(id: string, userId: string): Promise<boolean>;
  createBacklinkSnapshot(snapshot: InsertBacklinkSnapshot): Promise<BacklinkSnapshot>;
  getBacklinkSnapshots(profileId: string, limit?: number): Promise<BacklinkSnapshot[]>;
  updateBacklinkSnapshot(id: string, updates: {
    status?: string;
    isToxic?: boolean;
    lastSeenAt?: Date;
  }): Promise<BacklinkSnapshot | undefined>;
  createTrendSearch(search: InsertTrendSearch): Promise<TrendSearch>;
  getTrendSearch(id: string, userId: string): Promise<TrendSearch | undefined>;
  getTrendSearches(userId: string): Promise<TrendSearch[]>;
  updateTrendSearch(id: string, updates: {
    currentVolume?: number;
    trend?: string;
    competitionLevel?: string;
    lastCheckedAt?: Date;
  }): Promise<TrendSearch | undefined>;
  deleteTrendSearch(id: string, userId: string): Promise<boolean>;
  createTrendSnapshot(snapshot: InsertTrendSnapshot): Promise<TrendSnapshot>;
  getTrendSnapshots(searchId: string, limit?: number): Promise<TrendSnapshot[]>;
  createContentItem(item: InsertContentItem): Promise<ContentItem>;
  getContentItemById(id: string): Promise<ContentItem | undefined>;
  getContentItemsByUserId(userId: string): Promise<ContentItem[]>;
  updateContentItem(id: string, updates: UpdateContentItem): Promise<ContentItem | undefined>;
  deleteContentItem(id: string): Promise<boolean>;
  createSeoScore(score: {
    userId: string;
    domain: string;
    overallScore: number;
    technicalScore: number;
    rankingScore: number;
    contentScore: number;
    activityScore: number;
    metadata: string;
  }): Promise<SeoScore>;
  getLatestSeoScore(userId: string, domain: string): Promise<SeoScore | null>;
  getSeoScoreHistory(userId: string, domain: string): Promise<SeoScore[]>;
  getAuditsByUserId(userId: string): Promise<Audit[]>;
  getKeywordsByUserId(userId: string): Promise<Keyword[]>;
  getRankSnapshotsByKeywordId(keywordId: string): Promise<RankSnapshot[]>;
  getActivitiesByUserId(userId: string): Promise<Activity[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private chatMessages: Map<string, ChatMessage>;
  private activities: Map<string, Activity>;
  private savedItems: Map<string, SavedItem>;
  private audits: Map<string, Audit>;
  private keywords: Map<string, Keyword>;
  private rankSnapshots: Map<string, RankSnapshot>;
  private backlinkProfiles: Map<string, BacklinkProfile>;
  private backlinkSnapshots: Map<string, BacklinkSnapshot>;

  constructor() {
    this.users = new Map();
    this.chatMessages = new Map();
    this.activities = new Map();
    this.savedItems = new Map();
    this.audits = new Map();
    this.keywords = new Map();
    this.rankSnapshots = new Map();
    this.backlinkProfiles = new Map();
    this.backlinkSnapshots = new Map();
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
      findings: (insertAudit.findings ?? []) as AuditFinding[],
      recommendations: (insertAudit.recommendations ?? []) as string[],
      metadata: (insertAudit.metadata ?? null) as AuditMetadata | null,
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

  async updateAudit(id: string, updates: {
    score?: number;
    status?: string;
    findings?: AuditFinding[];
    recommendations?: string[];
    metadata?: AuditMetadata;
  }): Promise<Audit | undefined> {
    const audit = this.audits.get(id);
    if (!audit) return undefined;
    const updatedAudit = { ...audit, ...updates };
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

  async createBacklinkProfile(insertProfile: InsertBacklinkProfile): Promise<BacklinkProfile> {
    const id = randomUUID();
    const profile: BacklinkProfile = {
      id,
      ...insertProfile,
      lastCheckedAt: insertProfile.lastCheckedAt ?? null,
      createdAt: new Date(),
    };
    this.backlinkProfiles.set(id, profile);
    return profile;
  }

  async getBacklinkProfile(id: string, userId: string): Promise<BacklinkProfile | undefined> {
    const profile = this.backlinkProfiles.get(id);
    if (!profile || profile.userId !== userId) return undefined;
    return profile;
  }

  async getBacklinkProfiles(userId: string): Promise<BacklinkProfile[]> {
    return Array.from(this.backlinkProfiles.values())
      .filter((profile) => profile.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateBacklinkProfile(id: string, updates: {
    totalBacklinks?: number;
    domainAuthority?: number;
    spamScore?: number;
    lastCheckedAt?: Date;
  }): Promise<BacklinkProfile | undefined> {
    const profile = this.backlinkProfiles.get(id);
    if (!profile) return undefined;
    
    const updatedProfile = { ...profile, ...updates };
    this.backlinkProfiles.set(id, updatedProfile);
    return updatedProfile;
  }

  async deleteBacklinkProfile(id: string, userId: string): Promise<boolean> {
    const profile = this.backlinkProfiles.get(id);
    if (!profile || profile.userId !== userId) return false;
    return this.backlinkProfiles.delete(id);
  }

  async createBacklinkSnapshot(insertSnapshot: InsertBacklinkSnapshot): Promise<BacklinkSnapshot> {
    const id = randomUUID();
    const snapshot: BacklinkSnapshot = {
      id,
      ...insertSnapshot,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
    };
    this.backlinkSnapshots.set(id, snapshot);
    return snapshot;
  }

  async getBacklinkSnapshots(profileId: string, limit: number = 100): Promise<BacklinkSnapshot[]> {
    return Array.from(this.backlinkSnapshots.values())
      .filter((snapshot) => snapshot.profileId === profileId)
      .sort((a, b) => b.lastSeenAt.getTime() - a.lastSeenAt.getTime())
      .slice(0, limit);
  }

  async updateBacklinkSnapshot(id: string, updates: {
    status?: string;
    isToxic?: boolean;
    lastSeenAt?: Date;
  }): Promise<BacklinkSnapshot | undefined> {
    const snapshot = this.backlinkSnapshots.get(id);
    if (!snapshot) return undefined;
    
    const updatedSnapshot = { ...snapshot, ...updates };
    this.backlinkSnapshots.set(id, updatedSnapshot);
    return updatedSnapshot;
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
      .values(insertAudit as any)
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

  async updateAudit(id: string, updates: {
    score?: number;
    status?: string;
    findings?: AuditFinding[];
    recommendations?: string[];
    metadata?: AuditMetadata;
  }): Promise<Audit | undefined> {
    const [audit] = await db
      .update(audits)
      .set(updates)
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

  async createBacklinkProfile(insertProfile: InsertBacklinkProfile): Promise<BacklinkProfile> {
    const [profile] = await db
      .insert(backlinkProfiles)
      .values(insertProfile)
      .returning();
    return profile;
  }

  async getBacklinkProfile(id: string, userId: string): Promise<BacklinkProfile | undefined> {
    const [profile] = await db
      .select()
      .from(backlinkProfiles)
      .where(and(eq(backlinkProfiles.id, id), eq(backlinkProfiles.userId, userId)));
    return profile || undefined;
  }

  async getBacklinkProfiles(userId: string): Promise<BacklinkProfile[]> {
    return await db
      .select()
      .from(backlinkProfiles)
      .where(eq(backlinkProfiles.userId, userId))
      .orderBy(desc(backlinkProfiles.createdAt));
  }

  async updateBacklinkProfile(id: string, updates: {
    totalBacklinks?: number;
    domainAuthority?: number;
    spamScore?: number;
    lastCheckedAt?: Date;
  }): Promise<BacklinkProfile | undefined> {
    const [profile] = await db
      .update(backlinkProfiles)
      .set(updates)
      .where(eq(backlinkProfiles.id, id))
      .returning();
    return profile || undefined;
  }

  async deleteBacklinkProfile(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(backlinkProfiles)
      .where(and(eq(backlinkProfiles.id, id), eq(backlinkProfiles.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async createBacklinkSnapshot(insertSnapshot: InsertBacklinkSnapshot): Promise<BacklinkSnapshot> {
    const [snapshot] = await db
      .insert(backlinkSnapshots)
      .values(insertSnapshot)
      .returning();
    return snapshot;
  }

  async getBacklinkSnapshots(profileId: string, limit: number = 100): Promise<BacklinkSnapshot[]> {
    return await db
      .select()
      .from(backlinkSnapshots)
      .where(eq(backlinkSnapshots.profileId, profileId))
      .orderBy(desc(backlinkSnapshots.lastSeenAt))
      .limit(limit);
  }

  async updateBacklinkSnapshot(id: string, updates: {
    status?: string;
    isToxic?: boolean;
    lastSeenAt?: Date;
  }): Promise<BacklinkSnapshot | undefined> {
    const [snapshot] = await db
      .update(backlinkSnapshots)
      .set(updates)
      .where(eq(backlinkSnapshots.id, id))
      .returning();
    return snapshot || undefined;
  }

  async createTrendSearch(insertSearch: InsertTrendSearch): Promise<TrendSearch> {
    const [search] = await db
      .insert(trendSearches)
      .values(insertSearch)
      .returning();
    return search;
  }

  async getTrendSearch(id: string, userId: string): Promise<TrendSearch | undefined> {
    const [search] = await db
      .select()
      .from(trendSearches)
      .where(and(eq(trendSearches.id, id), eq(trendSearches.userId, userId)));
    return search || undefined;
  }

  async getTrendSearches(userId: string): Promise<TrendSearch[]> {
    return await db
      .select()
      .from(trendSearches)
      .where(eq(trendSearches.userId, userId))
      .orderBy(desc(trendSearches.createdAt));
  }

  async updateTrendSearch(id: string, updates: {
    currentVolume?: number;
    trend?: string;
    competitionLevel?: string;
    lastCheckedAt?: Date;
  }): Promise<TrendSearch | undefined> {
    const [search] = await db
      .update(trendSearches)
      .set(updates)
      .where(eq(trendSearches.id, id))
      .returning();
    return search || undefined;
  }

  async deleteTrendSearch(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(trendSearches)
      .where(and(eq(trendSearches.id, id), eq(trendSearches.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async createTrendSnapshot(insertSnapshot: InsertTrendSnapshot): Promise<TrendSnapshot> {
    const [snapshot] = await db
      .insert(trendSnapshots)
      .values(insertSnapshot)
      .returning();
    return snapshot;
  }

  async getTrendSnapshots(searchId: string, limit: number = 30): Promise<TrendSnapshot[]> {
    return await db
      .select()
      .from(trendSnapshots)
      .where(eq(trendSnapshots.searchId, searchId))
      .orderBy(desc(trendSnapshots.date))
      .limit(limit);
  }

  async createContentItem(insertItem: InsertContentItem): Promise<ContentItem> {
    const [item] = await db
      .insert(contentItems)
      .values({
        ...insertItem,
        updatedAt: new Date(),
      })
      .returning();
    return item;
  }

  async getContentItemById(id: string): Promise<ContentItem | undefined> {
    const [item] = await db
      .select()
      .from(contentItems)
      .where(eq(contentItems.id, id));
    return item || undefined;
  }

  async getContentItemsByUserId(userId: string): Promise<ContentItem[]> {
    return await db
      .select()
      .from(contentItems)
      .where(eq(contentItems.userId, userId))
      .orderBy(desc(contentItems.createdAt));
  }

  async updateContentItem(id: string, updates: UpdateContentItem): Promise<ContentItem | undefined> {
    const [item] = await db
      .update(contentItems)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(contentItems.id, id))
      .returning();
    return item || undefined;
  }

  async deleteContentItem(id: string): Promise<boolean> {
    const result = await db
      .delete(contentItems)
      .where(eq(contentItems.id, id))
      .returning();
    return result.length > 0;
  }

  async createSeoScore(score: {
    userId: string;
    domain: string;
    overallScore: number;
    technicalScore: number;
    rankingScore: number;
    contentScore: number;
    activityScore: number;
    metadata: string;
  }): Promise<SeoScore> {
    const [newScore] = await db
      .insert(seoScores)
      .values(score)
      .returning();
    return newScore;
  }

  async getLatestSeoScore(userId: string, domain: string): Promise<SeoScore | null> {
    const [score] = await db
      .select()
      .from(seoScores)
      .where(and(
        eq(seoScores.userId, userId),
        eq(seoScores.domain, domain)
      ))
      .orderBy(desc(seoScores.createdAt))
      .limit(1);
    return score || null;
  }

  async getSeoScoreHistory(userId: string, domain: string): Promise<SeoScore[]> {
    return await db
      .select()
      .from(seoScores)
      .where(and(
        eq(seoScores.userId, userId),
        eq(seoScores.domain, domain)
      ))
      .orderBy(desc(seoScores.createdAt))
      .limit(30);
  }

  async getAuditsByUserId(userId: string): Promise<Audit[]> {
    return await db
      .select()
      .from(audits)
      .where(eq(audits.userId, userId))
      .orderBy(desc(audits.createdAt));
  }

  async getKeywordsByUserId(userId: string): Promise<Keyword[]> {
    return await db
      .select()
      .from(keywords)
      .where(eq(keywords.userId, userId));
  }

  async getRankSnapshotsByKeywordId(keywordId: string): Promise<RankSnapshot[]> {
    return await db
      .select()
      .from(rankSnapshots)
      .where(eq(rankSnapshots.keywordId, keywordId))
      .orderBy(desc(rankSnapshots.checkedAt));
  }

  async getActivitiesByUserId(userId: string): Promise<Activity[]> {
    return await db
      .select()
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.timestamp));
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
