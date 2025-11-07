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
  const ENABLE_REAL_AI = process.env.ENABLE_REAL_AI === "true";
  const AI_MODE = process.env.AI_MODE || "mock";

  if (!ENABLE_REAL_AI || AI_MODE === "mock") {
    const mockKeywords: KeywordIdea[] = [
      { keyword: seedKeyword, searchVolume: 12000, competition: 65, difficulty: 70, cpc: 2.50, intent: 'commercial', trend: 'stable' },
      { keyword: `best ${seedKeyword}`, searchVolume: 8500, competition: 72, difficulty: 75, cpc: 3.20, intent: 'commercial', trend: 'rising' },
      { keyword: `${seedKeyword} guide`, searchVolume: 6200, competition: 55, difficulty: 60, cpc: 1.80, intent: 'informational', trend: 'stable' },
      { keyword: `how to ${seedKeyword}`, searchVolume: 9800, competition: 48, difficulty: 52, cpc: 1.50, intent: 'informational', trend: 'rising' },
      { keyword: `${seedKeyword} tips`, searchVolume: 4300, competition: 52, difficulty: 58, cpc: 1.60, intent: 'informational', trend: 'stable' },
      { keyword: `${seedKeyword} for beginners`, searchVolume: 5100, competition: 45, difficulty: 50, cpc: 1.40, intent: 'informational', trend: 'rising' },
      { keyword: `top ${seedKeyword}`, searchVolume: 7200, competition: 68, difficulty: 72, cpc: 2.80, intent: 'commercial', trend: 'stable' },
      { keyword: `${seedKeyword} online`, searchVolume: 11000, competition: 75, difficulty: 78, cpc: 3.50, intent: 'transactional', trend: 'rising' },
      { keyword: `free ${seedKeyword}`, searchVolume: 8900, competition: 62, difficulty: 65, cpc: 1.20, intent: 'transactional', trend: 'stable' },
      { keyword: `${seedKeyword} tutorial`, searchVolume: 3800, competition: 42, difficulty: 48, cpc: 1.30, intent: 'informational', trend: 'stable' },
      { keyword: `${seedKeyword} examples`, searchVolume: 4600, competition: 50, difficulty: 55, cpc: 1.70, intent: 'informational', trend: 'stable' },
      { keyword: `what is ${seedKeyword}`, searchVolume: 7500, competition: 40, difficulty: 45, cpc: 1.10, intent: 'informational', trend: 'stable' },
      { keyword: `${seedKeyword} software`, searchVolume: 6800, competition: 78, difficulty: 82, cpc: 4.20, intent: 'commercial', trend: 'rising' },
      { keyword: `${seedKeyword} tools`, searchVolume: 5900, competition: 70, difficulty: 74, cpc: 3.10, intent: 'commercial', trend: 'stable' },
      { keyword: `${seedKeyword} service`, searchVolume: 8100, competition: 80, difficulty: 84, cpc: 5.50, intent: 'transactional', trend: 'rising' },
      { keyword: `cheap ${seedKeyword}`, searchVolume: 4200, competition: 65, difficulty: 68, cpc: 2.30, intent: 'transactional', trend: 'stable' },
      { keyword: `${seedKeyword} vs`, searchVolume: 3500, competition: 58, difficulty: 62, cpc: 2.10, intent: 'commercial', trend: 'stable' },
      { keyword: `${seedKeyword} alternatives`, searchVolume: 4100, competition: 60, difficulty: 64, cpc: 2.40, intent: 'commercial', trend: 'stable' },
      { keyword: `${seedKeyword} cost`, searchVolume: 5600, competition: 55, difficulty: 60, cpc: 2.00, intent: 'commercial', trend: 'stable' },
      { keyword: `${seedKeyword} pricing`, searchVolume: 4800, competition: 58, difficulty: 62, cpc: 2.20, intent: 'commercial', trend: 'stable' },
      { keyword: `learn ${seedKeyword}`, searchVolume: 6300, competition: 47, difficulty: 52, cpc: 1.50, intent: 'informational', trend: 'rising' },
      { keyword: `${seedKeyword} course`, searchVolume: 5400, competition: 62, difficulty: 66, cpc: 3.80, intent: 'commercial', trend: 'stable' },
      { keyword: `${seedKeyword} training`, searchVolume: 4900, competition: 60, difficulty: 64, cpc: 3.50, intent: 'commercial', trend: 'stable' },
      { keyword: `why ${seedKeyword}`, searchVolume: 3200, competition: 38, difficulty: 42, cpc: 1.00, intent: 'informational', trend: 'stable' },
      { keyword: `${seedKeyword} benefits`, searchVolume: 3900, competition: 45, difficulty: 50, cpc: 1.40, intent: 'informational', trend: 'stable' },
      { keyword: `${seedKeyword} strategies`, searchVolume: 3600, competition: 52, difficulty: 56, cpc: 1.80, intent: 'informational', trend: 'stable' },
      { keyword: `${seedKeyword} techniques`, searchVolume: 3300, competition: 50, difficulty: 54, cpc: 1.70, intent: 'informational', trend: 'stable' },
      { keyword: `${seedKeyword} checklist`, searchVolume: 2800, competition: 42, difficulty: 46, cpc: 1.20, intent: 'informational', trend: 'stable' },
      { keyword: `${seedKeyword} mistakes`, searchVolume: 2500, competition: 40, difficulty: 44, cpc: 1.10, intent: 'informational', trend: 'stable' },
      { keyword: `${seedKeyword} best practices`, searchVolume: 3100, competition: 48, difficulty: 52, cpc: 1.60, intent: 'informational', trend: 'stable' },
      { keyword: `advanced ${seedKeyword}`, searchVolume: 2700, competition: 55, difficulty: 60, cpc: 2.00, intent: 'informational', trend: 'stable' },
      { keyword: `${seedKeyword} automation`, searchVolume: 3400, competition: 58, difficulty: 62, cpc: 2.40, intent: 'commercial', trend: 'rising' },
      { keyword: `${seedKeyword} agency`, searchVolume: 4500, competition: 72, difficulty: 76, cpc: 4.80, intent: 'commercial', trend: 'stable' },
      { keyword: `${seedKeyword} consultant`, searchVolume: 3700, competition: 68, difficulty: 72, cpc: 4.20, intent: 'commercial', trend: 'stable' },
      { keyword: `${seedKeyword} expert`, searchVolume: 3200, competition: 65, difficulty: 69, cpc: 3.90, intent: 'commercial', trend: 'stable' },
      { keyword: `hire ${seedKeyword}`, searchVolume: 2900, competition: 70, difficulty: 74, cpc: 5.10, intent: 'transactional', trend: 'stable' },
      { keyword: `${seedKeyword} company`, searchVolume: 5100, competition: 75, difficulty: 78, cpc: 4.50, intent: 'commercial', trend: 'stable' },
      { keyword: `${seedKeyword} platform`, searchVolume: 4300, competition: 72, difficulty: 76, cpc: 3.80, intent: 'commercial', trend: 'rising' },
      { keyword: `${seedKeyword} solution`, searchVolume: 3800, competition: 68, difficulty: 72, cpc: 3.60, intent: 'commercial', trend: 'stable' },
      { keyword: `${seedKeyword} app`, searchVolume: 6700, competition: 70, difficulty: 74, cpc: 3.20, intent: 'commercial', trend: 'rising' },
      { keyword: `${seedKeyword} website`, searchVolume: 5200, competition: 65, difficulty: 69, cpc: 2.80, intent: 'informational', trend: 'stable' },
      { keyword: `${seedKeyword} templates`, searchVolume: 4100, competition: 60, difficulty: 64, cpc: 2.20, intent: 'commercial', trend: 'stable' },
      { keyword: `${seedKeyword} ideas`, searchVolume: 4700, competition: 48, difficulty: 52, cpc: 1.40, intent: 'informational', trend: 'stable' },
      { keyword: `${seedKeyword} examples 2024`, searchVolume: 2600, competition: 52, difficulty: 56, cpc: 1.60, intent: 'informational', trend: 'rising' },
      { keyword: `${seedKeyword} trends`, searchVolume: 3500, competition: 50, difficulty: 54, cpc: 1.80, intent: 'informational', trend: 'rising' },
      { keyword: `${seedKeyword} statistics`, searchVolume: 2800, competition: 45, difficulty: 50, cpc: 1.30, intent: 'informational', trend: 'stable' },
      { keyword: `${seedKeyword} report`, searchVolume: 3100, competition: 55, difficulty: 60, cpc: 2.10, intent: 'informational', trend: 'stable' },
      { keyword: `${seedKeyword} case study`, searchVolume: 2400, competition: 48, difficulty: 52, cpc: 1.70, intent: 'informational', trend: 'stable' },
      { keyword: `${seedKeyword} success stories`, searchVolume: 2100, competition: 42, difficulty: 46, cpc: 1.40, intent: 'informational', trend: 'stable' },
      { keyword: `${seedKeyword} ROI`, searchVolume: 2900, competition: 58, difficulty: 62, cpc: 2.40, intent: 'commercial', trend: 'stable' },
    ];

    return {
      seedKeyword,
      keywords: mockKeywords.slice(0, count),
      totalResults: mockKeywords.length,
    };
  }

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
