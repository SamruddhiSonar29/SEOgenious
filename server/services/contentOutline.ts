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
  const prompt = `You are an expert SEO content strategist. Generate a comprehensive, SEO-optimized content outline for the topic: "${topic}"

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

  const response = await callAI(prompt, {
    temperature: 0.7,
    model: 'gpt-4o',
    responseFormat: 'json'
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
