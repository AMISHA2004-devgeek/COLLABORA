"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NotebookEditor from "./NotebookEditor";
import { AgentsWorkspace } from "@/components/agents-workspace";
import { AgentChatMessage } from "@/components/agent-chat-message";
import { LiveChat } from "@/components/live-chat"; // ✅ NEW
import { useRouter } from "next/navigation";
import { FileEdit, Users, MessageSquare, Bot } from "lucide-react";

const AGENT_ICONS: Record<string, string> = {
  "Media Content Strategist": "📰",
  "Research & Fact-Check AI": "🔍",
  "Creative Director AI": "🎨",
  "Audience Insights Analyst": "📊",
};

export default function NotebookPageClient({
  notebook,
  activeAgents,
  isOwner,
  isOrgMember,
}: {
  notebook: any;
  activeAgents: string[];
  isOwner: boolean;
  isOrgMember: boolean;
}) {
  const router = useRouter();

  const handleRefresh = () => {
    router.refresh();
  };

  const handleGoToReview = () => {
    router.push(`/dashboard/${notebook.id}/review`);
  };

  const handleGoToFinalEdit = () => {
    router.push(`/dashboard/${notebook.id}/final-edit`);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">
                  {notebook.title || "Untitled Notebook"}
                </CardTitle>
                {isOrgMember && !isOwner && (
                  <p className="text-sm text-blue-600 mt-1">
                    🏢 Workspace Notebook
                  </p>
                )}
              </div>
              {isOwner && (
                <div className="flex gap-2">
                  <Button onClick={handleGoToReview} variant="outline">
                    <FileEdit className="h-4 w-4 mr-2" />
                    Review Suggestions
                  </Button>
                  <Button onClick={handleGoToFinalEdit}>
                    <FileEdit className="h-4 w-4 mr-2" />
                    Final Editor
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="summary" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">
              <FileEdit className="h-4 w-4 mr-2" />
              Summary
            </TabsTrigger>
            <TabsTrigger value="workspace">
              <Bot className="h-4 w-4 mr-2" />
              AI Workspace
              {activeAgents.length > 0 && (
                <Badge className="ml-2" variant="secondary">
                  {activeAgents.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="collaborators">
              <Users className="h-4 w-4 mr-2" />
              Collaborators
            </TabsTrigger>
            <TabsTrigger value="chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              Live Chat
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Summary */}
          <TabsContent value="summary" className="mt-6">
            <Card>
              <CardContent className="pt-6">
                <NotebookEditor notebook={notebook} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 2: AI Workspace */}
          <TabsContent value="workspace" className="mt-6">
            <AgentsWorkspace
              notebookId={notebook.id}
              summaryText={notebook.summaryText || ""}
              activeAgentIds={activeAgents}
              onRefresh={handleRefresh}
            />
          </TabsContent>

          {/* Tab 3: Collaborators */}
          <TabsContent value="collaborators" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Collaborators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {notebook.collaborators
                    .filter((c: any) => c.type === "human")
                    .map((collab: any) => (
                      <div
                        key={collab.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded"
                      >
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-blue-600 font-semibold">
                            {(collab.user?.email || collab.email || "?")[0].toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">
                            {collab.user?.name || collab.user?.email || collab.email}
                          </p>
                          <p className="text-xs text-gray-600">{collab.role}</p>
                        </div>
                        {collab.role === "owner" && (
                          <Badge className="ml-auto">Owner</Badge>
                        )}
                      </div>
                    ))}

                  {notebook.collaborators.filter((c: any) => c.type === "agent" && c.status === "active")
                    .length > 0 && (
                    <>
                      <h3 className="font-semibold mt-6 mb-3 flex items-center gap-2">
                        <Bot className="h-5 w-5" />
                        AI Agents
                      </h3>
                      {notebook.collaborators
                        .filter((c: any) => c.type === "agent" && c.status === "active")
                        .map((agent: any) => (
                          <div
                            key={agent.id}
                            className="flex items-center gap-3 p-3 bg-purple-50 rounded border border-purple-200"
                          >
                            <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-2xl">
                              {AGENT_ICONS[agent.agentName || ""] || "🤖"}
                            </div>
                            <div>
                              <p className="font-medium">{agent.agentName}</p>
                              <p className="text-xs text-gray-600">
                                {agent.agentType}
                              </p>
                            </div>
                            <Badge className="ml-auto" variant="outline">
                              {agent.role}
                            </Badge>
                          </div>
                        ))}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Live Chat - ✅ NEW */}
          <TabsContent value="chat" className="mt-6">
            <LiveChat
              notebookId={notebook.id}
              initialMessages={notebook.chatMessages}
              isOrgMember={isOrgMember}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}