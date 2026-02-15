import { auth, currentUser } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import NotebookPageClient from "./notebook-page-client";

export default async function NotebookPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    /* ================================
       AUTHENTICATION
    ================================= */

    const { userId, orgId } = await auth(); // ✅ Get orgId

    if (!userId) {
      redirect("/sign-in");
    }

    const user = await currentUser();
    if (!user) {
      redirect("/sign-in");
    }

    /* ================================
       FETCH NOTEBOOK
    ================================= */

    const notebook = await prisma.notebook.findUnique({
      where: { id: params.id },
      include: {
        collaborators: {
          where: { type: "agent" }, // ✅ Only fetch AI agents
        },
        chatMessages: {
          orderBy: { createdAt: "asc" },
          take: 100,
        },
      },
    });

    if (!notebook) {
      notFound();
    }

    /* ================================
       ACCESS CONTROL (NEW LOGIC)
    ================================= */

    const isOwner = notebook.userId === userId;

    // ✅ Check organization membership
    let isOrgMember = false;
    if (notebook.organizationId && orgId === notebook.organizationId) {
      isOrgMember = true;
    }

    // ✅ New access check: owner OR org member
    const hasAccess = isOwner || isOrgMember;

    if (!hasAccess) {
      return (
        <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              {notebook.organizationId 
                ? "This notebook belongs to a workspace you're not a member of."
                : "You don't have permission to view this notebook."
              }
            </p>
            <a
              href="/dashboard"
              className="inline-block bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      );
    }

    /* ================================
       SERIALIZE DATA
    ================================= */

    const serializedNotebook = {
      id: notebook.id,
      title: notebook.title || "Untitled",
      description: notebook.description || "",
      content: notebook.content || "",
      originalText: notebook.originalText || "",
      summaryText: notebook.summaryText || "",
      summary: notebook.summaryText || "",
      createdAt: notebook.createdAt.toISOString(),
      updatedAt: notebook.updatedAt.toISOString(),
      userId: notebook.userId,
      organizationId: notebook.organizationId,

      chatMessages: notebook.chatMessages.map((msg) => ({
        id: msg.id,
        content: msg.content,
        role: msg.role,
        authorId: msg.authorId,
        authorType: msg.authorType,
        authorName: msg.authorName,
        createdAt: msg.createdAt.toISOString(),
      })),

      collaborators: notebook.collaborators.map((collab) => ({
        id: collab.id,
        notebookId: collab.notebookId,
        userId: collab.userId,
        email: collab.email,
        role: collab.role,
        status: collab.status,
        type: collab.type,
        agentType: collab.agentType,
        agentName: collab.agentName,
        createdAt: collab.createdAt.toISOString(),
      })),
    };

    // Get active agent IDs
    const activeAgents = notebook.collaborators
      .filter((c) => c.type === "agent" && c.status === "active")
      .map((c) => {
        const nameToId: Record<string, string> = {
          "Media Content Strategist": "content-strategist",
          "Research & Fact-Check AI": "research-agent",
          "Creative Director AI": "creative-director",
          "Audience Insights Analyst": "audience-analytics",
        };
        return nameToId[c.agentName || ""] || "";
      })
      .filter(Boolean);

    /* ================================
       RENDER CLIENT COMPONENT
    ================================= */

    return (
      <NotebookPageClient
        notebook={serializedNotebook}
        activeAgents={activeAgents}
        isOwner={isOwner}
        isOrgMember={isOrgMember}
      />
    );
  } catch (error: any) {
    console.error("❌ Page error:", error);

    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
          <p className="text-gray-600 mb-4">
            We encountered an error loading this notebook.
          </p>
          <p className="text-sm text-gray-500 mb-4">
            Error: {error.message || "Unknown error"}
          </p>
          <a
            href="/dashboard"
            className="inline-block bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    );
  }
}