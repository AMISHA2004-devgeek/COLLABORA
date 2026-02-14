import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const invites = await prisma.collaborationInvite.findMany({
      where: {
        receiverId: userId,
        status: "pending",
      },
      include: {
        sender: true,
        notebook: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, invites });
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch invites" }, { status: 500 });
  }
}