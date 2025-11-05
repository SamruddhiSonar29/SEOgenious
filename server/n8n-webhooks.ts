/**
 * n8n Webhook Integration for SEOgenious
 * 
 * This module handles sending data to n8n workflows via webhooks
 * for automation, reporting, and third-party integrations.
 */

interface N8nWebhookConfig {
  url: string;
  username?: string;
  password?: string;
  timeout?: number;
}

interface WebhookResponse {
  success: boolean;
  data?: any;
  error?: string;
}

/**
 * Send data to n8n webhook
 */
export async function sendToN8n(
  webhookUrl: string,
  data: any,
  config?: Partial<N8nWebhookConfig>
): Promise<WebhookResponse> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Basic Authentication if credentials provided
    if (config?.username && config?.password) {
      const credentials = Buffer.from(
        `${config.username}:${config.password}`
      ).toString('base64');
      headers['Authorization'] = `Basic ${credentials}`;
    }

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(config?.timeout || 30000), // 30 second timeout
    });

    if (!response.ok) {
      throw new Error(`n8n webhook failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    return {
      success: true,
      data: result,
    };
  } catch (error) {
    console.error('n8n webhook error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Pre-configured webhook triggers for different SEO events
 */
export class N8nWebhooks {
  private baseUrl: string;
  private auth?: { username: string; password: string };

  constructor(baseUrl: string, auth?: { username: string; password: string }) {
    this.baseUrl = baseUrl;
    this.auth = auth;
  }

  /**
   * Trigger when user generates keyword clusters
   */
  async onKeywordAnalysis(data: {
    userId: string;
    userEmail: string;
    keywords: string[];
    clusters: any[];
    timestamp: Date;
  }): Promise<WebhookResponse> {
    return sendToN8n(`${this.baseUrl}/keyword-analysis`, data, this.auth);
  }

  /**
   * Trigger when user optimizes content
   */
  async onContentOptimization(data: {
    userId: string;
    userEmail: string;
    content: string;
    targetKeyword: string;
    results: any;
    timestamp: Date;
  }): Promise<WebhookResponse> {
    return sendToN8n(`${this.baseUrl}/content-optimization`, data, this.auth);
  }

  /**
   * Trigger when user performs SERP analysis
   */
  async onSerpAnalysis(data: {
    userId: string;
    userEmail: string;
    keyword: string;
    competitors: any[];
    timestamp: Date;
  }): Promise<WebhookResponse> {
    return sendToN8n(`${this.baseUrl}/serp-analysis`, data, this.auth);
  }

  /**
   * Trigger when user saves an item
   */
  async onItemSaved(data: {
    userId: string;
    userEmail: string;
    itemType: string;
    itemTitle: string;
    itemData: any;
    timestamp: Date;
  }): Promise<WebhookResponse> {
    return sendToN8n(`${this.baseUrl}/item-saved`, data, this.auth);
  }

  /**
   * Trigger when new user registers
   */
  async onUserRegistration(data: {
    userId: string;
    userName: string;
    userEmail: string;
    timestamp: Date;
  }): Promise<WebhookResponse> {
    return sendToN8n(`${this.baseUrl}/user-registration`, data, this.auth);
  }

  /**
   * Send daily/weekly SEO report
   */
  async sendSeoReport(data: {
    userId: string;
    userEmail: string;
    reportType: 'daily' | 'weekly' | 'monthly';
    stats: {
      totalKeywords: number;
      totalContent: number;
      totalCompetitors: number;
      savedItems: number;
    };
    activities: any[];
    timestamp: Date;
  }): Promise<WebhookResponse> {
    return sendToN8n(`${this.baseUrl}/seo-report`, data, this.auth);
  }

  /**
   * Generic webhook sender for custom workflows
   */
  async sendCustom(path: string, data: any): Promise<WebhookResponse> {
    return sendToN8n(`${this.baseUrl}${path}`, data, this.auth);
  }
}

/**
 * Initialize n8n webhooks from environment variables
 */
export function initN8nWebhooks(): N8nWebhooks | null {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.log('n8n webhooks not configured (N8N_WEBHOOK_URL not set)');
    return null;
  }

  const auth = process.env.N8N_AUTH_USER && process.env.N8N_AUTH_PASS
    ? {
        username: process.env.N8N_AUTH_USER,
        password: process.env.N8N_AUTH_PASS,
      }
    : undefined;

  console.log('n8n webhooks initialized:', webhookUrl);
  return new N8nWebhooks(webhookUrl, auth);
}
