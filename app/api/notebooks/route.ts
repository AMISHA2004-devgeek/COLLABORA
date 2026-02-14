import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [notebooks, collaborations] = await Promise.all([
      prisma.notebook.findMany({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.notebookCollaborator.findMany({
        where: {
          userId,
          status: "active",
        },
        include: { notebook: true },
        orderBy: { joinedAt: "desc" },
      }),
    ]);

    return NextResponse.json({ success: true, notebooks, collaborations });
  } catch (error) {
    console.error("Failed to fetch notebooks:", error);
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}