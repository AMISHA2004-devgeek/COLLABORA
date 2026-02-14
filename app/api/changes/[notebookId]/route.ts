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
    const changes = await prisma.proposedChange.findMany({
      where: { notebookId: params.notebookId },
      include: { proposer: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, changes });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch changes" }, { status: 500 });
  }
}