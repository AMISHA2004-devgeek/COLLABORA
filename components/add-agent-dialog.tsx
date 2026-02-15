"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const AVAILABLE_AGENTS = [
  {
    id: "content-strategist",
    name: "Media Content Strategist",
    role: "editor",
    agentType: "Content Strategy",
    description:
      "Analyzes grammar, spelling, headlines, hooks, and engagement. Perfect for improving readability and impact.",
    icon: "📰",
    useCases: ["YouTube scripts", "Blog posts", "Pitch decks", "Brand campaigns"],
    capabilities: [
      "Grammar checking",
      "Spelling correction",
      "Headline optimization",
      "Engagement analysis",
    ],
  },
  {
    id: "research-agent",
    name: "Research & Fact-Check AI",
    role: "reviewer",
    agentType: "Research & Verification",
    description:
      "Verifies claims, flags statistics, suggests sources. Essential for credible content.",
    icon: "🔍",
    useCases: [
      "News articles",
      "Research papers",
      "Documentary scripts",
      "Reports",
    ],
    capabilities: [
      "Fact verification",
      "Source suggestions",
      "Claim detection",
      "Credibility checks",
    ],
  },
  {
    id: "creative-director",
    name: "Creative Director AI",
    role: "editor",
    agentType: "Creative Direction",
    description:
      "Enhances visual storytelling, emotional impact, and creative language.",
    icon: "🎨",
    useCases: ["Ad campaigns", "Short films", "OTT pitches", "Fashion content"],
    capabilities: [
      "Visual language",
      "Emotional impact",
      "Cinematic tone",
      "Style consistency",
    ],
  },
  {
    id: "audience-analytics",
    name: "Audience Insights Analyst",
    role: "analyst",
    agentType: "Analytics & SEO",
    description:
      "Optimizes for SEO, keywords, and platform-specific engagement.",
    icon: "📊",
    useCases: ["YouTube", "Instagram", "LinkedIn", "Digital news"],
    capabilities: [
      "SEO optimization",
      "Keyword suggestions",
      "Platform targeting",
      "Engagement metrics",
    ],
  },
];

export function AddAgentDialog({
  notebookId,
  existingAgents,
  onSuccess,
}: {
  notebookId: string;
  existingAgents: string[];
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

  const availableAgents = AVAILABLE_AGENTS.filter(
    (agent) => !existingAgents.includes(agent.id)
  );

  const handleAddAgent = async (agent: typeof AVAILABLE_AGENTS[0]) => {
    setAdding(agent.id);

    try {
      const res = await fetch("/api/agent/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notebookId,
          agentId: agent.id,
          agentName: agent.name,
          agentType: agent.agentType,
          role: agent.role,
        }),
      });

      const data = await res.json();

      if (data.success) {
        onSuccess();
        if (availableAgents.length === 1) {
          setOpen(false);
        }
      } else {
        alert(data.error || "Failed to add agent");
      }
    } catch (error) {
      console.error("Add agent error:", error);
      alert("Error adding agent");
    } finally {
      setAdding(null);
    }
  };

  if (availableAgents.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Bot className="h-4 w-4 mr-2" />
          Add AI Agent
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add AI Agent Collaborator</DialogTitle>
          <DialogDescription>
            Choose an AI agent to help analyze and improve your summary
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 mt-4">
          {availableAgents.map((agent) => (
            <Card
              key={agent.id}
              className="p-4 hover:border-purple-400 transition-all cursor-pointer"
              onClick={() => !adding && handleAddAgent(agent)}
            >
              <div className="flex gap-4">
                {/* Icon */}
                <div className="text-5xl flex-shrink-0">{agent.icon}</div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        {agent.name}
                        <Badge variant="outline">{agent.role}</Badge>
                      </h3>
                      <p className="text-xs text-purple-600 font-medium">
                        {agent.agentType}
                      </p>
                    </div>

                    <Button
                      size="sm"
                      disabled={adding === agent.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddAgent(agent);
                      }}
                    >
                      {adding === agent.id ? (
                        "Adding..."
                      ) : (
                        <>
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </>
                      )}
                    </Button>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">
                    {agent.description}
                  </p>

                  {/* Capabilities */}
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      Capabilities:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.map((cap) => (
                        <Badge
                          key={cap}
                          variant="secondary"
                          className="text-xs"
                        >
                          {cap}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Use Cases */}
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-1">
                      Best for:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {agent.useCases.map((useCase) => (
                        <span
                          key={useCase}
                          className="text-xs bg-gray-100 px-2 py-1 rounded"
                        >
                          {useCase}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}