import { callAI } from './aiWrapper';

export interface OutlineSection {
  heading: string;
  level: 'h2' | 'h3';
  keyPoints: string[];
  wordCount: number;
}

export interface ContentOutline {
  title: string;
  metaDescription: string;
  targetWordCount: number;
  sections: OutlineSection[];
  seoTips: string[];
  relatedQuestions: string[];
}

/**
 * Generate a comprehensive content outline using AI
 */
export async function generateContentOutline(
  topic: string
): Promise<ContentOutline> {
  const ENABLE_REAL_AI = process.env.ENABLE_REAL_AI === "true";
  const AI_MODE = process.env.AI_MODE || "mock";

  if (!ENABLE_REAL_AI || AI_MODE === "mock") {
    return {
      title: `Complete Guide to ${topic}`,
      metaDescription: `Discover everything you need to know about ${topic}. This comprehensive guide covers best practices, tips, and actionable strategies.`,
      targetWordCount: 2000,
      sections: [
        {
          heading: `What is ${topic}?`,
          level: 'h2',
          keyPoints: [
            'Definition and overview',
            'Why it matters in today\'s landscape',
            'Common misconceptions',
          ],
          wordCount: 250,
        },
        {
          heading: 'Key Components',
          level: 'h3',
          keyPoints: [
            'Essential elements to understand',
            'Core principles',
          ],
          wordCount: 200,
        },
        {
          heading: `Benefits of ${topic}`,
          level: 'h2',
          keyPoints: [
            'Immediate advantages',
            'Long-term impact',
            'ROI considerations',
            'Real-world success stories',
          ],
          wordCount: 300,
        },
        {
          heading: `How to Get Started with ${topic}`,
          level: 'h2',
          keyPoints: [
            'Step-by-step implementation guide',
            'Tools and resources needed',
            'Setting realistic expectations',
          ],
          wordCount: 350,
        },
        {
          heading: 'Best Practices',
          level: 'h3',
          keyPoints: [
            'Industry-proven strategies',
            'Tips from experts',
          ],
          wordCount: 250,
        },
        {
          heading: 'Common Mistakes to Avoid',
          level: 'h3',
          keyPoints: [
            'Pitfalls beginners face',
            'How to troubleshoot issues',
          ],
          wordCount: 200,
        },
        {
          heading: `Advanced ${topic} Strategies`,
          level: 'h2',
          keyPoints: [
            'Optimization techniques',
            'Scaling considerations',
            'Expert-level tactics',
          ],
          wordCount: 300,
        },
        {
          heading: 'Conclusion and Next Steps',
          level: 'h2',
          keyPoints: [
            'Summary of key takeaways',
            'Recommended action plan',
            'Additional resources',
          ],
          wordCount: 150,
        },
      ],
      seoTips: [
        'Include your target keyword naturally in the first 100 words',
        'Use semantic keywords and LSI variations throughout',
        'Add internal links to related content on your site',
        'Optimize images with descriptive alt text',
        'Include a clear call-to-action in the conclusion',
        'Structure content with proper heading hierarchy (H1 > H2 > H3)',
      ],
      relatedQuestions: [
        `What are the benefits of ${topic}?`,
        `How do I get started with ${topic}?`,
        `What are common ${topic} mistakes?`,
        `Is ${topic} worth the investment?`,
        `How long does it take to see results from ${topic}?`,
        `What tools are needed for ${topic}?`,
      ],
    };
  }

  const systemPrompt = `You are an expert SEO content strategist. Generate comprehensive, SEO-optimized content outlines.`;
  
  const userPrompt = `Generate a comprehensive, SEO-optimized content outline for the topic: "${topic}"

Create a detailed outline that includes:
1. An engaging main title (H1)
2. A compelling meta description (150-160 characters)
3. 5-8 main sections with H2 headings
4. 2-4 subsections (H3) under relevant H2s
5. 2-4 key points to cover under each heading
6. Recommended word count for each section
7. 5-7 actionable SEO tips specific to this topic
8. 5-8 related questions readers might ask

Return ONLY valid JSON matching this structure:
{
  "title": "Main article title (H1)",
  "metaDescription": "Meta description 150-160 chars",
  "targetWordCount": 2000,
  "sections": [
    {
      "heading": "Section title",
      "level": "h2",
      "keyPoints": ["Point 1", "Point 2", "Point 3"],
      "wordCount": 300
    },
    {
      "heading": "Subsection title",
      "level": "h3",
      "keyPoints": ["Point 1", "Point 2"],
      "wordCount": 200
    }
  ],
  "seoTips": [
    "Tip 1",
    "Tip 2"
  ],
  "relatedQuestions": [
    "Question 1?",
    "Question 2?"
  ]
}

Important:
- Make the outline comprehensive and well-structured
- Ensure logical flow from introduction to conclusion
- Include specific, actionable key points
- Word counts should sum close to targetWordCount
- SEO tips should be specific to the topic
- Questions should be natural, search-intent focused`;

  const response = await callAI(systemPrompt, userPrompt, {
    temperature: 0.7,
    maxTokens: 3000,
    jsonMode: true,
  });

  let outline: ContentOutline;
  
  try {
    outline = JSON.parse(response);
  } catch (error) {
    throw new Error('Failed to parse AI response as JSON');
  }

  // Validate and normalize the outline
  if (!outline.title || !outline.sections || !Array.isArray(outline.sections)) {
    throw new Error('Invalid outline structure from AI');
  }

  // Ensure we have valid sections
  outline.sections = outline.sections.filter(section => 
    section.heading && 
    (section.level === 'h2' || section.level === 'h3') &&
    Array.isArray(section.keyPoints) &&
    section.keyPoints.length > 0
  );

  // Ensure arrays exist
  outline.seoTips = Array.isArray(outline.seoTips) ? outline.seoTips : [];
  outline.relatedQuestions = Array.isArray(outline.relatedQuestions) ? outline.relatedQuestions : [];

  // Set defaults
  outline.targetWordCount = outline.targetWordCount || 2000;
  outline.metaDescription = outline.metaDescription || '';

  // Ensure word counts are reasonable
  outline.sections = outline.sections.map(section => ({
    ...section,
    wordCount: Math.max(100, Math.min(section.wordCount || 200, 1000))
  }));

  return outline;
}
