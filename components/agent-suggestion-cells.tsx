"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Send, Copy, Check, X } from "lucide-react";

interface Cell {
  id: string;
  lineNumber: number;
  originalText: string;
  proposedText: string;
  reason: string;
}

export function AgentSuggestionCells({
  notebookId,
  agentName,
  selectedLine,
  onSubmitSuccess,
}: {
  notebookId: string;
  agentName: string;
  selectedLine: { lineNumber: number; text: string } | null;
  onSubmitSuccess: () => void;
}) {
  const [cells, setCells] = useState<Cell[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const addCell = () => {
    if (!selectedLine) {
      alert("Please select a line from the summary first");
      return;
    }

    const newCell: Cell = {
      id: `cell-${Date.now()}`,
      lineNumber: selectedLine.lineNumber,
      originalText: selectedLine.text,
      proposedText: "",
      reason: "",
    };

    setCells([...cells, newCell]);
  };

  const updateCell = (id: string, field: keyof Cell, value: any) => {
    setCells(cells.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  const removeCell = (id: string) => {
    setCells(cells.filter((c) => c.id !== id));
  };

  const copyFromSelected = (id: string) => {
    if (!selectedLine) return;
    updateCell(id, "lineNumber", selectedLine.lineNumber);
    updateCell(id, "originalText", selectedLine.text);
  };

  const handleSubmitAll = async () => {
    const validCells = cells.filter((c) => c.proposedText.trim());

    if (validCells.length === 0) {
      alert("Please add at least one suggestion");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/agent/submit-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notebookId,
          agentName,
          suggestions: validCells,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert(`${validCells.length} suggestion(s) submitted for review!`);
        setCells([]);
        onSubmitSuccess();
      } else {
        alert(data.error || "Failed to submit");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Error submitting suggestions");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold flex items-center gap-2">
            Agent Workspace
            <Badge>{agentName}</Badge>
          </h3>
          <p className="text-xs text-gray-600">
            Jupyter-style cells for suggestions
          </p>
        </div>
        <Button size="sm" onClick={addCell} disabled={!selectedLine}>
          <Plus className="h-4 w-4 mr-1" />
          Add Cell
        </Button>
      </div>

      {cells.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-2">No cells yet</p>
          <p className="text-xs">
            Click a highlighted line in the summary, then click "Add Cell"
          </p>
        </div>
      )}

      <div className="space-y-4">
        {cells.map((cell, index) => (
          <Card key={cell.id} className="p-4 bg-slate-50 border-2">
            <div className="flex justify-between items-center mb-3">
              <div className="flex gap-2 items-center">
                <Badge>In [{index}]:</Badge>
                <span className="text-xs text-gray-600">
                  Line {cell.lineNumber + 1}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyFromSelected(cell.id)}
                  disabled={!selectedLine}
                  title="Copy from selected line"
                >
                  <Copy className="h-3 w-3" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeCell(cell.id)}
                >
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {/* Original Text */}
              <div>
                <label className="text-xs font-medium text-gray-700">
                  Original Text (Line {cell.lineNumber + 1})
                </label>
                <Textarea
                  value={cell.originalText}
                  readOnly
                  className="mt-1 bg-gray-100 font-mono text-sm"
                  rows={2}
                />
              </div>

              {/* Proposed Change */}
              <div>
                <label className="text-xs font-medium text-green-700">
                  Proposed Change *
                </label>
                <Textarea
                  value={cell.proposedText}
                  onChange={(e) =>
                    updateCell(cell.id, "proposedText", e.target.value)
                  }
                  placeholder="Enter your improved version..."
                  className="mt-1 bg-white font-mono text-sm"
                  rows={2}
                />
              </div>

              {/* Reason */}
              <div>
                <label className="text-xs font-medium text-gray-700">
                  Reason (Optional)
                </label>
                <Input
                  value={cell.reason}
                  onChange={(e) =>
                    updateCell(cell.id, "reason", e.target.value)
                  }
                  placeholder="Why this change improves the text..."
                  className="mt-1"
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {cells.length > 0 && (
        <Button
          onClick={handleSubmitAll}
          disabled={submitting}
          className="w-full mt-4"
          size="lg"
        >
          <Send className="h-4 w-4 mr-2" />
          {submitting
            ? "Submitting..."
            : `Submit ${cells.length} Suggestion(s) for Review`}
        </Button>
      )}
    </Card>
  );
}