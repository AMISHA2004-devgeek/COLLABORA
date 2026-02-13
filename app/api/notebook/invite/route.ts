// app/api/notebook/invite/route.ts

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { notebookId, email } = await req.json();

  const existing = await prisma.notebookCollaborator.findFirst({
    where: { notebookId, email },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Already invited or collaborator exists" },
      { status: 400 }
    );
  }

  await prisma.notebookCollaborator.create({
    data: {
      notebookId,
      email,
      role: "editor",
      status: "pending",
      type: "human",
    },
  });

  return NextResponse.json({
    inviteLink: `${process.env.NEXT_PUBLIC_APP_URL}/notebook/${notebookId}`,
  });
}
