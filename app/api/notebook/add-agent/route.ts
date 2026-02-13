import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const agentPrompts = {
  technical: "You are a senior technical expert...",
  poetic: "You rewrite things poetically...",
  teacher: "You explain things like a teacher...",
  philosophical: "You analyze deeply and philosophically...",
  medical: "You analyze medically with precision..."
};

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { notebookId, agentType } = await req.json();

  const agentName = `${agentType}-Agent-${Math.floor(Math.random()*1000)}`;

  await prisma.notebookCollaborator.create({
    data: {
      notebookId,
      type: "agent",
      role: "editor",
      agentType,
      agentName,
    },
  });

  await prisma.chatMessage.create({
    data: {
      notebookId,
      content: `${agentName} has entered the chat.`,
      role: "system",
      authorType: "agent",
      authorName: agentName,
    },
  });

  return NextResponse.json({ success: true });
}
