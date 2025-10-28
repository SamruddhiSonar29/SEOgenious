import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

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

export async function registerRoutes(app: Express): Promise<Server> {
  app.post('/api/keyword_research', (req, res) => {
    const { topic } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    const keywords = generateKeywords(topic);
    res.json(keywords);
  });

  app.post('/api/content_outline', (req, res) => {
    const { keyword } = req.body;
    if (!keyword) {
      return res.status(400).json({ error: 'Keyword is required' });
    }
    const outline = generateOutline(keyword);
    res.json(outline);
  });

  app.post('/api/onpage_seo', (req, res) => {
    const { keyword, text } = req.body;
    if (!keyword || !text) {
      return res.status(400).json({ error: 'Keyword and text are required' });
    }
    const suggestions = generateSEOSuggestions(keyword, text);
    res.json(suggestions);
  });

  const httpServer = createServer(app);

  return httpServer;
}
