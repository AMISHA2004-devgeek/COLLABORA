import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { notebookId: string } }
) {
  const { userId, orgId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notebookId = params.notebookId;

    // Get notebook to check access
    const notebook = await prisma.notebook.findUnique({
      where: { id: notebookId },
    });

    if (!notebook) {
      return NextResponse.json({ error: "Notebook not found" }, { status: 404 });
    }

    // Check access
    const hasAccess =
      notebook.userId === userId ||
      (notebook.organizationId && notebook.organizationId === orgId);

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Fetch messages
    const messages = await prisma.chatMessage.findMany({
      where: { notebookId },
      orderBy: { createdAt: "asc" },
      take: 100, // Last 100 messages
    });

    const serializedMessages = messages.map((msg) => ({
      id: msg.id,
      content: msg.content,
      role: msg.role,
      authorId: msg.authorId,
      authorType: msg.authorType,
      authorName: msg.authorName,
      createdAt: msg.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      messages: serializedMessages,
    });
  } catch (error: any) {
    console.error("Get messages error:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}