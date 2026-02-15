import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { analyzeWithAgent } from "@/lib/agent-processor";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { notebookId, agentId } = await req.json();

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

    // Verify user has access
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

    if (!notebook.summaryText) {
      return NextResponse.json(
        { error: "No summary to analyze" },
        { status: 400 }
      );
    }

    // Get agent info
    const agent = await prisma.notebookCollaborator.findFirst({
      where: {
        notebookId,
        type: "agent",
        status: "active",
      },
    });

    const agentName = agent?.agentName || "AI Agent";

    // Log analysis start
    await prisma.chatMessage.create({
      data: {
        notebookId,
        role: "system",
        content: `${agentName} is analyzing the summary...`,
        authorType: "agent",
        authorName: agentName,
      },
    });

    // Run AI analysis
    const analysis = await analyzeWithAgent(
      agentId as any,
      notebook.summaryText
    );

    // Store highlights in a temporary table or return them
    // For now, we'll just create ProposedChanges if there are suggestions

    if (analysis.suggestions.length > 0) {
      // Auto-create proposed changes from agent suggestions
      await prisma.proposedChange.createMany({
        data: analysis.suggestions.map((s) => ({
          notebookId,
          proposerId: userId,
          lineNumber: s.lineNumber,
          originalText: s.originalText,
          proposedText: s.proposedText,
          reason: `[${agentName}] ${s.reason}`,
          status: "pending",
        })),
      });
    }

    // Log analysis completion
    await prisma.chatMessage.create({
      data: {
        notebookId,
        role: "system",
        content: `${agentName} completed analysis:\n✓ ${analysis.highlights.length} issues found\n✓ ${analysis.suggestions.length} suggestions created`,
        authorType: "agent",
        authorName: agentName,
      },
    });

    // Create notification for owner
    if (notebook.userId !== userId) {
      await prisma.notification.create({
        data: {
          userId: notebook.userId,
          type: "change_proposed",
          title: `${agentName} Analysis Complete`,
          message: `${analysis.suggestions.length} suggestions created`,
          link: `/dashboard/${notebookId}/changes`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      highlights: analysis.highlights,
      suggestions: analysis.suggestions,
      agentName,
    });
  } catch (error: any) {
    console.error("Agent analyze error:", error);
    return NextResponse.json(
      { error: error.message || "Analysis failed" },
      { status: 500 }
    );
  }
}