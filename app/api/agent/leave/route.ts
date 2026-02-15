import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { notebookId, agentId } = await req.json();

    // Verify user owns the notebook
    const notebook = await prisma.notebook.findFirst({
      where: {
        id: notebookId,
        userId: userId,
      },
    });

    if (!notebook) {
      return NextResponse.json(
        { error: "Notebook not found or access denied" },
        { status: 404 }
      );
    }

    // Get agent info before removing
    const agent = await prisma.notebookCollaborator.findFirst({
      where: {
        notebookId,
        type: "agent",
        status: "active",
      },
    });

    const agentName = agent?.agentName || "AI Agent";

    // Mark agent as removed
    await prisma.notebookCollaborator.updateMany({
      where: {
        notebookId,
        type: "agent",
        agentName: agentName,
        status: "active",
      },
      data: {
        status: "removed",
      },
    });

    // Log agent leaving in chat
    await prisma.chatMessage.create({
      data: {
        notebookId,
        role: "system",
        content: `${agentName} has left the chat`,
        authorType: "system",
        authorName: "System",
      },
    });

    return NextResponse.json({
      success: true,
      message: `${agentName} removed successfully`,
    });
  } catch (error: any) {
    console.error("Agent leave error:", error);
    return NextResponse.json(
      { error: "Failed to remove agent" },
      { status: 500 }
    );
  }
}