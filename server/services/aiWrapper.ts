import OpenAI from "openai";
import pLimit from "p-limit";
import pRetry, { AbortError } from "p-retry";

/**
 * AI Wrapper Service
 * 
 * Provides AI-powered features with:
 * - Automatic retry with exponential backoff
 * - Rate limiting for concurrent requests
 * - Mock fallback when AI is disabled
 * - Support for both Replit AI Integration and custom OpenAI keys
 */

// Feature flag: Enable real AI responses (default: false)
const ENABLE_REAL_AI = process.env.ENABLE_REAL_AI === "true";

// AI Mode: 'real' uses OpenAI, 'mock' uses mock data
const AI_MODE = process.env.AI_MODE || "mock";

// Initialize OpenAI client
// Uses Replit AI Integration by default (no API key needed)
// Falls back to custom OPENAI_API_KEY if provided
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || undefined,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "dummy-key",
});

// Rate limiter: max 5 concurrent requests
const limit = pLimit(5);

// Check if error is rate limit related
function isRateLimitError(error: any): boolean {
  const errorMsg = error?.message || String(error);
  return (
    errorMsg.includes("429") ||
    errorMsg.includes("RATELIMIT_EXCEEDED") ||
    errorMsg.toLowerCase().includes("quota") ||
    errorMsg.toLowerCase().includes("rate limit")
  );
}

// Generic AI call with retry and rate limiting
async function callAI(
  systemPrompt: string,
  userPrompt: string,
  options: {
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  } = {}
): Promise<string> {
  const {
    temperature = 0.7,
    maxTokens = 2048,
    jsonMode = false,
  } = options;

  return limit(() =>
    pRetry(
      async () => {
        try {
          const response = await openai.chat.completions.create({
            model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            max_completion_tokens: maxTokens,
            response_format: jsonMode ? { type: "json_object" } : undefined,
          });

          return response.choices[0]?.message?.content || "";
        } catch (error: any) {
          console.error("AI call error:", error.message);
          
          // Retry on rate limit errors
          if (isRateLimitError(error)) {
            throw error;
          }
          
          // Don't retry other errors
          throw new AbortError(error);
        }
      },
      {
        retries: 5,
        minTimeout: 1000,
        maxTimeout: 30000,
        factor: 2,
      }
    )
  );
}

/**
 * Content Rewrite
 * Rewrite content for better SEO and readability
 */
export async function contentRewrite(params: {
  content: string;
  targetKeyword?: string;
  tone?: "professional" | "casual" | "technical";
}): Promise<{ rewrittenContent: string; suggestions: string[] }> {
  const { content, targetKeyword, tone = "professional" } = params;

  // Check if AI is enabled
  if (!ENABLE_REAL_AI || AI_MODE === "mock") {
    return {
      rewrittenContent: content
        .replace(/\b(\w+)\b/g, (match) => match.charAt(0).toUpperCase() + match.slice(1).toLowerCase())
        .trim(),
      suggestions: [
        "Add more descriptive headers",
        "Include bullet points for readability",
        "Optimize for target keyword density",
      ],
    };
  }

  const systemPrompt = `You are an expert SEO content writer. Rewrite content to be more engaging, SEO-friendly, and maintain a ${tone} tone.`;
  
  const userPrompt = `
Rewrite the following content:
${content}

${targetKeyword ? `Target Keyword: ${targetKeyword}` : ""}

Return a JSON object with:
{
  "rewrittenContent": "the rewritten text",
  "suggestions": ["list of improvement suggestions"]
}
  `.trim();

  const response = await callAI(systemPrompt, userPrompt, { jsonMode: true });
  
  try {
    return JSON.parse(response);
  } catch {
    return {
      rewrittenContent: response,
      suggestions: ["Review the rewritten content for accuracy"],
    };
  }
}

/**
 * Executive Summary
 * Generate an executive summary from a report
 */
export async function executiveSummary(params: {
  reportText: string;
  maxLength?: number;
}): Promise<{
  summary: string;
  keyPoints: string[];
  actionItems: string[];
}> {
  const { reportText, maxLength = 200 } = params;

  // Mock fallback
  if (!ENABLE_REAL_AI || AI_MODE === "mock") {
    return {
      summary: "This report highlights key SEO metrics and performance indicators. Overall trends show positive growth with opportunities for optimization.",
      keyPoints: [
        "Traffic increased by 15% month-over-month",
        "Top performing keywords identified",
        "Technical SEO issues detected and prioritized",
      ],
      actionItems: [
        "Fix critical on-page SEO issues",
        "Optimize top 10 underperforming pages",
        "Build backlinks to high-priority content",
      ],
    };
  }

  const systemPrompt = "You are an expert SEO analyst. Create concise, actionable executive summaries from SEO reports.";
  
  const userPrompt = `
Analyze this SEO report and create an executive summary (max ${maxLength} words):

${reportText}

Return a JSON object with:
{
  "summary": "brief overview",
  "keyPoints": ["list of key findings"],
  "actionItems": ["prioritized action items"]
}
  `.trim();

  const response = await callAI(systemPrompt, userPrompt, { jsonMode: true, maxTokens: 1024 });
  
  try {
    return JSON.parse(response);
  } catch {
    return {
      summary: response.substring(0, maxLength),
      keyPoints: [],
      actionItems: [],
    };
  }
}

/**
 * Content Outline Refine
 * Refine and improve content outlines
 */
export async function contentOutlineRefine(params: {
  outlineSeed: string;
  targetKeyword: string;
  targetAudience?: string;
}): Promise<{
  refinedOutline: Array<{
    heading: string;
    subheadings: string[];
    keyPoints: string[];
  }>;
  estimatedWordCount: number;
}> {
  const { outlineSeed, targetKeyword, targetAudience = "general audience" } = params;

  // Mock fallback
  if (!ENABLE_REAL_AI || AI_MODE === "mock") {
    return {
      refinedOutline: [
        {
          heading: "Introduction to " + targetKeyword,
          subheadings: ["What is it?", "Why it matters"],
          keyPoints: ["Define the topic", "Establish importance"],
        },
        {
          heading: "Main Benefits",
          subheadings: ["Key advantages", "Use cases"],
          keyPoints: ["List benefits", "Provide examples"],
        },
        {
          heading: "Conclusion",
          subheadings: ["Summary", "Next steps"],
          keyPoints: ["Recap main points", "Call to action"],
        },
      ],
      estimatedWordCount: 1500,
    };
  }

  const systemPrompt = "You are an expert content strategist. Create comprehensive, SEO-optimized content outlines.";
  
  const userPrompt = `
Refine this content outline for "${targetKeyword}":

${outlineSeed}

Target Audience: ${targetAudience}

Return a JSON object with:
{
  "refinedOutline": [
    {
      "heading": "H2 heading",
      "subheadings": ["H3 subheadings"],
      "keyPoints": ["points to cover"]
    }
  ],
  "estimatedWordCount": number
}
  `.trim();

  const response = await callAI(systemPrompt, userPrompt, { jsonMode: true, maxTokens: 2048 });
  
  try {
    return JSON.parse(response);
  } catch {
    return {
      refinedOutline: [],
      estimatedWordCount: 0,
    };
  }
}

/**
 * Chatbot Response
 * Generate intelligent chatbot responses with context
 */
export async function chatbotResponse(params: {
  userMessage: string;
  sessionContext?: string;
  previousMessages?: Array<{ role: "user" | "assistant"; content: string }>;
}): Promise<{ response: string; suggestions: string[] }> {
  const { userMessage, sessionContext = "", previousMessages = [] } = params;

  // Mock fallback (existing chatbot behavior)
  if (!ENABLE_REAL_AI || AI_MODE === "mock") {
    const lowerMessage = userMessage.toLowerCase();
    
    let response = "I can help you with SEO optimization! What would you like to know?";
    
    if (lowerMessage.includes("keyword")) {
      response = "For keyword research, use our Keywords tool to cluster related keywords and find opportunities.";
    } else if (lowerMessage.includes("content")) {
      response = "Our Content Analyzer can help you optimize your content for better search rankings!";
    } else if (lowerMessage.includes("competitor")) {
      response = "Check out the Competitors page to analyze top-ranking pages for any keyword.";
    } else if (lowerMessage.includes("backlink")) {
      response = "Backlinks are crucial for SEO! Focus on getting quality links from authoritative sites.";
    }

    return {
      response,
      suggestions: [
        "How do I improve my keyword rankings?",
        "What makes good SEO content?",
        "How can I analyze my competitors?",
      ],
    };
  }

  const systemPrompt = `You are an expert SEO consultant assistant. Provide helpful, actionable SEO advice.
  
Context: ${sessionContext}

Be concise and practical. Focus on SEO best practices, keyword optimization, content strategy, and technical SEO.`;

  // Build conversation history
  const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  // Add previous messages for context (limit to last 5)
  previousMessages.slice(-5).forEach((msg) => {
    messages.push({ role: msg.role, content: msg.content });
  });

  // Add current message
  messages.push({ role: "user", content: userMessage });

  try {
    const response = await limit(() =>
      pRetry(
        async () => {
          const result = await openai.chat.completions.create({
            model: "gpt-5",
            messages: messages as any,
            max_completion_tokens: 1024,
          });

          return result.choices[0]?.message?.content || "";
        },
        {
          retries: 3,
          minTimeout: 1000,
          maxTimeout: 10000,
          factor: 2,
        }
      )
    );

    return {
      response,
      suggestions: [
        "Tell me more about this",
        "What are the next steps?",
        "How can I implement this?",
      ],
    };
  } catch (error) {
    console.error("Chatbot AI error:", error);
    
    // Fallback to mock response on error
    return {
      response: "I'm having trouble connecting to AI services. Please try asking your question again or check our documentation.",
      suggestions: [],
    };
  }
}

/**
 * Backlink Risk Assessment
 * Analyze backlink profile and provide risk assessment
 */
export async function backlinkRiskAssessment(params: {
  totalBacklinks: number;
  toxicCount: number;
  spamScore: number;
  domainAuthority: number;
}): Promise<{ assessment: string; recommendations: string[] }> {
  const { totalBacklinks, toxicCount, spamScore, domainAuthority } = params;

  // Check if AI is enabled
  if (!ENABLE_REAL_AI || AI_MODE === "mock") {
    const toxicPercentage = totalBacklinks > 0 ? (toxicCount / totalBacklinks) * 100 : 0;
    
    let assessment = "Your backlink profile shows ";
    if (toxicPercentage > 30) {
      assessment += "HIGH RISK: A significant portion of your backlinks are toxic or spammy. This could harm your SEO rankings.";
    } else if (toxicPercentage > 15) {
      assessment += "MEDIUM RISK: Some toxic backlinks detected. Monitor and disavow if necessary.";
    } else {
      assessment += "LOW RISK: Most of your backlinks appear to be from quality sources.";
    }

    return {
      assessment,
      recommendations: [
        "Review and disavow toxic backlinks using Google Search Console",
        "Focus on acquiring high-quality backlinks from authoritative domains",
        "Monitor your backlink profile regularly for new toxic links",
      ],
    };
  }

  const systemPrompt = "You are an SEO expert analyzing backlink profiles. Provide concise risk assessment and actionable recommendations.";
  
  const userPrompt = `
Analyze this backlink profile:
- Total Backlinks: ${totalBacklinks}
- Toxic Backlinks: ${toxicCount}
- Average Spam Score: ${spamScore}
- Average Domain Authority: ${domainAuthority}

Provide:
1. Risk assessment (2-3 sentences)
2. Top 3-5 actionable recommendations

Return as JSON: { "assessment": string, "recommendations": string[] }
`;

  try {
    const response = await callAI(systemPrompt, userPrompt, {
      jsonMode: true,
      maxTokens: 800,
    });

    const parsed = JSON.parse(response);
    return {
      assessment: parsed.assessment || "Unable to assess risk at this time.",
      recommendations: parsed.recommendations || [],
    };
  } catch (error) {
    console.error("Backlink risk assessment AI error:", error);
    
    // Fallback to mock response
    const toxicPercentage = totalBacklinks > 0 ? (toxicCount / totalBacklinks) * 100 : 0;
    
    let assessment = "Your backlink profile shows ";
    if (toxicPercentage > 30) {
      assessment += "HIGH RISK: A significant portion of your backlinks are toxic or spammy.";
    } else if (toxicPercentage > 15) {
      assessment += "MEDIUM RISK: Some toxic backlinks detected.";
    } else {
      assessment += "LOW RISK: Most backlinks appear to be from quality sources.";
    }

    return {
      assessment,
      recommendations: [
        "Review toxic backlinks in Google Search Console",
        "Focus on quality link building from authoritative sources",
      ],
    };
  }
}

/**
 * Get AI service status
 */
export function getAIStatus(): {
  enabled: boolean;
  mode: string;
  provider: string;
} {
  const hasReplitIntegration = !!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
  const hasCustomKey = !!process.env.OPENAI_API_KEY;
  
  return {
    enabled: ENABLE_REAL_AI && (hasReplitIntegration || hasCustomKey),
    mode: AI_MODE,
    provider: hasReplitIntegration ? "replit-ai-integration" : hasCustomKey ? "custom-openai-key" : "none",
  };
}
