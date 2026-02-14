"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, X } from "lucide-react";

export default function ChangesPage({ params }: { params: { id: string } }) {
  const [changes, setChanges] = useState([]);

  useEffect(() => {
    fetchChanges();
  }, []);

  const fetchChanges = async () => {
    const res = await fetch(`/api/changes/${params.id}`);
    const data = await res.json();
    if (data.success) {
      setChanges(data.changes);
    }
  };

  const handleReview = async (changeId: string, action: "accept" | "reject") => {
    const res = await fetch("/api/changes/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ changeId, action }),
    });

    if (res.ok) {
      fetchChanges();
    }
  };

  const pendingChanges = changes.filter((c: any) => c.status === "pending");

  return (
    <div className="container max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Proposed Changes</h1>
      
      {pendingChanges.length === 0 ? (
        <Card className="p-8 text-center text-gray-500">
          No pending changes to review
        </Card>
      ) : (
        <div className="space-y-4">
          {pendingChanges.map((change: any) => (
            <Card key={change.id} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-sm text-gray-500">
                    Line {change.lineNumber} • By {change.proposer.email}
                  </p>
                  {change.reason && (
                    <p className="text-sm italic mt-1">"{change.reason}"</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleReview(change.id, "accept")}
                    className="bg-green-600"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleReview(change.id, "reject")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mt-3">
                <div>
                  <p className="text-xs font-medium text-red-600 mb-1">Original</p>
                  <p className="text-sm bg-red-50 p-2 rounded">{change.originalText}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-green-600 mb-1">Proposed</p>
                  <p className="text-sm bg-green-50 p-2 rounded">{change.proposedText}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}