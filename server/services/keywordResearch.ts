import * as aiWrapper from './aiWrapper';

export interface KeywordIdea {
  keyword: string;
  searchVolume: number;
  competition: number; // 0-100
  difficulty: number; // 0-100
  cpc: number; // in USD
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  trend: 'rising' | 'stable' | 'declining';
}

export interface KeywordResearchResult {
  seedKeyword: string;
  keywords: KeywordIdea[];
  totalResults: number;
}

export async function generateKeywordIdeas(
  seedKeyword: string,
  count: number = 50
): Promise<KeywordResearchResult> {
  const systemPrompt = "You are an expert SEO keyword researcher. Generate comprehensive, realistic keyword suggestions with accurate metrics.";
  
  const userPrompt = `Generate ${count} keyword ideas related to "${seedKeyword}".

For each keyword, provide:
- keyword: The keyword phrase
- searchVolume: Monthly search volume (realistic number between 100-100000)
- competition: Competition level 0-100 (0=easy, 100=very competitive)
- difficulty: SEO difficulty 0-100 (0=easy to rank, 100=very hard)
- cpc: Cost per click in USD (between 0.10 and 50.00)
- intent: Search intent (informational, commercial, transactional, or navigational)
- trend: Trend direction (rising, stable, or declining)

Include:
- 40% related keywords (variations and synonyms)
- 30% long-tail keywords (3-5 words)
- 20% question-based keywords (how, what, why, etc.)
- 10% competitor/comparison keywords

Make search volumes, competition, and CPC realistic for the niche. Use proper SEO keyword research data patterns.

Return ONLY valid JSON in this exact format:
{
  "keywords": [
    {
      "keyword": "example keyword",
      "searchVolume": 5000,
      "competition": 65,
      "difficulty": 70,
      "cpc": 2.50,
      "intent": "commercial",
      "trend": "rising"
    }
  ]
}`;

  const result = await aiWrapper.callAI(systemPrompt, userPrompt, {
    temperature: 0.7,
    maxTokens: 3000,
    jsonMode: true,
  });

  try {
    const parsed = JSON.parse(result);
    
    // Validate and clean the data
    const keywords: KeywordIdea[] = parsed.keywords.map((kw: any) => ({
      keyword: kw.keyword,
      searchVolume: Math.max(0, Math.round(kw.searchVolume)),
      competition: Math.min(100, Math.max(0, Math.round(kw.competition))),
      difficulty: Math.min(100, Math.max(0, Math.round(kw.difficulty))),
      cpc: Math.max(0.01, Math.min(100, parseFloat(kw.cpc.toFixed(2)))),
      intent: ['informational', 'commercial', 'transactional', 'navigational'].includes(kw.intent) 
        ? kw.intent 
        : 'informational',
      trend: ['rising', 'stable', 'declining'].includes(kw.trend) 
        ? kw.trend 
        : 'stable',
    }));

    return {
      seedKeyword,
      keywords: keywords.slice(0, count),
      totalResults: keywords.length,
    };
  } catch (error) {
    console.error('Failed to parse AI keyword research response:', error);
    throw new Error('Failed to generate keyword ideas');
  }
}
