import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export interface Highlight {
  lineNumber: number;
  type: "grammar" | "spelling" | "improvement";
  originalText: string;
  issue: string;
  severity: number; // 0-1
}

export interface Suggestion {
  lineNumber: number;
  originalText: string;
  proposedText: string;
  reason: string;
  type: "grammar" | "spelling" | "improvement";
}

export interface AgentAnalysis {
  agentName: string;
  highlights: Highlight[];
  suggestions: Suggestion[];
}

const AGENT_CONFIGS = {
  "content-strategist": {
    name: "Media Content Strategist",
    systemPrompt: `You are a Media Content Strategist AI. Analyze text for:

**GRAMMAR ISSUES** (type: "grammar"):
- Subject-verb disagreement
- Tense inconsistencies  
- Missing/incorrect punctuation
- Run-on sentences

**SPELLING ERRORS** (type: "spelling"):
- Misspelled words
- Typos
- Wrong word usage

**ENGAGEMENT IMPROVEMENTS** (type: "improvement"):
- Weak headlines
- Unclear hooks
- Poor storytelling flow
- Better word choices for impact

Return ONLY this JSON format (no other text):
{
  "highlights": [
    {
      "lineNumber": 0,
      "type": "grammar",
      "originalText": "exact line text",
      "issue": "what's wrong",
      "severity": 0.8
    }
  ],
  "suggestions": [
    {
      "lineNumber": 0,
      "originalText": "exact line text",
      "proposedText": "improved version",
      "reason": "why it's better",
      "type": "grammar"
    }
  ]
}`,
  },
  "research-agent": {
    name: "Research & Fact-Check AI",
    systemPrompt: `You are a Research & Fact-Check AI. Analyze text for:

**IMPROVEMENTS ONLY** (type: "improvement"):
- Unverified claims needing sources
- Missing citations
- Statistics without context
- Statements that need fact-checking
- Areas needing more credibility

Focus on accuracy, sources, and credibility. Return JSON format.`,
  },
  "creative-director": {
    name: "Creative Director AI",
    systemPrompt: `You are a Creative Director AI. Analyze text for:

**IMPROVEMENTS ONLY** (type: "improvement"):
- Weak visual descriptions
- Missing emotional impact
- Bland or generic phrasing
- Lack of sensory details
- Tone inconsistencies
- Better cinematic language

Focus on creativity and impact. Return JSON format.`,
  },
  "audience-analytics": {
    name: "Audience Insights Analyst",
    systemPrompt: `You are an Audience Analytics AI. Analyze text for:

**IMPROVEMENTS ONLY** (type: "improvement"):
- Missing SEO keywords
- Weak calls-to-action
- Poor platform optimization
- Low engagement potential
- Readability issues
- Audience targeting problems

Focus on optimization and engagement. Return JSON format.`,
  },
};

export async function analyzeWithAgent(
  agentId: keyof typeof AGENT_CONFIGS,
  summaryText: string
): Promise<AgentAnalysis> {
  const config = AGENT_CONFIGS[agentId];
  const lines = summaryText.split("\n").filter((l) => l.trim());

  const textWithLineNumbers = lines
    .map((line, i) => `Line ${i}: ${line}`)
    .join("\n");

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: config.systemPrompt,
        },
        {
          role: "user",
          content: `Analyze this text:\n\n${textWithLineNumbers}\n\nReturn ONLY JSON, no other text.`,
        },
      ],
      model: "llama-3.1-70b-versatile",
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content || "{}";
    let analysis = JSON.parse(content);

    // Ensure we have the right structure
    if (!analysis.highlights) analysis.highlights = [];
    if (!analysis.suggestions) analysis.suggestions = [];

    return {
      agentName: config.name,
      highlights: analysis.highlights,
      suggestions: analysis.suggestions,
    };
  } catch (error) {
    console.error("Agent analysis error:", error);
    return {
      agentName: config.name,
      highlights: [],
      suggestions: [],
    };
  }
}