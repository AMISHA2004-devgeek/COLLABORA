"use client";

import { Bot, UserMinus } from "lucide-react";

export function AgentChatMessage({
  agentName,
  agentIcon,
  action,
}: {
  agentName: string;
  agentIcon: string;
  action: "joined" | "left";
}) {
  return (
    <div className="flex items-center justify-center my-6">
      <div
        className={`
        px-6 py-3 rounded-full border-2
        ${
          action === "joined"
            ? "bg-purple-50 border-purple-300 text-purple-900"
            : "bg-gray-100 border-gray-300 text-gray-700"
        }
      `}
      >
        <div className="flex items-center gap-3 text-sm font-medium">
          {action === "joined" ? (
            <>
              <span className="text-2xl">{agentIcon}</span>
              <span>
                <strong>{agentName}</strong> has entered the chat
              </span>
            </>
          ) : (
            <>
              <UserMinus className="h-5 w-5" />
              <span>
                <strong>{agentName}</strong> has left the chat
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}