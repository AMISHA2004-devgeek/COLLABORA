"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Agent configurations with their specialized prompts
const AGENT_CONFIGS = {
  "creative-director": {
    name: "Creative Director AI",
    systemPrompt: `You are a Creative Director AI. Analyze the content and suggest creative improvements.
    
Your role:
- Enhance storytelling and narrative flow
- Improve headlines and hooks
- Suggest more engaging language
- Optimize emotional impact
- Enhance visual descriptions

For each suggestion, provide:
1. The specific line number or text to change
2. Your proposed improved version
3. Clear reasoning why your change is better

Be specific and actionable. Focus on creativity and engagement.`,
  },
  
  "content-strategist": {
    name: "Media Content Strategist",
    systemPrompt: `You are a Media Content Strategist. Analyze content for strategic improvements.
    
Your role:
- Optimize content structure and flow
- Improve SEO and discoverability
- Enhance calls-to-action
- Suggest better formatting
- Improve readability and clarity

For each suggestion, provide:
1. The specific line or section to change
2. Your strategic improvement
3. Clear reasoning backed by content strategy principles

Be data-driven and strategic.`,
  },
  
  "research-ai": {
    name: "Research & Fact-Check AI",
    systemPrompt: `You are a Research & Fact-Check AI. Verify accuracy and suggest evidence-based improvements.
    
Your role:
- Fact-check claims and statistics
- Suggest adding credible sources
- Identify unsupported statements
- Recommend more accurate phrasing
- Flag outdated information

For each suggestion, provide:
1. The specific claim or statement
2. Your fact-checked or sourced version
3. Clear reasoning with evidence or sources

Be rigorous and evidence-based.`,
  },
  
  "audience-analyst": {
    name: "Audience Insights Analyst",
    systemPrompt: `You are an Audience Insights Analyst. Optimize content for target audience.
    
Your role:
- Analyze tone and voice for audience fit
- Suggest language that resonates with target demographic
- Identify confusing or alienating phrases
- Optimize for audience comprehension level
- Enhance relatability and connection

For each suggestion, provide:
1. The specific text that needs audience optimization
2. Your audience-optimized version
3. Clear reasoning about audience psychology

Be audience-focused and empathetic.`,
  },
};

interface AgentSuggestion {
  lineNumber: number;
  originalText: string;
  proposedText: string;
  reason: string;
  agentType: string;
  agentName: string;
}

export async function getAgentSuggestions(
  notebookId: string,
  agentType: "creative-director" | "content-strategist" | "research-ai" | "audience-analyst",
  specificRequest?: string // Optional: "focus on the introduction" or "analyze line 5-10"
): Promise<AgentSuggestion[]> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Not authenticated");

    // Get the notebook content
    const notebook = await prisma.notebook.findUnique({
      where: { id: notebookId },
      select: { content: true, title: true },
    });

    if (!notebook) throw new Error("Notebook not found");

    const agentConfig = AGENT_CONFIGS[agentType];
    
    // Split content into lines for line-by-line analysis
    const lines = notebook.content.split('\n');
    
    // Build the prompt for Groq
    const userPrompt = `
${specificRequest ? `SPECIFIC REQUEST: ${specificRequest}\n\n` : ''}

CONTENT TO ANALYZE:
Title: ${notebook.title}

${lines.map((line, idx) => `Line ${idx + 1}: ${line}`).join('\n')}

---

Analyze this content and provide your suggestions in the following JSON format ONLY:

{
  "suggestions": [
    {
      "lineNumber": 1,
      "originalText": "exact text from the line",
      "proposedText": "your improved version",
      "reason": "why this change improves the content"
    }
  ]
}

Provide 3-8 specific, actionable suggestions. Focus on the most impactful changes.
Return ONLY valid JSON, no other text.`;

    console.log("🤖 Requesting AI suggestions from:", agentConfig.name);

    // Call Groq API
    const completion = await groq.chat.completions.create({
      model: "mixtral-8x7b-32768", // or "llama2-70b-4096"
      messages: [
        {
          role: "system",
          content: agentConfig.systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    console.log("✅ AI Response received");

    // Parse the JSON response
    let parsedResponse;
    try {
      // Try to extract JSON if wrapped in markdown code blocks
      const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/);
      const jsonText = jsonMatch ? jsonMatch[1] : aiResponse;
      parsedResponse = JSON.parse(jsonText.trim());
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResponse);
      throw new Error("AI returned invalid format");
    }

    // Transform to our format
    const suggestions: AgentSuggestion[] = parsedResponse.suggestions.map((s: any) => ({
      lineNumber: s.lineNumber,
      originalText: s.originalText,
      proposedText: s.proposedText,
      reason: s.reason,
      agentType,
      agentName: agentConfig.name,
    }));

    console.log(`✅ Generated ${suggestions.length} suggestions`);

    return suggestions;
  } catch (error: any) {
    console.error("❌ Error getting agent suggestions:", error);
    throw error;
  }
}

export async function saveAgentSuggestions(
  notebookId: string,
  suggestions: AgentSuggestion[]
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Not authenticated");

    // Save each suggestion as a ProposedChange
    const savedChanges = await Promise.all(
      suggestions.map((suggestion) =>
        prisma.proposedChange.create({
          data: {
            notebookId,
            proposerId: userId,
            lineNumber: suggestion.lineNumber,
            originalText: suggestion.originalText,
            proposedText: suggestion.proposedText,
            reason: `[${suggestion.agentName}] ${suggestion.reason}`,
            status: "pending",
          },
        })
      )
    );

    // Notify the notebook owner
    const notebook = await prisma.notebook.findUnique({
      where: { id: notebookId },
      select: { userId: true, title: true },
    });

    if (notebook && notebook.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: notebook.userId,
          type: "agent_suggestions",
          title: "AI Agent Suggestions",
          message: `${suggestions[0].agentName} has ${suggestions.length} suggestions for: ${notebook.title}`,
          link: `/dashboard/${notebookId}/review`,
        },
      });
    }

    console.log(`✅ Saved ${savedChanges.length} agent suggestions`);

    return { success: true, count: savedChanges.length };
  } catch (error: any) {
    console.error("❌ Error saving suggestions:", error);
    throw error;
  }
}