"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NotebookEditor from "./NotebookEditor";
import { AgentsWorkspace } from "@/components/agents-workspace";
import { AgentChatMessage } from "@/components/agent-chat-message";
import { useRouter } from "next/navigation";
import { FileEdit, Users, MessageSquare, Bot } from "lucide-react";

const AGENT_ICONS: Record<string, string> = {
  "Media Content Strategist": "📰",
  "Research & Fact-Check AI": "🔍",
  "Creative Director AI": "🎨",
  "Audience Insights Analyst": "📊",
};

export  default function NotebookPageClient({
  notebook,
  activeAgents,
  isOwner,
  isOrgMember, // ✅ Changed from isCollaborator
}: {
  notebook: any;
  activeAgents: string[];
  isOwner: boolean;
  isOrgMember: boolean; // ✅ Changed type
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
              {/* ✅ ADD THIS: Action Buttons for Owner */}
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

        {/* ✅ CHANGED: 4 tabs instead of 3 */}
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
              Chat History
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Summary Editor */}
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
                  {/* Human Collaborators */}
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

                  {/* AI Agents */}
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

                  {notebook.collaborators.length === 1 && (
                    <p className="text-center text-gray-500 py-8">
                      No collaborators yet. Invite people or add AI agents!
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab 4: Chat History */}
          <TabsContent value="chat" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Chat History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notebook.chatMessages.length === 0 ? (
                    <p className="text-center text-gray-500 py-12">
                      No chat messages yet
                    </p>
                  ) : (
                    notebook.chatMessages.map((msg: any) => {
                      // Check if it's agent joined/left message
                      const isAgentJoined =
                        msg.authorType === "agent" &&
                        msg.content.includes("entered the chat");
                      const isAgentLeft =
                        msg.authorType === "system" &&
                        msg.content.includes("left the chat");

                      if (isAgentJoined || isAgentLeft) {
                        return (
                          <AgentChatMessage
                            key={msg.id}
                            agentName={msg.authorName || "Agent"}
                            agentIcon={AGENT_ICONS[msg.authorName || ""] || "🤖"}
                            action={isAgentJoined ? "joined" : "left"}
                          />
                        );
                      }

                      // Regular chat message
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.authorType === "human"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-4 ${
                              msg.authorType === "human"
                                ? "bg-blue-500 text-white"
                                : msg.authorType === "agent"
                                ? "bg-purple-100 text-purple-900 border-2 border-purple-300"
                                : "bg-gray-100 text-gray-900"
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              {msg.authorType === "agent" && (
                                <span className="text-xl">
                                  {AGENT_ICONS[msg.authorName || ""] || "🤖"}
                                </span>
                              )}
                              <p className="text-xs font-medium opacity-75">
                                {msg.authorName || "Unknown"}
                              </p>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">
                              {msg.content}
                            </p>
                            <p className="text-xs mt-2 opacity-50">
                              {new Date(msg.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}