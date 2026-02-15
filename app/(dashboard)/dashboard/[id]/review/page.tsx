import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { ReviewInterfaceClient } from "./review-interface-client";

export default async function ReviewPage({
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
  });

  if (!notebook) {
    notFound();
  }

  if (notebook.userId !== userId) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-gray-600">Only the owner can review changes.</p>
        </div>
      </div>
    );
  }

  // Get all pending changes with proposer info
  const changes = await prisma.proposedChange.findMany({
    where: {
      notebookId: params.id,
      status: "pending",
    },
    include: {
      proposer: {
        select: {
          email: true,
          name: true,
        },
      },
    },
    orderBy: { lineNumber: "asc" },
  });

  // Get agent collaborators for messaging
  const agents = await prisma.notebookCollaborator.findMany({
    where: {
      notebookId: params.id,
      type: "agent",
      status: "active",
    },
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
    proposerName: c.proposer.name,
  }));

  const serializedAgents = agents.map((a) => ({
    id: a.id,
    name: a.agentName,
  }));

  return (
    <ReviewInterfaceClient
      notebookId={params.id}
      notebookTitle={notebook.title || "Untitled"}
      changes={serializedChanges}
      agents={serializedAgents}
    />
  );
}