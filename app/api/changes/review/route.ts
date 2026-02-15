import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { changeId, action } = await req.json();

    if (!changeId || !action) {
      return NextResponse.json(
        { error: "Missing changeId or action" },
        { status: 400 }
      );
    }

    // Get the change
    const change = await prisma.proposedChange.findUnique({
      where: { id: changeId },
      include: {
        notebook: true,
      },
    });

    if (!change) {
      return NextResponse.json(
        { error: "Change not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (change.notebook.userId !== userId) {
      return NextResponse.json(
        { error: "Only the notebook owner can review changes" },
        { status: 403 }
      );
    }

    // Update the change status
    const newStatus = action === "accept" ? "accepted" : "rejected";

    const updatedChange = await prisma.proposedChange.update({
      where: { id: changeId },
      data: {
        status: newStatus,
        reviewedAt: new Date(),
      },
    });

    // If accepted, apply the change to the notebook
    if (action === "accept") {
      const notebook = await prisma.notebook.findUnique({
        where: { id: change.notebookId },
      });

      if (notebook && notebook.summaryText) {
        const lines = notebook.summaryText.split("\n");
        
        // Apply the change to the specific line
        if (change.lineNumber >= 0 && change.lineNumber < lines.length) {
          lines[change.lineNumber] = change.proposedText;
          
          // Update the notebook with new summary
          await prisma.notebook.update({
            where: { id: change.notebookId },
            data: {
              summaryText: lines.join("\n"),
              updatedAt: new Date(),
            },
          });
        }
      }
    }

    // Log in chat
    const actionText = action === "accept" ? "accepted" : "rejected";
    await prisma.chatMessage.create({
      data: {
        notebookId: change.notebookId,
        role: "system",
        content: `Owner ${actionText} suggestion for Line ${change.lineNumber + 1}`,
        authorType: "system",
        authorName: "System",
      },
    });

    // Notify the proposer
    if (change.proposerId && change.proposerId !== userId) {
      await prisma.notification.create({
        data: {
          userId: change.proposerId,
          type: "change_reviewed",
          title: `Suggestion ${actionText}`,
          message: `Your suggestion for "${change.notebook.title}" was ${actionText}`,
          link: `/dashboard/${change.notebookId}`,
          read: false,
        },
      });
    }

    return NextResponse.json({
      success: true,
      change: updatedChange,
      action: actionText,
    });
  } catch (error: any) {
    console.error("Review change error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to review change" },
      { status: 500 }
    );
  }
}