import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { notebookId, collaboratorUserId } = await req.json();

  const notebook = await prisma.notebook.findFirst({
    where: { id: notebookId },
  });

  if (!notebook)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.notebookCollaborator.create({
    data: {
      notebookId,
      userId: collaboratorUserId,
      type: "human",
      role: "editor",
    },
  });

  await prisma.chatMessage.create({
    data: {
      notebookId,
      content: "A collaborator has joined the notebook.",
      role: "system",
      authorType: "human",
      authorName: "System",
    },
  });

  return NextResponse.json({ success: true });
}
