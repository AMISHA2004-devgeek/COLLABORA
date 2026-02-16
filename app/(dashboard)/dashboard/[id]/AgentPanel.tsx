"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Sparkles, Search, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getAgentSuggestions, saveAgentSuggestions } from "./agent-ai-suggestions";

interface AgentPanelProps {
  notebookId: string;
}

const AGENTS = [
  {
    id: "creative-director",
    name: "Creative Director AI",
    icon: Sparkles,
    description: "Enhance storytelling, improve hooks, optimize emotional impact",
    color: "bg-purple-100 text-purple-700 border-purple-200",
  },
  {
    id: "content-strategist",
    name: "Media Content Strategist",
    icon: Search,
    description: "Optimize structure, improve SEO, enhance readability",
    color: "bg-blue-100 text-blue-700 border-blue-200",
  },
  {
    id: "research-ai",
    name: "Research & Fact-Check AI",
    icon: Search,
    description: "Verify facts, add sources, ensure accuracy",
    color: "bg-green-100 text-green-700 border-green-200",
  },
  {
    id: "audience-analyst",
    name: "Audience Insights Analyst",
    icon: Users,
    description: "Optimize for target audience, improve tone and voice",
    color: "bg-orange-100 text-orange-700 border-orange-200",
  },
];

export default function AgentPanel({ notebookId }: AgentPanelProps) {
  const router = useRouter();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [specificRequest, setSpecificRequest] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  async function handleRunAgent() {
    if (!selectedAgent) {
      toast.error("Please select an agent");
      return;
    }

    setLoading(true);
    setShowResults(false);
    setSuggestions([]);

    try {
      toast.loading("AI is analyzing your content...", { id: "agent-loading" });

      const results = await getAgentSuggestions(
        notebookId,
        selectedAgent as any,
        specificRequest || undefined
      );

      setSuggestions(results);
      setShowResults(true);
      
      toast.success(`Found ${results.length} suggestions!`, { id: "agent-loading" });
    } catch (error: any) {
      console.error("Agent error:", error);
      toast.error(error.message || "Failed to get suggestions", { id: "agent-loading" });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSuggestions(selectedSuggestions: any[]) {
    if (selectedSuggestions.length === 0) {
      toast.error("No suggestions selected");
      return;
    }

    try {
      toast.loading("Saving suggestions...", { id: "save-suggestions" });

      await saveAgentSuggestions(notebookId, selectedSuggestions);

      toast.success(`Saved ${selectedSuggestions.length} suggestions for review!`, {
        id: "save-suggestions",
      });

      setShowResults(false);
      setSuggestions([]);
      setSelectedAgent(null);
      setSpecificRequest("");
      
      router.refresh();
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error("Failed to save suggestions", { id: "save-suggestions" });
    }
  }

  return (
    <div className="space-y-6">
      {/* Agent Selection */}
      {!showResults && (
        <>
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Agent Analysis
            </h3>

            <p className="text-sm text-gray-600 mb-4">
              Select an AI agent to analyze your content and suggest improvements
            </p>

            <div className="grid gap-3">
              {AGENTS.map((agent) => {
                const Icon = agent.icon;
                const isSelected = selectedAgent === agent.id;

                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.id)}
                    className={`
                      p-4 rounded-lg border-2 text-left transition-all
                      ${isSelected 
                        ? `${agent.color} border-current` 
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${isSelected ? '' : 'text-gray-400'}`} />
                      <div className="flex-1">
                        <div className="font-medium">{agent.name}</div>
                        <div className={`text-sm ${isSelected ? 'opacity-80' : 'text-gray-600'}`}>
                          {agent.description}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="flex-shrink-0">
                          <div className="w-5 h-5 rounded-full bg-current flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Optional specific request */}
            {selectedAgent && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specific Request (Optional)
                </label>
                <input
                  type="text"
                  value={specificRequest}
                  onChange={(e) => setSpecificRequest(e.target.value)}
                  placeholder="e.g., 'Focus on the introduction' or 'Analyze lines 10-20'"
                  className="w-full border rounded-lg p-2 text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Guide the AI to focus on specific sections or aspects
                </p>
              </div>
            )}

            <button
              onClick={handleRunAgent}
              disabled={!selectedAgent || loading}
              className="mt-4 w-full bg-black text-white py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4" />
                  Run AI Analysis
                </>
              )}
            </button>
          </div>
        </>
      )}

      {/* Suggestions Results */}
      {showResults && suggestions.length > 0 && (
        <SuggestionsReview
          suggestions={suggestions}
          agentName={AGENTS.find((a) => a.id === selectedAgent)?.name || "AI Agent"}
          onSave={handleSaveSuggestions}
          onCancel={() => {
            setShowResults(false);
            setSuggestions([]);
          }}
        />
      )}
    </div>
  );
}

// Suggestions Review Component
function SuggestionsReview({
  suggestions,
  agentName,
  onSave,
  onCancel,
}: {
  suggestions: any[];
  agentName: string;
  onSave: (selected: any[]) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState<Set<number>>(
    new Set(suggestions.map((_, idx) => idx))
  );

  function toggleSelection(idx: number) {
    const newSelected = new Set(selected);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      newSelected.add(idx);
    }
    setSelected(newSelected);
  }

  function handleSave() {
    const selectedSuggestions = suggestions.filter((_, idx) => selected.has(idx));
    onSave(selectedSuggestions);
  }

  return (
    <div className="bg-white p-6 rounded-lg border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg">
          {agentName} Suggestions ({suggestions.length})
        </h3>
        <div className="text-sm text-gray-600">
          {selected.size} selected
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-4">
        Review the AI suggestions below. Select which ones to save for your review.
      </p>

      <div className="space-y-4 max-h-[600px] overflow-y-auto mb-4">
        {suggestions.map((suggestion, idx) => (
          <div
            key={idx}
            className={`
              p-4 rounded-lg border-2 cursor-pointer transition-all
              ${selected.has(idx) 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
              }
            `}
            onClick={() => toggleSelection(idx)}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selected.has(idx)}
                onChange={() => toggleSelection(idx)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-medium text-gray-500">
                    Line {suggestion.lineNumber}
                  </span>
                </div>

                <div className="space-y-2">
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Original:</div>
                    <div className="text-sm text-gray-700 bg-red-50 p-2 rounded">
                      {suggestion.originalText}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Proposed:</div>
                    <div className="text-sm text-gray-900 bg-green-50 p-2 rounded font-medium">
                      {suggestion.proposedText}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">Reason:</div>
                    <div className="text-sm text-gray-600 italic">
                      {suggestion.reason}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={selected.size === 0}
          className="flex-1 bg-black text-white py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save {selected.size} Suggestion{selected.size !== 1 ? 's' : ''}
        </button>
      </div>
    </div>
  );
}