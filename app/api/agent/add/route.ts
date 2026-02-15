import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { notebookId, agentId, agentName, agentType, role } =
      await req.json();

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

    // Check if agent already exists
    const existingAgent = await prisma.notebookCollaborator.findFirst({
      where: {
        notebookId,
        type: "agent",
        agentName,
        status: "active",
      },
    });

    if (existingAgent) {
      return NextResponse.json(
        { error: "This agent is already active in this notebook" },
        { status: 400 }
      );
    }

    // Add agent as collaborator
    const agent = await prisma.notebookCollaborator.create({
      data: {
        notebookId,
        type: "agent",
        role: role,
        agentType: agentType,
        agentName: agentName,
        status: "active",
      },
    });

    // Log agent joining in chat
    await prisma.chatMessage.create({
      data: {
        notebookId,
        role: "system",
        content: `${agentName} has entered the chat`,
        authorType: "agent",
        authorName: agentName,
      },
    });

    return NextResponse.json({
      success: true,
      agent,
    });
  } catch (error: any) {
    console.error("Add agent error:", error);
    return NextResponse.json(
      { error: "Failed to add agent" },
      { status: 500 }
    );
  }
}