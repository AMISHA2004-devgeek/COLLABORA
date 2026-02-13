"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Save, Trash2, X, ArrowLeft } from "lucide-react";

type Message = {
  role: string;
  content: string;
  createdAt?: string;
};

export default function NotebookEditor({ notebook }: any) {
  const router = useRouter();

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isEditingSummary, setIsEditingSummary] = useState(false);

  const [title, setTitle] = useState(notebook.title || "");
  const [description, setDescription] = useState(notebook.description || "");
  const [summary, setSummary] = useState(notebook.summaryText || "");
  
  // ✅ Parse chatMessages properly
  const [messages, setMessages] = useState<Message[]>(() => {
    if (Array.isArray(notebook.chatMessages)) {
      return notebook.chatMessages;
    }
    if (typeof notebook.chatMessages === 'string') {
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

  // ✅ Save All Changes INCLUDING MESSAGES
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
          messages, // ✅ Save chat history
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to save");
      }

      // Exit all edit modes
      setIsEditingTitle(false);
      setIsEditingDesc(false);
      setIsEditingSummary(false);
      
      router.refresh();
      alert("Notebook saved successfully!");
      
    } catch (error: any) {
      console.error("Save failed:", error);
      alert(`Failed to save: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  // ✅ Ask AI Question with FULL CONTEXT
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
          summary, // Pass current summary
          chatHistory: messages, // ✅ Pass full conversation history
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await res.json();

      const newMessages: Message[] = [
        ...messages,
        { 
          role: "user", 
          content: question, 
          createdAt: new Date().toISOString() 
        },
        { 
          role: "assistant", 
          content: data.answer, 
          createdAt: new Date().toISOString() 
        },
      ];

      setMessages(newMessages);
      setQuestion("");
      
      // ✅ Auto-save messages after each chat
      await autoSaveMessages(newMessages);
      
    } catch (error: any) {
      console.error("Chat failed:", error);
      alert("Failed to get AI response");
    } finally {
      setLoading(false);
    }
  }

  // ✅ Auto-save messages after chat
  async function autoSaveMessages(newMessages: Message[]) {
    try {
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
      console.error("Failed to auto-save messages:", error);
    }
  }

  // ✅ Delete Notebook
  async function handleDelete() {
    const confirmDelete = confirm("Delete this notebook? This cannot be undone.");
    if (!confirmDelete) return;

    setLoading(true);

    try {
      await fetch("/api/notebook/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notebook.id }),
      });

      router.push("/dashboard");
      router.refresh();
      
    } catch (error: any) {
      console.error("Delete failed:", error);
      alert("Failed to delete notebook");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      
      {/* Loading Bar */}
      {loading && (
        <div className="fixed top-0 left-0 w-full h-1 bg-blue-500 animate-pulse z-50"></div>
      )}

      {/* Back Button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </button>

      {/* Title Section */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-start justify-between gap-4">
          {isEditingTitle ? (
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 text-xl font-bold border-b-2 border-blue-500 outline-none pb-1"
              autoFocus
              placeholder="Enter title..."
            />
          ) : (
            <h2 className="text-xl font-bold flex-1">{title}</h2>
          )}
          
          <button
            onClick={() => setIsEditingTitle(!isEditingTitle)}
            className="text-gray-500 hover:text-gray-700"
            title={isEditingTitle ? "Cancel" : "Edit title"}
          >
            {isEditingTitle ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Description Section */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="font-semibold">Description</h3>
          <button
            onClick={() => setIsEditingDesc(!isEditingDesc)}
            className="text-gray-500 hover:text-gray-700"
            title={isEditingDesc ? "Cancel" : "Edit description"}
          >
            {isEditingDesc ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          </button>
        </div>

        {isEditingDesc ? (
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a description..."
            className="w-full border rounded p-3 min-h-[80px]"
          />
        ) : (
          <p className="text-gray-600 text-sm">
            {description || "No description yet. Click edit to add one."}
          </p>
        )}
      </div>

      {/* Summary Section */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="font-semibold">Summary</h3>
          <button
            onClick={() => setIsEditingSummary(!isEditingSummary)}
            className="text-gray-500 hover:text-gray-700"
            title={isEditingSummary ? "Cancel" : "Edit summary"}
          >
            {isEditingSummary ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
          </button>
        </div>

        {isEditingSummary ? (
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full border rounded p-3 min-h-[200px]"
            placeholder="Enter summary..."
          />
        ) : (
          <p className="whitespace-pre-line text-gray-700 text-sm">
            {summary || "No summary yet."}
          </p>
        )}
      </div>

      {/* AI Chat Section */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="font-semibold mb-4">AI Chat ({messages.length} messages)</h3>

        {/* Messages */}
        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
          {messages.length === 0 ? (
            <p className="text-gray-400 text-center py-8 text-sm">
              No chat history yet. Ask a question below!
            </p>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded ${
                  msg.role === "user"
                    ? "bg-blue-100 ml-12"
                    : "bg-gray-100 mr-12"
                }`}
              >
                <div className="flex items-start gap-2">
                  <strong className="text-xs font-semibold">
                    {msg.role === "user" ? "You" : "AI"}:
                  </strong>
                  <p className="flex-1 text-sm">{msg.content}</p>
                </div>
                {msg.createdAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Ask Input */}
        <div className="flex gap-2">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAsk();
              }
            }}
            placeholder="Ask something about this document..."
            className="flex-1 border rounded p-3 text-sm"
            disabled={loading}
          />
          <button
            onClick={handleAsk}
            className="bg-black text-white px-6 rounded hover:bg-gray-800 disabled:opacity-50 text-sm"
            disabled={loading || !question.trim()}
          >
            {loading ? "..." : "Ask"}
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <button
          onClick={handleSave}
          className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          disabled={loading}
        >
          <Save className="w-5 h-5" />
          {loading ? "Saving..." : "Save Changes"}
        </button>

        <button
          onClick={handleDelete}
          className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
          disabled={loading}
        >
          <Trash2 className="w-5 h-5" />
          Delete
        </button>
      </div>
    </div>
  );
}