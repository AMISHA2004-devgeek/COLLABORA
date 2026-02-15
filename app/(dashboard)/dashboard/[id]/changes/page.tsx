import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChangesReviewClient } from "./changes-review-client";

export default async function ChangesPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Get notebook
  const notebook = await prisma.notebook.findUnique({
    where: { id: params.id },
  });

  if (!notebook) {
    notFound();
  }

  // Verify ownership
  if (notebook.userId !== userId) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Only the notebook owner can review changes.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get all proposed changes
  const changes = await prisma.proposedChange.findMany({
    where: { notebookId: params.id },
    include: {
      proposer: {
        select: {
          email: true,
          name: true,
        },
      },
    },
    orderBy: [{ status: "asc" }, { lineNumber: "asc" }],
  });

  const serializedChanges = changes.map((c) => ({
    id: c.id,
    lineNumber: c.lineNumber,
    originalText: c.originalText,
    proposedText: c.proposedText,
    reason: c.reason,
    status: c.status,
    createdAt: c.createdAt.toISOString(),
    proposerEmail: c.proposer.email,
  }));

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-2xl">Review Agent Suggestions</CardTitle>
            <p className="text-sm text-gray-600">
              Accept or reject changes proposed by AI agents
            </p>
          </CardHeader>
        </Card>

        <ChangesReviewClient
          notebookId={params.id}
          changes={serializedChanges}
        />
      </div>
    </div>
  );
}