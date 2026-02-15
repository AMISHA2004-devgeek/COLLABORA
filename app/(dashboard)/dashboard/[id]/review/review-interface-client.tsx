"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check, X, MessageSquare, ArrowRight } from "lucide-react";
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
  status: string;
  createdAt: string;
  proposerEmail: string;
  proposerName: string | null;
}

interface Agent {
  id: string;
  name: string | null;
}

export function ReviewInterfaceClient({
  notebookId,
  notebookTitle,
  changes: initialChanges,
  agents,
}: {
  notebookId: string;
  notebookTitle: string;
  changes: Change[];
  agents: Agent[];
}) {
  const [changes, setChanges] = useState(initialChanges);
  const [processing, setProcessing] = useState<string | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedChange, setSelectedChange] = useState<Change | null>(null);
  const [replyMessage, setReplyMessage] = useState("");
  const router = useRouter();

  const handleReview = async (changeId: string, action: "accept" | "reject") => {
    setProcessing(changeId);

    try {
      const res = await fetch("/api/changes/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeId, action }),
      });

      const data = await res.json();

      if (data.success) {
        // Remove from pending list
        setChanges(changes.filter((c) => c.id !== changeId));
      } else {
        alert(data.error || "Failed to review change");
      }
    } catch (error) {
      console.error("Review error:", error);
      alert("Error reviewing change");
    } finally {
      setProcessing(null);
    }
  };

  const handleOpenReply = (change: Change) => {
    setSelectedChange(change);
    setReplyDialogOpen(true);
  };

  const handleSendReply = async () => {
    if (!selectedChange || !replyMessage.trim()) return;

    try {
      const res = await fetch("/api/agent/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notebookId,
          changeId: selectedChange.id,
          message: replyMessage,
        }),
      });

      const data = await res.json();

      if (data.success) {
        alert("Reply sent to agent!");
        setReplyMessage("");
        setReplyDialogOpen(false);
      } else {
        alert(data.error || "Failed to send reply");
      }
    } catch (error) {
      console.error("Reply error:", error);
      alert("Error sending reply");
    }
  };

  const handleGoToFinalEditor = () => {
    router.push(`/dashboard/${notebookId}/final-edit`);
  };

  const acceptedCount = initialChanges.length - changes.length;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Review Suggestions</CardTitle>
                <p className="text-sm text-gray-600 mt-1">{notebookTitle}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-3xl font-bold">{changes.length}</p>
                </div>
                {acceptedCount > 0 && (
                  <Button onClick={handleGoToFinalEditor} size="lg">
                    Go to Final Editor
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Changes List */}
        {changes.length === 0 ? (
          <Card className="p-12 text-center">
            <Check className="h-16 w-16 mx-auto mb-4 text-green-500" />
            <h3 className="text-xl font-semibold mb-2">All Caught Up!</h3>
            <p className="text-gray-600 mb-6">
              No pending suggestions to review
            </p>
            {acceptedCount > 0 && (
              <Button onClick={handleGoToFinalEditor} size="lg">
                Proceed to Final Editor
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {changes.map((change, index) => (
              <Card key={change.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 border-b">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>#{index + 1}</Badge>
                        <span className="text-sm font-medium">
                          Line {change.lineNumber + 1}
                        </span>
                        <Badge variant="outline">
                          by {change.proposerName || change.proposerEmail}
                        </Badge>
                      </div>
                      {change.reason && (
                        <p className="text-sm text-gray-700 italic">
                          "{change.reason}"
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(change.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleOpenReply(change)}
                        variant="outline"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Reply
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleReview(change.id, "accept")}
                        disabled={processing === change.id}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accept
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleReview(change.id, "reject")}
                        disabled={processing === change.id}
                        variant="destructive"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {/* GitHub-style diff */}
                  <div className="grid grid-cols-2 divide-x">
                    {/* Original */}
                    <div className="p-4 bg-red-50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded bg-red-600 text-white flex items-center justify-center text-xs font-bold">
                          -
                        </div>
                        <span className="text-xs font-medium text-red-700">
                          Original
                        </span>
                      </div>
                      <pre className="text-sm font-mono whitespace-pre-wrap bg-white p-3 rounded border border-red-200">
                        {change.originalText}
                      </pre>
                    </div>

                    {/* Proposed */}
                    <div className="p-4 bg-green-50">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded bg-green-600 text-white flex items-center justify-center text-xs font-bold">
                          +
                        </div>
                        <span className="text-xs font-medium text-green-700">
                          Proposed
                        </span>
                      </div>
                      <pre className="text-sm font-mono whitespace-pre-wrap bg-white p-3 rounded border border-green-200">
                        {change.proposedText}
                      </pre>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Reply Dialog */}
        <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reply to Suggestion</DialogTitle>
              <DialogDescription>
                Send a message back to ask for modifications
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {selectedChange && (
                <div className="p-3 bg-gray-50 rounded text-sm">
                  <p className="font-medium mb-1">Line {selectedChange.lineNumber + 1}</p>
                  <p className="text-gray-700">{selectedChange.proposedText}</p>
                </div>
              )}
              <Textarea
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder="e.g., 'Can you make it more concise?' or 'Please keep the original tone'"
                rows={4}
              />
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setReplyDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleSendReply} disabled={!replyMessage.trim()}>
                  Send Reply
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}