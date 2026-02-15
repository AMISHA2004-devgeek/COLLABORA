"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock } from "lucide-react";

interface Change {
  id: string;
  lineNumber: number;
  originalText: string;
  proposedText: string;
  reason: string | null;
  status: string;
  createdAt: string;
  proposerEmail: string;
}

export function ChangesReviewClient({
  notebookId,
  changes: initialChanges,
}: {
  notebookId: string;
  changes: Change[];
}) {
  const [changes, setChanges] = useState(initialChanges);
  const [processing, setProcessing] = useState<string | null>(null);

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
        // Update local state
        setChanges(
          changes.map((c) =>
            c.id === changeId ? { ...c, status: action + "ed" } : c
          )
        );
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

  const pendingChanges = changes.filter((c) => c.status === "pending");
  const acceptedChanges = changes.filter((c) => c.status === "accepted");
  const rejectedChanges = changes.filter((c) => c.status === "rejected");

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Clock className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
            <p className="text-3xl font-bold">{pendingChanges.length}</p>
            <p className="text-sm text-gray-600">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <Check className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p className="text-3xl font-bold">{acceptedChanges.length}</p>
            <p className="text-sm text-gray-600">Accepted</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <X className="h-8 w-8 mx-auto mb-2 text-red-500" />
            <p className="text-3xl font-bold">{rejectedChanges.length}</p>
            <p className="text-sm text-gray-600">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Changes */}
      {pendingChanges.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Pending Review</h2>
          <div className="space-y-4">
            {pendingChanges.map((change) => (
              <Card key={change.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        Line {change.lineNumber + 1}
                      </CardTitle>
                      <p className="text-xs text-gray-600 mt-1">
                        Suggested by: {change.proposerEmail} •{" "}
                        {new Date(change.createdAt).toLocaleDateString()}
                      </p>
                      {change.reason && (
                        <p className="text-sm italic text-gray-700 mt-2">
                          &quot;{change.reason}&quot;
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2">
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
                        variant="outline"
                        onClick={() => handleReview(change.id, "reject")}
                        disabled={processing === change.id}
                        className="border-red-500 text-red-600 hover:bg-red-50"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Badge className="mb-2" variant="destructive">
                        Original
                      </Badge>
                      <div className="p-4 bg-red-50 rounded border border-red-200">
                        <p className="text-sm font-mono">
                          {change.originalText}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Badge className="mb-2 bg-green-600">Proposed</Badge>
                      <div className="p-4 bg-green-50 rounded border border-green-200">
                        <p className="text-sm font-mono">
                          {change.proposedText}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* No Pending Changes */}
      {pendingChanges.length === 0 && (
        <Card className="p-12 text-center">
          <Check className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-600">No pending changes to review</p>
        </Card>
      )}

      {/* History */}
      {(acceptedChanges.length > 0 || rejectedChanges.length > 0) && (
        <div>
          <h2 className="text-xl font-semibold mb-4">History</h2>
          <div className="space-y-2">
            {[...acceptedChanges, ...rejectedChanges].map((change) => (
              <Card key={change.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm">
                      <strong>Line {change.lineNumber + 1}</strong> •{" "}
                      {change.proposerEmail}
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(change.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge
                    variant={
                      change.status === "accepted" ? "default" : "destructive"
                    }
                  >
                    {change.status}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}