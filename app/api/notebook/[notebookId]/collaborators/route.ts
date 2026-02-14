import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { notebookId: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get all collaborators (active, pending, agents)
    const collaborators = await prisma.notebookCollaborator.findMany({
      where: { notebookId: params.notebookId },
      include: { user: true },
      orderBy: { createdAt: "asc" },
    });

    // Get pending invites
    const pendingInvites = await prisma.collaborationInvite.findMany({
      where: {
        notebookId: params.notebookId,
        status: "pending",
      },
      include: { receiver: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      collaborators,
      pendingInvites,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch collaborators" },
      { status: 500 }
    );
  }
}