import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const messages = await prisma.chatMessage.findMany({
      where: { 
        notebookId: params.id,
        notebook: {
          userId: userId
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json({ 
      success: true, 
      messages 
    });

  } catch (error: any) {
    console.error("Fetch messages error:", error);
    
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}