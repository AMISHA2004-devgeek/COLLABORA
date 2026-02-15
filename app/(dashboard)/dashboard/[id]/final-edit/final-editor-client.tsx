"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Save, Plus, Trash2, RotateCcw, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Change {
  id: string;
  lineNumber: number;
  originalText: string;
  proposedText: string;
  reason: string | null;
}

interface EditCell {
  id: string;
  lineNumber: number;
  text: string;
  isModified: boolean;
}

export function FinalEditorClient({
  notebookId,
  notebookTitle,
  initialSummary,
  acceptedChanges,
  originalSummary,
}: {
  notebookId: string;
  notebookTitle: string;
  initialSummary: string;
  acceptedChanges: Change[];
  originalSummary: string;
}) {
  const [cells, setCells] = useState<EditCell[]>(() =>
    initialSummary.split("\n").map((line, index) => ({
      id: `cell-${index}`,
      lineNumber: index,
      text: line,
      isModified: false,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [showChanges, setShowChanges] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const router = useRouter();

  const updateCell = (id: string, newText: string) => {
    setCells(
      cells.map((cell) =>
        cell.id === id
          ? { ...cell, text: newText, isModified: cell.text !== newText }
          : cell
      )
    );
  };

  const addCellAfter = (index: number) => {
    const newCells = [...cells];
    newCells.splice(index + 1, 0, {
      id: `cell-${Date.now()}`,
      lineNumber: index + 0.5, // Temporary
      text: "",
      isModified: true,
    });
    // Renumber
    const renumbered = newCells.map((cell, i) => ({
      ...cell,
      lineNumber: i,
    }));
    setCells(renumbered);
  };

  const deleteCell = (id: string) => {
    const filtered = cells.filter((c) => c.id !== id);
    // Renumber
    const renumbered = filtered.map((cell, i) => ({
      ...cell,
      lineNumber: i,
    }));
    setCells(renumbered);
  };

  const resetToOriginal = () => {
    if (!confirm("Reset to original summary? All edits will be lost.")) return;
    setCells(
      originalSummary.split("\n").map((line, index) => ({
        id: `cell-${index}-reset`,
        lineNumber: index,
        text: line,
        isModified: false,
      }))
    );
  };

  const handleSave = async () => {
    setSaving(true);

    const finalText = cells.map((c) => c.text).join("\n");

    try {
      const res = await fetch("/api/notebook/save-final-version", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notebookId,
          finalSummary: finalText,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSaveDialogOpen(true);
      } else {
        alert(data.error || "Failed to save");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Error saving final version");
    } finally {
      setSaving(false);
    }
  };

  const modifiedCount = cells.filter((c) => c.isModified).length;
  const changedLineNumbers = acceptedChanges.map((c) => c.lineNumber);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Final Editor</CardTitle>
                <p className="text-sm text-gray-600 mt-1">{notebookTitle}</p>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowChanges(!showChanges)}
                >
                  {showChanges ? "Hide" : "Show"} Accepted Changes ({acceptedChanges.length})
                </Button>
                <Button variant="outline" onClick={resetToOriginal}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  size="lg"
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Saving..." : "Save Final Version"}
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold">{cells.length}</p>
              <p className="text-sm text-gray-600">Total Lines</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-green-600">
                {acceptedChanges.length}
              </p>
              <p className="text-sm text-gray-600">Accepted Changes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-3xl font-bold text-blue-600">
                {modifiedCount}
              </p>
              <p className="text-sm text-gray-600">Your Edits</p>
            </CardContent>
          </Card>
        </div>

        {/* Accepted Changes Preview */}
        {showChanges && acceptedChanges.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Accepted Changes Applied</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {acceptedChanges.map((change) => (
                  <div
                    key={change.id}
                    className="p-3 bg-green-50 border border-green-200 rounded"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Badge>Line {change.lineNumber + 1}</Badge>
                      {change.reason && (
                        <span className="text-xs text-gray-600">
                          {change.reason}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-red-600 font-medium mb-1">- Original:</p>
                        <p className="font-mono text-gray-700">
                          {change.originalText}
                        </p>
                      </div>
                      <div>
                        <p className="text-green-600 font-medium mb-1">+ New:</p>
                        <p className="font-mono text-gray-700">
                          {change.proposedText}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Jupyter-Style Editor Cells */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Jupyter-Style Line Editor
              <Badge variant="outline">Interactive</Badge>
            </CardTitle>
            <p className="text-sm text-gray-600">
              Edit each line individually. Lines with accepted changes are highlighted in green.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {cells.map((cell, index) => {
              const wasChanged = changedLineNumbers.includes(cell.lineNumber);
              
              return (
                <div
                  key={cell.id}
                  className={`border-2 rounded-lg p-4 transition ${
                    wasChanged
                      ? "border-green-400 bg-green-50"
                      : cell.isModified
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Line Number */}
                    <div className="flex flex-col items-center gap-1 pt-2">
                      <Badge
                        variant={
                          wasChanged
                            ? "default"
                            : cell.isModified
                            ? "secondary"
                            : "outline"
                        }
                        className="font-mono"
                      >
                        [{index}]:
                      </Badge>
                      {wasChanged && (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                    </div>

                    {/* Text Editor */}
                    <Textarea
                      value={cell.text}
                      onChange={(e) => updateCell(cell.id, e.target.value)}
                      className="flex-1 font-mono text-sm resize-none"
                      rows={Math.max(2, Math.ceil(cell.text.length / 80))}
                      placeholder="Enter text..."
                    />

                    {/* Actions */}
                    <div className="flex flex-col gap-2 pt-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => addCellAfter(index)}
                        title="Add cell below"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteCell(cell.id)}
                        disabled={cells.length === 1}
                        title="Delete cell"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>

                  {/* Cell Metadata */}
                  <div className="mt-2 flex gap-2 text-xs">
                    {wasChanged && (
                      <Badge className="bg-green-600">
                        ✓ Change Applied
                      </Badge>
                    )}
                    {cell.isModified && !wasChanged && (
                      <Badge variant="secondary">✎ Modified</Badge>
                    )}
                    <span className="text-gray-500">
                      {cell.text.length} chars
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Add Cell at End */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => addCellAfter(cells.length - 1)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Line at End
            </Button>
          </CardContent>
        </Card>

        {/* Save Button at Bottom */}
        <div className="mt-6 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="lg"
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Final Version"}
          </Button>
        </div>

        {/* Success Dialog */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-6 w-6 text-green-600" />
                Final Version Saved!
              </DialogTitle>
              <DialogDescription>
                Your edited summary has been saved successfully.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded">
                <p className="text-sm font-medium mb-2">Summary:</p>
                <p className="text-sm text-gray-700">
                  • {cells.length} lines
                </p>
                <p className="text-sm text-gray-700">
                  • {acceptedChanges.length} agent suggestions applied
                </p>
                <p className="text-sm text-gray-700">
                  • {modifiedCount} manual edits made
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/dashboard/${notebookId}`)}
                >
                  View Notebook
                </Button>
                <Button onClick={() => router.push("/dashboard")}>
                  Back to Dashboard
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}