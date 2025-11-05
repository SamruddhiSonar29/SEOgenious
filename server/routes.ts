import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcryptjs";
import { insertUserSchema, insertChatMessageSchema, updateUserProfileSchema, insertActivitySchema, insertSavedItemSchema } from "@shared/schema";
import { openai } from "./openai";
import { initN8nWebhooks } from "./n8n-webhooks";

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

      // Call OpenAI API
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      const completion = await openai.chat.completions.create({
        model: "gpt-5",
        max_completion_tokens: 8192,
        messages: [
          {
            role: 'system',
            content: 'You are an expert SEO consultant assistant. Help users with keyword research, content optimization, technical SEO, on-page SEO, link building strategies, and general SEO best practices. Provide actionable, practical advice tailored to their needs.',
          },
          ...recentMessages,
        ],
      });

      const assistantMessage = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

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

  const httpServer = createServer(app);

  return httpServer;
}
