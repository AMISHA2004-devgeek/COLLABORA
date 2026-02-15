"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, Bot } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface Message {
  id: string;
  content: string;
  role: string;
  authorId: string | null;
  authorType: string;
  authorName: string | null;
  createdAt: string;
}

const AGENT_ICONS: Record<string, string> = {
  "Media Content Strategist": "📰",
  "Research & Fact-Check AI": "🔍",
  "Creative Director AI": "🎨",
  "Audience Insights Analyst": "📊",
};

export function LiveChat({
  notebookId,
  initialMessages,
  isOrgMember,
}: {
  notebookId: string;
  initialMessages: Message[];
  isOrgMember: boolean;
}) {
  const { user } = useUser();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Poll for new messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/chat/${notebookId}/messages`);
        const data = await res.json();
        if (data.success && data.messages) {
          setMessages(data.messages);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [notebookId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;

    setSending(true);

    try {
      const res = await fetch(`/api/chat/${notebookId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
        }),
      });

      const data = await res.json();

      if (data.success && data.message) {
        setMessages([...messages, data.message]);
        setInput("");

        // Scroll to bottom
        setTimeout(() => {
          if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
          }
        }, 100);
      } else {
        alert(data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Send message error:", error);
      alert("Error sending message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Live Chat</CardTitle>
          {isOrgMember && (
            <Badge variant="secondary">
              <User className="h-3 w-3 mr-1" />
              Team Workspace
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-sm">No messages yet</p>
              <p className="text-xs mt-1">Start the conversation!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isCurrentUser = msg.authorId === user?.id;
              const isAgent = msg.authorType === "agent";
              const isSystem = msg.authorType === "system";

              // System messages (agent joined/left)
              if (isSystem && (msg.content.includes("entered the chat") || msg.content.includes("left the chat"))) {
                return (
                  <div key={msg.id} className="flex justify-center my-4">
                    <div className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
                      <p className="text-xs text-purple-900 font-medium flex items-center gap-2">
                        {isAgent && AGENT_ICONS[msg.authorName || ""]}
                        {msg.content}
                      </p>
                    </div>
                  </div>
                );
              }

              // Regular messages
              return (
                <div
                  key={msg.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg p-3 ${
                      isCurrentUser
                        ? "bg-blue-500 text-white"
                        : isAgent
                        ? "bg-purple-100 text-purple-900 border-2 border-purple-300"
                        : isSystem
                        ? "bg-gray-100 text-gray-900"
                        : "bg-gray-200 text-gray-900"
                    }`}
                  >
                    {/* Author info */}
                    <div className="flex items-center gap-2 mb-1">
                      {isAgent ? (
                        <span className="text-xl">
                          {AGENT_ICONS[msg.authorName || ""] || "🤖"}
                        </span>
                      ) : !isCurrentUser ? (
                        <User className="h-4 w-4" />
                      ) : null}
                      <p
                        className={`text-xs font-medium ${
                          isCurrentUser ? "text-blue-100" : "text-gray-600"
                        }`}
                      >
                        {isCurrentUser
                          ? "You"
                          : msg.authorName || "Unknown"}
                      </p>
                    </div>

                    {/* Message content */}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                    {/* Timestamp */}
                    <p
                      className={`text-xs mt-2 ${
                        isCurrentUser ? "text-blue-100" : "text-gray-500"
                      }`}
                    >
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      {/* Input */}
      <CardContent className="border-t p-4">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={2}
            className="resize-none"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            size="lg"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Press Enter to send • Shift+Enter for new line
        </p>
      </CardContent>
    </Card>
  );
}