"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bot, Loader2, Play } from "lucide-react";
import { SummaryHighlighter } from "./summary-highlighter";
import { AgentSuggestionCells } from "./agent-suggestion-cells";
import { AgentChatMessage } from "./agent-chat-message";
import { AddAgentDialog } from "./add-agent-dialog";
import { Highlight } from "@/lib/agent-processor";

interface Agent {
  id: string;
  name: string;
  icon: string;
  role: string;
  agentType: string;
  status: "active" | "analyzing" | "idle";
}

const AGENT_CONFIGS: Record<string, Agent> = {
  "content-strategist": {
    id: "content-strategist",
    name: "Media Content Strategist",
    icon: "📰",
    role: "editor",
    agentType: "Content Strategy",
    status: "idle",
  },
  "research-agent": {
    id: "research-agent",
    name: "Research & Fact-Check AI",
    icon: "🔍",
    role: "reviewer",
    agentType: "Research & Verification",
    status: "idle",
  },
  "creative-director": {
    id: "creative-director",
    name: "Creative Director AI",
    icon: "🎨",
    role: "editor",
    agentType: "Creative Direction",
    status: "idle",
  },
  "audience-analytics": {
    id: "audience-analytics",
    name: "Audience Insights Analyst",
    icon: "📊",
    role: "analyst",
    agentType: "Analytics & SEO",
    status: "idle",
  },
};

export function AgentsWorkspace({
  notebookId,
  summaryText,
  activeAgentIds,
  onRefresh,
}: {
  notebookId: string;
  summaryText: string;
  activeAgentIds: string[];
  onRefresh: () => void;
}) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [highlights, setHighlights] = useState<Record<string, Highlight[]>>({});
  const [selectedLine, setSelectedLine] = useState<{
    lineNumber: number;
    text: string;
  } | null>(null);
  const [analyzing, setAnalyzing] = useState<string | null>(null);

  const activeAgents = activeAgentIds
    .map((id) => AGENT_CONFIGS[id])
    .filter(Boolean);

  useEffect(() => {
    if (activeAgents.length > 0 && !selectedAgent) {
      setSelectedAgent(activeAgents[0].id);
    }
  }, [activeAgents]);

  const handleAnalyze = async (agentId: string) => {
    if (!summaryText.trim()) {
      alert("No summary to analyze");
      return;
    }

    setAnalyzing(agentId);

    try {
      const res = await fetch("/api/agent/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notebookId,
          agentId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Store highlights for this agent
        setHighlights((prev) => ({
          ...prev,
          [agentId]: data.highlights,
        }));

        alert(
          `Analysis complete!\n${data.highlights.length} issues found\n${data.suggestions.length} suggestions created`
        );
      } else {
        alert(data.error || "Analysis failed");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      alert("Error analyzing summary");
    } finally {
      setAnalyzing(null);
    }
  };

  const handleLineSelect = (lineNumber: number, text: string) => {
    setSelectedLine({ lineNumber, text });
  };

  const handleRemoveAgent = async (agentId: string) => {
    const agent = AGENT_CONFIGS[agentId];
    if (!confirm(`Remove ${agent.name} from this notebook?`)) return;

    try {
      const res = await fetch("/api/agent/leave", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notebookId,
          agentId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        onRefresh();
      }
    } catch (error) {
      console.error("Remove agent error:", error);
    }
  };

  if (activeAgents.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Bot className="h-20 w-20 mx-auto mb-4 text-gray-300" />
        <h3 className="text-xl font-semibold mb-2">No AI Agents Added</h3>
        <p className="text-gray-600 mb-6">
          Add AI agents to analyze and improve your summary
        </p>
        <AddAgentDialog
          notebookId={notebookId}
          existingAgents={activeAgentIds}
          onSuccess={onRefresh}
        />
      </Card>
    );
  }

  const currentAgent = selectedAgent
    ? AGENT_CONFIGS[selectedAgent]
    : activeAgents[0];
  const currentHighlights = selectedAgent ? highlights[selectedAgent] || [] : [];

  return (
    <div className="space-y-4">
      {/* Agent Tabs */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">AI Agent Workspace</h2>
          {activeAgents.length < 4 && (
            <AddAgentDialog
              notebookId={notebookId}
              existingAgents={activeAgentIds}
              onSuccess={onRefresh}
            />
          )}
        </div>

        <Tabs
          value={selectedAgent || activeAgents[0].id}
          onValueChange={setSelectedAgent}
        >
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            {activeAgents.map((agent) => (
              <TabsTrigger key={agent.id} value={agent.id}>
                <span className="mr-2">{agent.icon}</span>
                <span className="hidden sm:inline">{agent.name.split(" ")[0]}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          {activeAgents.map((agent) => (
            <TabsContent key={agent.id} value={agent.id} className="mt-4">
              <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{agent.icon}</span>
                    <div>
                      <h3 className="font-semibold">{agent.name}</h3>
                      <p className="text-xs text-gray-600">{agent.agentType}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleAnalyze(agent.id)}
                      disabled={analyzing === agent.id}
                      size="sm"
                    >
                      {analyzing === agent.id ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Analyze Summary
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleRemoveAgent(agent.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </Card>

      {/* Split View: Summary + Suggestion Cells */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left: Highlighted Summary */}
        <div>
          <SummaryHighlighter
            summaryText={summaryText}
            highlights={currentHighlights}
            onLineSelect={handleLineSelect}
          />
        </div>

        {/* Right: Jupyter-style Cells */}
        <div>
          <AgentSuggestionCells
            notebookId={notebookId}
            agentName={currentAgent.name}
            selectedLine={selectedLine}
            onSubmitSuccess={onRefresh}
          />
        </div>
      </div>

      {/* Selected Line Info */}
      {selectedLine && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <p className="text-sm">
            <strong>Selected:</strong> Line {selectedLine.lineNumber + 1}
          </p>
          <p className="text-sm text-gray-700 mt-1 font-mono">
            {selectedLine.text}
          </p>
        </Card>
      )}
    </div>
  );
}