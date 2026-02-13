"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save, Trash2, X, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
// ✅ ADD THIS IMPORT
import { inviteHuman } from "./invite-action";

type Message = {
  authorType: "human" | "agent" | "system";
  authorName: string;
  content: string;
  createdAt?: string;
};

export default function NotebookEditor({ notebook }: any) {
  const router = useRouter();

  // ✅ Add safety check
  if (!notebook) {
    return <div className="p-4 text-red-500">Error: Notebook data not found</div>;
  }

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);

  const [title, setTitle] = useState(notebook.title || "Untitled Notebook");
  const [description, setDescription] = useState(notebook.description || "");
  const [summary, setSummary] = useState(notebook.summaryText || notebook.summary || "");

  const [messages, setMessages] = useState<Message[]>(() => {
    if (Array.isArray(notebook.chatMessages)) return notebook.chatMessages;
    if (typeof notebook.chatMessages === "string") {
      try {
        return JSON.parse(notebook.chatMessages);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Add Collaborator State
  const [showAddModal, setShowAddModal] = useState(false);
  const [collabType, setCollabType] = useState<"human" | "agent">("human");
  const [collabValue, setCollabValue] = useState(""); // This will now hold EMAIL for humans

  // ===============================
  // Save Notebook
  // ===============================
  async function handleSave() {
    setLoading(true);
    try {
      const res = await fetch("/api/notebook/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: notebook.id,
          title,
          description,
          summary,
          messages,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");

      setIsEditingTitle(false);
      setIsEditingDesc(false);
      setIsEditingSummary(false);

      router.refresh();
      alert("Notebook saved successfully!");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  // ===============================
  // ✅ UPDATED: Add Collaborator (Now uses Clerk for humans)
  // ===============================
  async function handleAddCollaborator() {
    if (!collabValue.trim()) return;

    try {
      if (collabType === "human") {
        // ✅ NEW: Use Clerk invitation server action
        await inviteHuman(notebook.id, collabValue);
        alert("Invitation sent! They'll receive an email.");
      } else {
        // Keep existing agent logic
        await fetch("/api/notebook/add-agent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            notebookId: notebook.id,
            value: collabValue,
          }),
        });
      }

      setCollabValue("");
      setShowAddModal(false);
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to add collaborator");
    }
  }

  // ===============================
  // Ask AI
  // ===============================
  async function handleAsk() {
    if (!question.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notebookId: notebook.id,
          question,
          summary,
          chatHistory: messages,
        }),
      });

      if (!res.ok) throw new Error("Failed to get AI response");

      const data = await res.json();

      const newMessages: Message[] = [
        ...messages,
        {
          authorType: "human",
          authorName: "You",
          content: question,
          createdAt: new Date().toISOString(),
        },
        {
          authorType: "agent",
          authorName: data.agentName || "AI",
          content: data.answer,
          createdAt: new Date().toISOString(),
        },
      ];

      setMessages(newMessages);
      setQuestion("");

      await fetch("/api/notebook/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: notebook.id,
          messages: newMessages,
        }),
      });

      router.refresh();
    } catch (error) {
      alert("Chat failed");
    } finally {
      setLoading(false);
    }
  }

  // ===============================
  // Delete Notebook
  // ===============================
  async function handleDelete() {
    if (!confirm("Delete this notebook?")) return;

    setLoading(true);
    try {
      await fetch("/api/notebook/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notebook.id }),
      });

      router.push("/dashboard");
      router.refresh();
    } catch {
      alert("Delete failed");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {loading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-blue-500 animate-pulse z-50" />
      )}

      {/* Back */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-gray-600"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      {/* Collaborators */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-semibold mb-3">Collaborators</h3>

        <div className="flex flex-wrap gap-2">
          {notebook.collaborators?.map((collab: any) => (
            <span
              key={collab.id}
              className="px-3 py-1 bg-gray-200 rounded-full text-xs"
            >
              {collab.type === "agent" ? (
                `🤖 ${collab.agentName}`
              ) : collab.status === "pending" ? (
                // ✅ Show pending invitations
                `📧 ${collab.email} (Pending)`
              ) : (
                // ✅ Show active users with their name if available
                `👤 ${collab.user?.firstName || collab.email}`
              )}{" "}
              ({collab.role})
            </span>
          ))}

          {(!notebook.collaborators ||
            notebook.collaborators.length === 0) && (
            <span className="text-gray-400 text-sm">
              No collaborators yet.
            </span>
          )}
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="mt-3 bg-black text-white px-4 py-2 rounded text-sm"
        >
          + Add Collaborator
        </button>
      </div>

      {/* Title */}
      <div className="bg-white p-4 rounded-lg border">
        <h2 className="text-xl font-bold">{title}</h2>
      </div>

      {/* SUMMARY SECTION */}
      {notebook.summary && (
        <div className="mb-6 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">Saved Summary</h3>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {notebook.summary}
          </p>
        </div>
      )}

      {/* Chat */}
      <div className="bg-white p-4 rounded-lg border">
        {/* AI CHAT SECTION */}
        <div className="mt-8">
          <h3 className="font-semibold mb-4">
            AI Chat ({messages.length} messages)
          </h3>

          {/* CHAT HISTORY */}
          <div className="space-y-4 mb-6">
            {messages.length === 0 ? (
              <p className="text-gray-400 text-sm">No messages yet. Start a conversation!</p>
            ) : (
              messages.map((msg: any, index: number) => (
                <div key={index} className="p-3 bg-gray-100 rounded">
                  <div className="text-xs text-gray-500">{msg.authorName}</div>
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                </div>
              ))
            )}
          </div>

          {/* INPUT BOX */}
          <div className="flex gap-2">
            <input
              type="text"
              className="flex-1 border p-2 rounded"
              placeholder="Ask something..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            />
            <button 
              onClick={handleAsk}
              disabled={loading || !question.trim()}
              className="bg-black text-white px-4 rounded disabled:opacity-50"
            >
              {loading ? "..." : "Ask"}
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg flex items-center justify-center gap-2"
        >
          <Save size={18} />
          Save
        </button>

        <button
          onClick={handleDelete}
          className="bg-red-600 text-white px-6 py-3 rounded-lg flex items-center gap-2"
        >
          <Trash2 size={18} />
          Delete
        </button>
      </div>

      {/* ✅ UPDATED: Modal with Email Input */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 space-y-4">
            <h3 className="font-semibold text-lg">Add Collaborator</h3>

            <select
              value={collabType}
              onChange={(e) =>
                setCollabType(e.target.value as "human" | "agent")
              }
              className="w-full border rounded p-2"
            >
              <option value="human">Human</option>
              <option value="agent">Agent</option>
            </select>

            {/* ✅ UPDATED: Email input for humans */}
            <input
              type={collabType === "human" ? "email" : "text"}
              value={collabValue}
              onChange={(e) => setCollabValue(e.target.value)}
              placeholder={
                collabType === "human"
                  ? "Enter Email Address"
                  : "Enter Agent Name"
              }
              className="w-full border rounded p-2"
            />

            {collabType === "human" && (
              <p className="text-xs text-gray-500">
                💡 An invitation email will be sent to this address
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded"
              >
                Cancel
              </button>

              <button
                onClick={handleAddCollaborator}
                className="bg-black text-white px-4 py-2 rounded"
              >
                {collabType === "human" ? "Send Invite" : "Add Agent"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}