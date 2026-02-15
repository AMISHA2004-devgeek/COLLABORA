import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

// GET - Fetch highlights for a notebook
export async function GET(
  req: Request,
  { params }: { params: { notebookId: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // For now, we return highlights from proposed changes
    // You could create a separate "highlights" table if needed
    const changes = await prisma.proposedChange.findMany({
      where: {
        notebookId: params.notebookId,
        status: "pending",
      },
      include: {
        proposer: {
          select: {
            email: true,
            name: true,
          },
        },
      },
      orderBy: { lineNumber: "asc" },
    });

    // Convert to highlights format
    const highlights = changes.map((c) => ({
      lineNumber: c.lineNumber,
      type: c.reason?.includes("grammar")
        ? "grammar"
        : c.reason?.includes("spelling")
        ? "spelling"
        : "improvement",
      originalText: c.originalText,
      issue: c.reason || "Needs improvement",
      severity: 0.7,
    }));

    return NextResponse.json({
      success: true,
      highlights,
    });
  } catch (error) {
    console.error("Get highlights error:", error);
    return NextResponse.json(
      { error: "Failed to fetch highlights" },
      { status: 500 }
    );
  }
}