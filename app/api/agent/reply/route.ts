import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { notebookId, changeId, message } = await req.json();

    // Get the change to find which agent proposed it
    const change = await prisma.proposedChange.findUnique({
      where: { id: changeId },
    });

    if (!change) {
      return NextResponse.json(
        { error: "Change not found" },
        { status: 404 }
      );
    }

    // Extract agent name from reason (e.g., "[Media Content Strategist] ...")
    const agentMatch = change.reason?.match(/\[(.*?)\]/);
    const agentName = agentMatch ? agentMatch[1] : "AI Agent";

    // Log reply in chat
    await prisma.chatMessage.createMany({
      data: [
        {
          notebookId,
          role: "user",
          content: `Reply to ${agentName} about Line ${change.lineNumber + 1}:\n${message}`,
          authorType: "human",
          authorId: userId,
        },
        {
          notebookId,
          role: "assistant",
          content: `Acknowledged. I'll revise the suggestion for Line ${change.lineNumber + 1}.`,
          authorType: "agent",
          authorName: agentName,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: "Reply sent to agent",
    });
  } catch (error: any) {
    console.error("Reply error:", error);
    return NextResponse.json(
      { error: "Failed to send reply" },
      { status: 500 }
    );
  }
}