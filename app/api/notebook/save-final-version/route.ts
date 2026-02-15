import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { notebookId, finalSummary } = await req.json();

    // Verify ownership
    const notebook = await prisma.notebook.findFirst({
      where: {
        id: notebookId,
        userId,
      },
    });

    if (!notebook) {
      return NextResponse.json(
        { error: "Notebook not found or access denied" },
        { status: 404 }
      );
    }

    // Update notebook with final version
    const updated = await prisma.notebook.update({
      where: { id: notebookId },
      data: {
        summaryText: finalSummary,
        updatedAt: new Date(),
      },
    });

    // Log in chat history
    await prisma.chatMessage.create({
      data: {
        notebookId,
        role: "system",
        content: `Owner saved final edited version (${finalSummary.split("\n").length} lines)`,
        authorType: "system",
        authorName: "System",
      },
    });

    // Mark all accepted changes as completed
    await prisma.proposedChange.updateMany({
      where: {
        notebookId,
        status: "accepted",
      },
      data: {
        status: "completed",
      },
    });

    return NextResponse.json({
      success: true,
      notebook: updated,
    });
  } catch (error: any) {
    console.error("Save final version error:", error);
    return NextResponse.json(
      { error: "Failed to save final version" },
      { status: 500 }
    );
  }
}