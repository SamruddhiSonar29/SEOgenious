import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { 
  insertUserSchema, 
  insertChatMessageSchema, 
  updateUserProfileSchema, 
  insertActivitySchema, 
  insertSavedItemSchema,
  aiRewriteRequestSchema,
  aiExecutiveSummaryRequestSchema,
  aiOutlineRefineRequestSchema,
  aiChatRequestSchema,
  runAuditRequestSchema,
  addKeywordRequestSchema,
  trackRankRequestSchema,
} from "@shared/schema";
import { openai } from "./openai";
import { initN8nWebhooks } from "./n8n-webhooks";
import * as aiWrapper from "./services/aiWrapper";
import { seoAuditor } from "./services/seoAuditor";
import { rankTrackerService } from "./services/rankTracker";
import { pdfGeneratorService } from "./services/pdfGenerator";
import { backlinkAnalyzerService } from "./services/backlinkAnalyzer";
import { trendDiscoveryService } from "./services/trendDiscovery";
import { analyzeBacklinksRequestSchema, searchTrendsRequestSchema } from "@shared/schema";

// Initialize n8n webhooks (null if not configured)
const n8nWebhooks = initN8nWebhooks();

// Mock data generators
function generateKeywords(topic: string) {
  const keywords = [
    { keyword: `${topic} guide`, intent: 'Informational', difficulty: 45 },
    { keyword: `best ${topic} tools`, intent: 'Commercial', difficulty: 68 },
    { keyword: `${topic} tips`, intent: 'Informational', difficulty: 32 },
    { keyword: `how to use ${topic}`, intent: 'Informational', difficulty: 28 },
    { keyword: `${topic} software`, intent: 'Commercial', difficulty: 72 },
    { keyword: `${topic} for beginners`, intent: 'Informational', difficulty: 35 },
    { keyword: `top ${topic} strategies`, intent: 'Informational', difficulty: 52 },
    { keyword: `${topic} comparison`, intent: 'Commercial', difficulty: 61 },
  ];
  return keywords;
}

function generateOutline(keyword: string) {
  return {
    h1: `The Complete Guide to ${keyword}`,
    h2_headings: [
      `What is ${keyword}?`,
      `Why ${keyword} Matters in 2025`,
      `Key Benefits and Advantages`,
      `How to Get Started`,
      `Best Practices and Tips`,
      `Common Mistakes to Avoid`,
    ],
    h3_subheadings: {
      [`What is ${keyword}?`]: [
        'Definition and core concepts',
        'Historical background',
        'Current industry landscape',
      ],
      [`Why ${keyword} Matters in 2025`]: [
        'Market trends and statistics',
        'Impact on business growth',
        'Future predictions',
      ],
      [`Key Benefits and Advantages`]: [
        'Increased efficiency',
        'Cost savings',
        'Competitive advantages',
      ],
      [`How to Get Started`]: [
        'Step-by-step implementation guide',
        'Required tools and resources',
        'Setting realistic goals',
      ],
      [`Best Practices and Tips`]: [
        'Expert recommendations',
        'Industry standards',
        'Optimization techniques',
      ],
      [`Common Mistakes to Avoid`]: [
        'Frequent pitfalls',
        'Warning signs',
        'How to recover from errors',
      ],
    },
  };
}

function generateSEOSuggestions(keyword: string, text: string) {
  const wordCount = text.split(/\s+/).length;
  const keywordCount = (text.toLowerCase().match(new RegExp(keyword.toLowerCase(), 'g')) || []).length;
  const density = ((keywordCount / wordCount) * 100).toFixed(2);

  return {
    suggested_title: `${keyword.charAt(0).toUpperCase() + keyword.slice(1)}: Complete Guide for 2025`,
    meta_description: `Discover everything you need to know about ${keyword}. Expert tips, best practices, and actionable strategies to help you succeed.`,
    keyword_density: parseFloat(density),
    readability_score: Math.floor(Math.random() * 20) + 75,
    recommendations: [
      `Your keyword density is ${density}% - optimal range is 1-3%`,
      'Title tag is well optimized and includes target keyword',
      'Consider adding more internal links to related content',
      'Meta description could be more compelling with a call-to-action',
      'Add alt text to images for better accessibility and SEO',
    ],
  };
}

// Middleware to require authentication
function requireAuth(req: any, res: any, next: any) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
}

// CSRF protection via Origin/Referer checking
function checkCSRF(req: any, res: any, next: any) {
  // Allow all GET requests
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }

  // Get the origin or referer header
  const origin = req.get('origin');
  const referer = req.get('referer');
  
  // In development, allow localhost
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  // Check if origin or referer matches our domain
  const allowedOrigins = [
    process.env.ALLOWED_ORIGIN,
    'https://' + req.get('host'),
    'http://' + req.get('host'),
  ].filter(Boolean);

  const isValidOrigin = origin && allowedOrigins.some(allowed => origin === allowed);
  const isValidReferer = referer && allowedOrigins.some(allowed => referer.startsWith(allowed));

  if (!isValidOrigin && !isValidReferer) {
    return res.status(403).json({ message: 'CSRF validation failed' });
  }

  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);

      // Create user
      const user = await storage.createUser({
        ...validatedData,
        password: hashedPassword,
      });

      // Store user ID in session (simple session management)
      if (req.session) {
        req.session.userId = user.id;
      }

      // Send n8n webhook notification (non-blocking)
      if (n8nWebhooks) {
        n8nWebhooks.onUserRegistration({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          timestamp: new Date(),
        }).catch(err => console.error('n8n webhook error:', err));
      }

      // Return user without password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: 'Invalid registration data' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Store user ID in session
      if (req.session) {
        req.session.userId = user.id;
      }

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session?.destroy(() => {
      res.json({ message: 'Logged out successfully' });
    });
  });

  app.get('/api/auth/me', async (req, res) => {
    if (!req.session?.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // SEO AI routes (all require authentication and CSRF protection)
  app.post('/api/keyword_research', checkCSRF, requireAuth, (req, res) => {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    const keywords = generateKeywords(topic);
    res.json(keywords);
  });

  app.post('/api/content_outline', checkCSRF, requireAuth, (req, res) => {
    const { keyword } = req.body;
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }
    const outline = generateOutline(keyword);
    res.json(outline);
  });

  app.post('/api/onpage_seo', checkCSRF, requireAuth, (req, res) => {
    const { keyword, text } = req.body;
    if (!keyword || !text) {
      return res.status(400).json({ error: 'Keyword and text are required' });
    }
    const suggestions = generateSEOSuggestions(keyword, text);
    res.json(suggestions);
  });

  // Advanced AI features (all require authentication and CSRF protection)
  app.post('/api/keyword_clustering', checkCSRF, requireAuth, async (req, res) => {
    const { keywords } = req.body;
    if (!keywords || !Array.isArray(keywords)) {
      return res.status(400).json({ error: 'Keywords array is required' });
    }

    // Mock keyword clustering
    const clusters = [
      {
        cluster: 'SEO Tools & Software',
        keywords: keywords.filter((_, i) => i % 3 === 0),
      },
      {
        cluster: 'Content Marketing',
        keywords: keywords.filter((_, i) => i % 3 === 1),
      },
      {
        cluster: 'Technical SEO',
        keywords: keywords.filter((_, i) => i % 3 === 2),
      },
    ].filter(cluster => cluster.keywords.length > 0);

    // Log activity (non-blocking)
    if (req.session?.userId) {
      try {
        await storage.createActivity({
          userId: req.session.userId,
          type: 'keyword_clustering',
          description: `Clustered ${keywords.length} keywords into ${clusters.length} groups`,
          metadata: { keywordCount: keywords.length, clusterCount: clusters.length },
        });

        // Send n8n webhook notification (non-blocking)
        if (n8nWebhooks) {
          const user = await storage.getUser(req.session.userId);
          if (user) {
            n8nWebhooks.onKeywordAnalysis({
              userId: user.id,
              userEmail: user.email,
              keywords,
              clusters,
              timestamp: new Date(),
            }).catch(err => console.error('n8n webhook error:', err));
          }
        }
      } catch (error) {
        console.error('Failed to log activity:', error);
      }
    }

    res.json(clusters);
  });

  app.post('/api/serp_analysis', checkCSRF, requireAuth, async (req, res) => {
    const { keyword } = req.body;
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }

    // Mock SERP competitor analysis
    const competitors = Array.from({ length: 10 }, (_, i) => ({
      rank: i + 1,
      url: `https://example${i + 1}.com/article-about-${keyword.replace(/\s+/g, '-')}`,
      word_count: Math.floor(Math.random() * 2000) + 1000,
      content_angle: ['Complete Guide', 'Beginner\'s Tutorial', 'Expert Tips', 'Listicle', 'Case Study'][i % 5],
      domain_authority: Math.floor(Math.random() * 40) + 60,
    }));

    // Log activity (non-blocking)
    if (req.session?.userId) {
      try {
        await storage.createActivity({
          userId: req.session.userId,
          type: 'serp_analysis',
          description: `Analyzed SERP competition for "${keyword}"`,
          metadata: { keyword, competitorCount: competitors.length },
        });

        // Send n8n webhook notification (non-blocking)
        if (n8nWebhooks) {
          const user = await storage.getUser(req.session.userId);
          if (user) {
            n8nWebhooks.onSerpAnalysis({
              userId: user.id,
              userEmail: user.email,
              keyword,
              competitors,
              timestamp: new Date(),
            }).catch(err => console.error('n8n webhook error:', err));
          }
        }
      } catch (error) {
        console.error('Failed to log activity:', error);
      }
    }

    res.json(competitors);
  });

  app.post('/api/content_optimize', checkCSRF, requireAuth, async (req, res) => {
    const { content, keyword } = req.body;
    if (!content || !keyword) {
      return res.status(400).json({ error: 'Content and keyword are required' });
    }

    const words = content.split(/\s+/).filter((w: string) => w.length > 0);
    const keywordOccurrences = content.toLowerCase().split(keyword.toLowerCase()).length - 1;
    const densityNum = (keywordOccurrences / words.length) * 100;
    const density = densityNum.toFixed(2);

    const suggestions = [
      {
        type: densityNum < 1 || densityNum > 3 ? 'warning' : 'success',
        text: `Keyword density is ${density}% - optimal range is 1-3%`,
      },
      {
        type: words.length >= 1000 ? 'success' : 'warning',
        text: words.length >= 1000 
          ? `Content length is ${words.length} words - good for SEO!`
          : `Content is only ${words.length} words - aim for at least 1000 words`,
      },
      {
        type: 'info',
        text: 'Add more internal links to related content',
      },
      {
        type: 'info',
        text: 'Include images with descriptive alt text',
      },
      {
        type: 'info',
        text: 'Break up text with H2 and H3 subheadings',
      },
    ];

    // Log activity (non-blocking)
    if (req.session?.userId) {
      try {
        await storage.createActivity({
          userId: req.session.userId,
          type: 'content_optimization',
          description: `Analyzed content for keyword "${keyword}" (${words.length} words)`,
          metadata: { keyword, wordCount: words.length, keywordDensity: parseFloat(density) },
        });

        // Send n8n webhook notification (non-blocking)
        if (n8nWebhooks) {
          const user = await storage.getUser(req.session.userId);
          if (user) {
            const results = {
              wordCount: words.length,
              keywordDensity: parseFloat(density),
              readabilityScore: Math.floor(Math.random() * 20) + 75,
              suggestions,
            };
            n8nWebhooks.onContentOptimization({
              userId: user.id,
              userEmail: user.email,
              content,
              targetKeyword: keyword,
              results,
              timestamp: new Date(),
            }).catch(err => console.error('n8n webhook error:', err));
          }
        }
      } catch (error) {
        console.error('Failed to log activity:', error);
      }
    }

    res.json({
      word_count: words.length,
      keyword_density: parseFloat(density),
      readability_score: Math.floor(Math.random() * 20) + 75,
      suggestions,
    });
  });

  // AI Chatbot routes
  app.get('/api/chat/messages', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const messages = await storage.getChatMessages(userId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.post('/api/chat/send', checkCSRF, requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { message } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Save user message
      await storage.createChatMessage({
        userId,
        role: 'user',
        content: message,
      });

      // Get recent chat history for context
      const chatHistory = await storage.getChatMessages(userId);
      const recentMessages = chatHistory.slice(-10).map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));

      // Call AI wrapper (respects ENABLE_REAL_AI feature flag)
      const aiResponse = await aiWrapper.chatbotResponse({
        userMessage: message,
        previousMessages: recentMessages,
      });

      const assistantMessage = aiResponse.response;

      // Save assistant response
      const savedMessage = await storage.createChatMessage({
        userId,
        role: 'assistant',
        content: assistantMessage,
      });

      res.json(savedMessage);
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  // AI Integration routes
  
  // AI Content Rewrite
  app.post('/api/ai/rewrite', checkCSRF, requireAuth, async (req, res) => {
    try {
      const validatedData = aiRewriteRequestSchema.parse(req.body);
      const result = await aiWrapper.contentRewrite(validatedData);
      const status = aiWrapper.getAIStatus();
      
      res.json({
        ...result,
        mode: status.mode,
      });
    } catch (error) {
      console.error('AI Rewrite error:', error);
      res.status(500).json({ error: 'Failed to rewrite content' });
    }
  });

  // AI Executive Summary
  app.post('/api/ai/executive-summary', checkCSRF, requireAuth, async (req, res) => {
    try {
      const validatedData = aiExecutiveSummaryRequestSchema.parse(req.body);
      const result = await aiWrapper.executiveSummary(validatedData);
      const status = aiWrapper.getAIStatus();
      
      res.json({
        ...result,
        mode: status.mode,
      });
    } catch (error) {
      console.error('AI Executive Summary error:', error);
      res.status(500).json({ error: 'Failed to generate executive summary' });
    }
  });

  // AI Outline Refine
  app.post('/api/ai/outline-refine', checkCSRF, requireAuth, async (req, res) => {
    try {
      const validatedData = aiOutlineRefineRequestSchema.parse(req.body);
      const result = await aiWrapper.contentOutlineRefine(validatedData);
      const status = aiWrapper.getAIStatus();
      
      res.json({
        ...result,
        mode: status.mode,
      });
    } catch (error) {
      console.error('AI Outline Refine error:', error);
      res.status(500).json({ error: 'Failed to refine outline' });
    }
  });

  // AI Chat Response (feature-flagged)
  app.post('/api/ai/chat', checkCSRF, requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const validatedData = aiChatRequestSchema.parse(req.body);
      
      // Get recent chat history for context
      const allMessages = await storage.getChatMessages(userId);
      const recentMessages = allMessages.slice(-10); // Last 10 messages
      
      const result = await aiWrapper.chatbotResponse({
        userMessage: validatedData.message,
        sessionContext: validatedData.sessionContext,
        previousMessages: recentMessages.map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        })),
      });
      
      const status = aiWrapper.getAIStatus();
      
      res.json({
        ...result,
        mode: status.mode,
      });
    } catch (error) {
      console.error('AI Chat error:', error);
      res.status(500).json({ error: 'Failed to generate chat response' });
    }
  });

  // AI Status endpoint
  app.get('/api/ai/status', requireAuth, (req, res) => {
    const status = aiWrapper.getAIStatus();
    res.json(status);
  });

  // User Profile & Settings routes
  app.patch('/api/user/profile', checkCSRF, requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const validatedData = updateUserProfileSchema.parse(req.body);
      
      // If email is being updated, check if it's already in use
      if (validatedData.email) {
        const existingUser = await storage.getUserByEmail(validatedData.email);
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }

      const updatedUser = await storage.updateUserProfile(userId, validatedData);
      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: 'Invalid update data' });
    }
  });

  app.get('/api/user/stats', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Activity routes
  app.get('/api/activities', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      const activities = await storage.getActivities(userId, limit);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch activities' });
    }
  });

  app.post('/api/activities', checkCSRF, requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const validatedData = insertActivitySchema.parse({
        ...req.body,
        userId,
      });
      const activity = await storage.createActivity(validatedData);
      res.json(activity);
    } catch (error) {
      res.status(400).json({ error: 'Invalid activity data' });
    }
  });

  // Saved Items routes
  app.get('/api/saved', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const type = req.query.type as string | undefined;
      const items = await storage.getSavedItems(userId, type);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch saved items' });
    }
  });

  app.post('/api/saved', checkCSRF, requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const validatedData = insertSavedItemSchema.parse({
        ...req.body,
        userId,
      });
      const item = await storage.createSavedItem(validatedData);

      // Send n8n webhook notification (non-blocking)
      if (n8nWebhooks) {
        const user = await storage.getUser(userId);
        if (user) {
          n8nWebhooks.onItemSaved({
            userId: user.id,
            userEmail: user.email,
            itemType: item.type,
            itemTitle: item.title,
            itemData: item.data,
            timestamp: new Date(),
          }).catch(err => console.error('n8n webhook error:', err));
        }
      }

      res.json(item);
    } catch (error) {
      res.status(400).json({ error: 'Invalid saved item data' });
    }
  });

  app.delete('/api/saved/:id', checkCSRF, requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { id } = req.params;
      const deleted = await storage.deleteSavedItem(id, userId);
      if (!deleted) {
        return res.status(404).json({ error: 'Item not found or not authorized' });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete item' });
    }
  });

  // SEO Audit routes
  app.post('/api/seo-audit', checkCSRF, requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const validatedData = runAuditRequestSchema.parse(req.body);
      
      // Create initial audit record with pending status
      const audit = await storage.createAudit({
        userId,
        url: validatedData.url,
        score: 0,
        status: 'running',
        findings: [],
        recommendations: [],
        metadata: {},
      });

      // Run audit asynchronously
      (async () => {
        try {
          const result = await seoAuditor.runAudit(validatedData.url);
          
          // Update the existing audit record with results
          await storage.updateAudit(audit.id, {
            score: result.score,
            status: 'completed',
            findings: result.findings,
            recommendations: result.recommendations,
            metadata: result.metadata,
          });

          // Create activity
          await storage.createActivity({
            userId,
            type: 'seo_audit',
            description: `Ran SEO audit for ${validatedData.url}`,
            metadata: { auditId: audit.id, score: result.score },
          });
        } catch (error) {
          console.error('SEO audit failed:', error);
          await storage.updateAuditStatus(audit.id, 'failed');
        }
      })();

      res.json({
        id: audit.id,
        status: 'running',
        message: 'SEO audit started. Check back soon for results.',
      });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to start audit' });
      }
    }
  });

  app.get('/api/seo-audit/history', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const audits = await storage.getAudits(userId, limit);
      
      res.json({
        audits: audits.map(audit => ({
          id: audit.id,
          url: audit.url,
          score: audit.score,
          status: audit.status,
          findings: audit.findings,
          recommendations: audit.recommendations,
          metadata: audit.metadata,
          createdAt: audit.createdAt.toISOString(),
        })),
        total: audits.length,
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch audit history' });
    }
  });

  app.get('/api/seo-audit/:id', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { id } = req.params;
      
      const audit = await storage.getAudit(id, userId);
      if (!audit) {
        return res.status(404).json({ error: 'Audit not found or not authorized' });
      }

      res.json({
        id: audit.id,
        url: audit.url,
        score: audit.score,
        status: audit.status,
        findings: audit.findings,
        recommendations: audit.recommendations,
        metadata: audit.metadata,
        createdAt: audit.createdAt.toISOString(),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch audit' });
    }
  });

  // Rank Tracking routes
  app.post('/api/rank-tracking/keywords', checkCSRF, requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const validatedData = addKeywordRequestSchema.parse(req.body);
      
      const keyword = await storage.createKeyword({
        userId,
        keyword: validatedData.keyword,
        targetUrl: validatedData.targetUrl,
        searchEngine: validatedData.searchEngine ?? 'google',
        location: validatedData.location,
        device: validatedData.device ?? 'desktop',
      });

      await rankTrackerService.createInitialSnapshot(keyword.id, userId);

      await storage.createActivity({
        userId,
        type: 'rank_tracking',
        description: `Started tracking "${validatedData.keyword}"`,
        metadata: { keywordId: keyword.id },
      });

      res.json(keyword);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Failed to add keyword' });
      }
    }
  });

  app.get('/api/rank-tracking/keywords', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const keywordsWithTrends = await rankTrackerService.getAllKeywordsWithTrends(userId);
      
      res.json({
        keywords: keywordsWithTrends.map(kw => ({
          id: kw.id,
          keyword: kw.keyword,
          targetUrl: kw.targetUrl,
          searchEngine: kw.searchEngine,
          location: kw.location,
          device: kw.device,
          createdAt: kw.createdAt.toISOString(),
          currentRank: kw.currentRank,
          previousRank: kw.previousRank,
          rankChange: kw.rankChange,
          snapshots: kw.snapshots.map(s => ({
            rank: s.rank,
            createdAt: s.createdAt.toISOString(),
          })),
        })),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch keywords' });
    }
  });

  app.get('/api/rank-tracking/keywords/:id', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { id } = req.params;
      
      const keywordWithTrend = await rankTrackerService.getKeywordWithTrend(id, userId);
      if (!keywordWithTrend) {
        return res.status(404).json({ error: 'Keyword not found or not authorized' });
      }

      res.json({
        id: keywordWithTrend.id,
        keyword: keywordWithTrend.keyword,
        targetUrl: keywordWithTrend.targetUrl,
        searchEngine: keywordWithTrend.searchEngine,
        location: keywordWithTrend.location,
        device: keywordWithTrend.device,
        createdAt: keywordWithTrend.createdAt.toISOString(),
        currentRank: keywordWithTrend.currentRank,
        previousRank: keywordWithTrend.previousRank,
        rankChange: keywordWithTrend.rankChange,
        snapshots: keywordWithTrend.snapshots.map(s => ({
          rank: s.rank,
          createdAt: s.createdAt.toISOString(),
        })),
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch keyword' });
    }
  });

  app.post('/api/rank-tracking/check/:id', checkCSRF, requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { id } = req.params;
      
      const result = await rankTrackerService.checkRank(id, userId);
      if (!result) {
        return res.status(404).json({ error: 'Keyword not found or not authorized' });
      }

      await storage.createActivity({
        userId,
        type: 'rank_check',
        description: `Checked rank for "${result.keyword}"${result.currentRank ? ` - Position ${result.currentRank}` : ' - Not ranking'}`,
        metadata: { 
          keywordId: id, 
          rank: result.currentRank,
          change: result.rankChange,
        },
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to check rank' });
    }
  });

  app.delete('/api/rank-tracking/keywords/:id', checkCSRF, requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { id } = req.params;
      
      const deleted = await storage.deleteKeyword(id, userId);
      if (!deleted) {
        return res.status(404).json({ error: 'Keyword not found or not authorized' });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete keyword' });
    }
  });

  app.post('/api/backlinks/analyze', checkCSRF, requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const validated = analyzeBacklinksRequestSchema.parse(req.body);
      
      const result = await backlinkAnalyzerService.analyzeBacklinks(validated.targetUrl, userId);
      
      await storage.createActivity({
        userId,
        type: 'backlink_analysis',
        description: `Analyzed backlinks for ${validated.targetUrl}`,
        metadata: { 
          profileId: result.profileId,
          totalBacklinks: result.totalBacklinks,
          toxicCount: result.toxicCount,
        },
      });

      res.json(result);
    } catch (error: any) {
      console.error('Backlink analysis error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to analyze backlinks' });
    }
  });

  app.get('/api/backlinks', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const profiles = await storage.getBacklinkProfiles(userId);
      
      res.json({ profiles });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch backlink profiles' });
    }
  });

  app.get('/api/backlinks/:id', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { id } = req.params;
      
      const profileData = await backlinkAnalyzerService.getProfileWithData(id, userId);
      if (!profileData) {
        return res.status(404).json({ error: 'Backlink profile not found or not authorized' });
      }

      res.json(profileData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch backlink profile' });
    }
  });

  app.post('/api/backlinks/refresh/:id', checkCSRF, requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { id } = req.params;
      
      const result = await backlinkAnalyzerService.refreshBacklinkAnalysis(id, userId);
      
      await storage.createActivity({
        userId,
        type: 'backlink_refresh',
        description: `Refreshed backlink analysis for ${result.targetUrl}`,
        metadata: { 
          profileId: id,
          newBacklinks: result.newBacklinks,
          lostBacklinks: result.lostBacklinks,
        },
      });

      res.json(result);
    } catch (error: any) {
      console.error('Backlink refresh error:', error);
      if (error.message === 'Backlink profile not found') {
        return res.status(404).json({ error: 'Backlink profile not found or not authorized' });
      }
      res.status(500).json({ error: 'Failed to refresh backlink analysis' });
    }
  });

  app.delete('/api/backlinks/:id', checkCSRF, requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { id } = req.params;
      
      const deleted = await storage.deleteBacklinkProfile(id, userId);
      if (!deleted) {
        return res.status(404).json({ error: 'Backlink profile not found or not authorized' });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete backlink profile' });
    }
  });

  app.post('/api/trends/search', checkCSRF, requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const validatedData = searchTrendsRequestSchema.parse(req.body);
      
      const result = await trendDiscoveryService.analyzeTrend(
        userId,
        validatedData.keyword,
        validatedData.industry,
        validatedData.location
      );
      
      await storage.createActivity({
        userId,
        type: 'trend_search',
        description: `Analyzed trend for "${validatedData.keyword}"`,
        metadata: { 
          keyword: validatedData.keyword,
          industry: validatedData.industry,
          trend: result.trend,
        },
      });
      
      n8nWebhooks?.trigger('trend_search', {
        userId,
        keyword: validatedData.keyword,
        currentVolume: result.currentVolume,
        trend: result.trend,
      });

      res.json(result);
    } catch (error: any) {
      console.error('Trend search error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to analyze trend' });
    }
  });

  app.get('/api/trends', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const searches = await storage.getTrendSearches(userId);
      res.json(searches);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch trend searches' });
    }
  });

  app.get('/api/trends/:id', requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { id } = req.params;
      
      const trendData = await trendDiscoveryService.getTrendHistory(id, userId);
      if (!trendData) {
        return res.status(404).json({ error: 'Trend search not found or not authorized' });
      }

      res.json(trendData);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch trend data' });
    }
  });

  app.post('/api/trends/refresh/:id', checkCSRF, requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { id } = req.params;
      
      const result = await trendDiscoveryService.refreshTrend(id, userId);
      if (!result) {
        return res.status(404).json({ error: 'Trend search not found or not authorized' });
      }

      await storage.createActivity({
        userId,
        type: 'trend_refresh',
        description: `Refreshed trend data for "${result.keyword}"`,
        metadata: { 
          searchId: id,
          newVolume: result.currentVolume,
          trend: result.trend,
        },
      });

      res.json(result);
    } catch (error) {
      console.error('Trend refresh error:', error);
      res.status(500).json({ error: 'Failed to refresh trend data' });
    }
  });

  app.delete('/api/trends/:id', checkCSRF, requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { id } = req.params;
      
      const deleted = await storage.deleteTrendSearch(id, userId);
      if (!deleted) {
        return res.status(404).json({ error: 'Trend search not found or not authorized' });
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete trend search' });
    }
  });

  app.post('/api/trends/suggestions', checkCSRF, requireAuth, async (req, res) => {
    try {
      const { keyword, industry } = req.body;
      
      if (!keyword || typeof keyword !== 'string') {
        return res.status(400).json({ error: 'Keyword is required' });
      }

      const suggestions = await trendDiscoveryService.getTopicSuggestions(
        keyword,
        industry
      );

      res.json({ suggestions });
    } catch (error) {
      console.error('Topic suggestions error:', error);
      res.status(500).json({ error: 'Failed to generate topic suggestions' });
    }
  });

  app.post('/api/reports/seo-audit/:id', checkCSRF, requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { id } = req.params;
      
      const audit = await storage.getAudit(id, userId);
      if (!audit) {
        return res.status(404).json({ error: 'Audit not found or not authorized' });
      }

      if (audit.status !== 'completed') {
        return res.status(400).json({ error: 'Audit must be completed before generating PDF' });
      }

      const pdfBuffer = await pdfGeneratorService.generateSEOAuditReport(audit);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="seo-audit-${audit.url.replace(/[^a-z0-9]/gi, '-')}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ error: 'Failed to generate PDF report' });
    }
  });

  app.post('/api/reports/rank-tracking/:keywordId', checkCSRF, requireAuth, async (req, res) => {
    try {
      const userId = req.session!.userId!;
      const { keywordId } = req.params;
      
      const keyword = await storage.getKeyword(keywordId, userId);
      if (!keyword) {
        return res.status(404).json({ error: 'Keyword not found or not authorized' });
      }

      const snapshots = await storage.getRankSnapshots(keywordId);
      
      const pdfBuffer = await pdfGeneratorService.generateRankTrackingReport({
        keyword: keyword.keyword,
        targetUrl: keyword.targetUrl,
        currentRank: snapshots.length > 0 ? snapshots[snapshots.length - 1].rank : null,
        history: snapshots.map((s) => ({
          rank: s.rank,
          checkedAt: s.createdAt,
        })),
      });
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="rank-tracking-${keyword.keyword.replace(/[^a-z0-9]/gi, '-')}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error('PDF generation error:', error);
      res.status(500).json({ error: 'Failed to generate PDF report' });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
