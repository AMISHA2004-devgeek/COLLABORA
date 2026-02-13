import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import NotebookEditor from "./NotebookEditor";

export default async function NotebookPage({
  params,
}: {
  params: { id: string };
}) {
  try {
    /* ================================
       AUTHENTICATION
    ================================= */

    const { userId } = await auth();
    if (!userId) {
      redirect("/sign-in");
    }

    const user = await currentUser();
    if (!user) {
      redirect("/sign-in");
    }

    /* ================================
       AUTO-ACTIVATE INVITE (ROBUST)
    ================================= */

    const userEmails = user.emailAddresses.map((e) =>
      e.emailAddress.toLowerCase()
    );

    if (userEmails.length > 0) {
      try {
        await prisma.notebookCollaborator.updateMany({
          where: {
            notebookId: params.id,
            email: {
              in: userEmails,
              mode: "insensitive",
            },
            status: "pending",
          },
          data: {
            userId: userId,
            status: "active",
            type: "human",
          },
        });
      } catch (err) {
        console.error("⚠️ Auto-activation error:", err);
      }
    }

    /* ================================
       FETCH NOTEBOOK
    ================================= */

    const notebook = await prisma.notebook.findUnique({
      where: { id: params.id },
      include: {
        collaborators: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
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
       ACCESS CONTROL
    ================================= */

    const isOwner = notebook.userId === userId;

    const isCollaborator = notebook.collaborators.some(
      (collab) =>
        collab.userId === userId &&
        collab.status === "active" &&
        collab.type === "human"
    );

    if (!isOwner && !isCollaborator) {
      return (
        <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                You don&apos;t have permission to view this notebook.
              </p>
              <a
                href="/dashboard"
                className="inline-block bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
              >
                Back to Dashboard
              </a>
            </CardContent>
          </Card>
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
        agentName: collab.agentName,
        createdAt: collab.createdAt.toISOString(),
        user: collab.user
          ? {
              id: collab.user.id,
              email: collab.user.email,
              name: collab.user.name,
              firstName:
                collab.user.name?.split(" ")[0] ||
                collab.user.email?.split("@")[0],
            }
          : null,
      })),
    };

    /* ================================
       RENDER
    ================================= */

    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">
                {notebook.title || "Untitled Notebook"}
              </CardTitle>

              {isCollaborator && !isOwner && (
                <p className="text-sm text-blue-600">📋 Shared with you</p>
              )}
            </CardHeader>

            <CardContent>
              <NotebookEditor notebook={serializedNotebook} />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  } catch (error: any) {
    console.error("❌ Page error:", error);

    return (
      <div className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle>Something went wrong</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    );
  }
}
