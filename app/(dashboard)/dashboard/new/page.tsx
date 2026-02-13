"use client";

import { useState } from "react";

type Message = { role: string; content: string };

export default function NewNotebookPage() {
  const [file, setFile] = useState<File | null>(null);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false); // ✅ ADD THIS

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  // 🔹 Generate Summary
  async function handleGenerate() {
    if (!file) {
      alert("Please upload a file first");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/generate-summary", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setSummary(data.summary || "No summary returned.");
    } catch (error) {
      console.error(error);
      alert("Error generating summary");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!summary) {
      alert("Please generate a summary first");
      return;
    }

    setSaving(true); // ✅ Show loading bar
    
    try {
      const res = await fetch("/api/notebook/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: file?.name || "Untitled",
          summary,
          content: summary,
          messages,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save");
      }

      const data = await res.json();
      
      console.log("Save response:", data);
      
      const notebookId = data.notebook?.id;
      
      if (!notebookId) {
        throw new Error("No notebook ID returned");
      }
      
      // ✅ Redirect to dashboard
      window.location.href = "/dashboard";
      
    } catch (error: any) {
      console.error("Save failed:", error);
      alert(`Failed to save notebook: ${error.message || "Unknown error"}`);
      setSaving(false); // ✅ Only reset on error
    }
    // Don't add finally here - page will redirect on success
  }

  // 🔹 Chat Ask Question
  async function handleSend() {
    if (!question.trim()) return;

    const newMessages = [
      ...messages,
      { role: "user", content: question },
    ];

    setMessages(newMessages);
    setQuestion("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          summary,
        }),
      });

      const data = await res.json();

      setMessages([
        ...newMessages,
        { role: "assistant", content: data.answer },
      ]);
    } catch (error) {
      console.error(error);
      alert("Chat error");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
   {/* 🔥 Top Loading Bar */}
      {saving && (
        <div className="fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 z-50">
          <div className="h-full animate-pulse"></div>
        </div>
      )}

      {/* Optional: Overlay during save */}
      {saving && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40">
          <div className="bg-white rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-lg font-semibold">Saving your notebook...</p>
            <p className="text-sm text-gray-500 mt-2">Redirecting to dashboard</p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-4xl space-y-8">

        {/* Upload Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            Upload Document
          </h2>

          <input
            type="file"
            onChange={(e) =>
              setFile(e.target.files?.[0] || null)
            }
            disabled={saving}
          />

          <button
            onClick={handleGenerate}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={loading || saving}
          >
            {loading ? "Generating..." : "Generate Summary"}
          </button>
        </div>

        {/* Summary Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            Generated Summary
          </h2>

          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Summary will appear here..."
            className="w-full h-60 border p-3 rounded"
            disabled={saving}
          />
        </div>

        {/* Chat Section */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">
            Ask Questions About Document
          </h2>

          {/* Chat Messages - ✅ FIXED */}
          <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`p-3 rounded ${
                  msg.role === "user"
                    ? "bg-blue-100 text-right"
                    : "bg-gray-100"
                }`}
              >
                <strong>
                  {msg.role === "user" ? "You" : "AI"}:
                </strong>{" "}
                {msg.content}
              </div>
            ))}
          </div>

          {/* Chat Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask something..."
              className="flex-1 border p-3 rounded"
              disabled={saving}
            />

            <button
              onClick={handleSend}
              className="bg-black text-white px-4 rounded disabled:opacity-50"
              disabled={saving}
            >
              Send
            </button>
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          disabled={loading || saving || !summary}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving Notebook...
            </span>
          ) : (
            "Save Notebook"
          )}
        </button>

      </div>
    </div>
  );
}