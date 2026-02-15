import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { FinalEditorClient } from "./final-editor-client";

export default async function FinalEditPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const notebook = await prisma.notebook.findUnique({
    where: { id: params.id },
    include: {
      changes: {
        where: { status: "accepted" },
        orderBy: { lineNumber: "asc" },
      },
    },
  });

  if (!notebook) {
    notFound();
  }

  if (notebook.userId !== userId) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only the owner can edit the final version.</p>
        </div>
      </div>
    );
  }

  // Apply accepted changes to summary
  let finalSummary = notebook.summaryText || "";
  const lines = finalSummary.split("\n");

  // Apply changes from lowest to highest line number to maintain indices
  const sortedChanges = [...notebook.changes].sort((a, b) => b.lineNumber - a.lineNumber);
  
  for (const change of sortedChanges) {
    if (change.lineNumber < lines.length) {
      lines[change.lineNumber] = change.proposedText;
    }
  }

  finalSummary = lines.join("\n");

  const serializedChanges = notebook.changes.map((c) => ({
    id: c.id,
    lineNumber: c.lineNumber,
    originalText: c.originalText,
    proposedText: c.proposedText,
    reason: c.reason,
  }));

  return (
    <FinalEditorClient
      notebookId={params.id}
      notebookTitle={notebook.title || "Untitled"}
      initialSummary={finalSummary}
      acceptedChanges={serializedChanges}
      originalSummary={notebook.summaryText || ""}
    />
  );
}