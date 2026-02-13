import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  // ✅ FIX: await auth()
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json(
      { error: "Notebook ID required" },
      { status: 400 }
    );
  }

  // 🔐 Security: ensure user owns notebook
  await prisma.notebook.deleteMany({
    where: {
      id,
      userId,
    },
  });

  return NextResponse.json({ success: true });
}
