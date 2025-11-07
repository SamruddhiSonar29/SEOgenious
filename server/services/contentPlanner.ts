import { storage } from "../storage";
import type { InsertContentItem, UpdateContentItem, ContentItem } from "@shared/schema";

export class ContentPlannerService {
  async createContentItem(userId: string, data: Omit<InsertContentItem, "userId">): Promise<ContentItem> {
    const contentItem = await storage.createContentItem({
      ...data,
      userId,
      publishDate: data.publishDate ? new Date(data.publishDate) : null,
    } as any);

    await storage.createActivity({
      userId,
      type: "content_created",
      description: `Created content item: ${data.title}`,
      metadata: { contentId: contentItem.id, contentType: data.contentType },
    });

    return contentItem;
  }

  async getUserContentItems(userId: string): Promise<ContentItem[]> {
    return storage.getContentItemsByUserId(userId);
  }

  async getContentItemById(userId: string, id: string): Promise<ContentItem | null> {
    const item = await storage.getContentItemById(id);
    
    if (!item || item.userId !== userId) {
      return null;
    }
    
    return item;
  }

  async updateContentItem(
    userId: string,
    id: string,
    updates: UpdateContentItem
  ): Promise<ContentItem | null> {
    const existing = await this.getContentItemById(userId, id);
    
    if (!existing) {
      return null;
    }

    const processedUpdates = {
      ...updates,
      publishDate: updates.publishDate !== undefined 
        ? (updates.publishDate ? new Date(updates.publishDate) : null)
        : undefined,
    } as any;

    const updated = await storage.updateContentItem(id, processedUpdates);
    
    if (updates.status && updates.status !== existing.status) {
      await storage.createActivity({
        userId,
        type: "content_status_changed",
        description: `Updated "${existing.title}" status to ${updates.status}`,
        metadata: { contentId: id, oldStatus: existing.status, newStatus: updates.status },
      });
    }

    return updated ?? null;
  }

  async deleteContentItem(userId: string, id: string): Promise<boolean> {
    const existing = await this.getContentItemById(userId, id);
    
    if (!existing) {
      return false;
    }

    await storage.deleteContentItem(id);

    await storage.createActivity({
      userId,
      type: "content_deleted",
      description: `Deleted content item: ${existing.title}`,
      metadata: { contentType: existing.contentType },
    });

    return true;
  }

  async getContentItemsByStatus(userId: string, status: string): Promise<ContentItem[]> {
    const allItems = await this.getUserContentItems(userId);
    return allItems.filter(item => item.status === status);
  }

  async getUpcomingContent(userId: string, days: number = 30): Promise<ContentItem[]> {
    const allItems = await this.getUserContentItems(userId);
    const now = new Date();
    const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return allItems.filter(item => {
      if (!item.publishDate) return false;
      const publishDate = new Date(item.publishDate);
      return publishDate >= now && publishDate <= futureDate;
    }).sort((a, b) => {
      const dateA = new Date(a.publishDate!).getTime();
      const dateB = new Date(b.publishDate!).getTime();
      return dateA - dateB;
    });
  }
}

export const contentPlannerService = new ContentPlannerService();
