import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server"; // ✅ FIXED

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title } = await req.json();

  const notebook = await prisma.notebook.create({
    data: {
      title,
      userId,
    },
  });

  // ✅ Creator becomes admin
  await prisma.notebookCollaborator.create({
    data: {
      notebookId: notebook.id,
      userId,
      role: "admin",
      type: "human",
    },
  });

  return NextResponse.json(notebook);
}
