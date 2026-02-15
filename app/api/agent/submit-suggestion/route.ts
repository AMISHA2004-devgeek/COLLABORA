import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { notebookId, agentName, suggestions } = await req.json();

    if (!suggestions || suggestions.length === 0) {
      return NextResponse.json(
        { error: "No suggestions provided" },
        { status: 400 }
      );
    }

    // Get notebook
    const notebook = await prisma.notebook.findUnique({
      where: { id: notebookId },
    });

    if (!notebook) {
      return NextResponse.json(
        { error: "Notebook not found" },
        { status: 404 }
      );
    }

    // Verify access
    const hasAccess =
      notebook.userId === userId ||
      (await prisma.notebookCollaborator.findFirst({
        where: {
          notebookId,
          userId,
          status: "active",
        },
      }));

    if (!hasAccess) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Create proposed changes
    const changes = await prisma.proposedChange.createMany({
      data: suggestions.map((s: any) => ({
        notebookId,
        proposerId: userId,
        lineNumber: s.lineNumber,
        originalText: s.originalText,
        proposedText: s.proposedText,
        reason: s.reason || `Suggestion from ${agentName}`,
        status: "pending",
      })),
    });

    // Log submission in chat
    await prisma.chatMessage.create({
      data: {
        notebookId,
        role: "system",
        content: `${agentName} submitted ${suggestions.length} suggestion(s) for review`,
        authorType: "agent",
        authorName: agentName,
      },
    });

    // After getting the notebook, add this debug log:
console.log("📧 Creating notification for user:", notebook.userId);
console.log("📧 Current user making request:", userId);

// ✅ FIX: Create notification for OWNER, not current user
await prisma.notification.create({
  data: {
    userId: notebook.userId, // Owner of notebook
    type: "change_proposed",
    title: `${agentName} Proposed Changes`,
    message: `${suggestions.length} suggestion(s) in "${notebook.title}"`,
    link: `/dashboard/${notebookId}/review`,
    read: false,
  },
});

console.log("✅ Notification created successfully");

    // Notify notebook owner
    if (notebook.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: notebook.userId,
          type: "change_proposed",
          title: `New Suggestions from ${agentName}`,
          message: `${suggestions.length} suggestion(s) ready for review`,
          link: `/dashboard/${notebookId}/review`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      count: suggestions.length,
    });
  } catch (error: any) {
    console.error("Submit suggestion error:", error);
    return NextResponse.json(
      { error: "Failed to submit suggestions" },
      { status: 500 }
    );
  }
}