import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { notebookId: string } }
) {
  const { userId, orgId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const notebookId = params.notebookId;
    const { message } = await req.json();

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Message cannot be empty" },
        { status: 400 }
      );
    }

    // Get user info
    const user = await currentUser();
    const userName = user?.firstName
      ? `${user.firstName} ${user.lastName || ""}`.trim()
      : user?.emailAddresses[0]?.emailAddress || "Unknown";

    // Get notebook to check access
    const notebook = await prisma.notebook.findUnique({
      where: { id: notebookId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
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

    // Create message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        notebookId,
        content: message,
        role: "user",
        authorId: userId,
        authorType: "human",
        authorName: userName,
      },
    });

    // Create notification for other collaborators
    if (notebook.organizationId) {
      // Get all org members except current user
      const isOwner = notebook.userId === userId;
      
      if (!isOwner) {
        // Notify owner
        await prisma.notification.create({
          data: {
            userId: notebook.userId,
            type: "mention",
            title: "New message in notebook",
            message: `${userName}: ${message.substring(0, 50)}${message.length > 50 ? "..." : ""}`,
            link: `/dashboard/${notebookId}`,
            read: false,
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: {
        id: chatMessage.id,
        content: chatMessage.content,
        role: chatMessage.role,
        authorId: chatMessage.authorId,
        authorType: chatMessage.authorType,
        authorName: chatMessage.authorName,
        createdAt: chatMessage.createdAt.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Send message error:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}