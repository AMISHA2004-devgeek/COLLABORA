import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { id, title, description, summary, messages } = await req.json();

    if (!id) {
      return NextResponse.json(
        { error: "Notebook ID required" },
        { status: 400 }
      );
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (summary !== undefined) updateData.summaryText = summary;
    if (messages !== undefined) updateData.chatMessages = messages; // ✅ Save as JSON

    console.log("Updating notebook with:", updateData); // Debug log

    const notebook = await prisma.notebook.update({
      where: {
        id,
        userId,
      },
      data: updateData,
    });

    console.log("Notebook updated successfully"); // Debug log

    return NextResponse.json({ 
      success: true, 
      notebook 
    });

  } catch (error: any) {
    console.error("Update error:", error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: "Notebook not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to update notebook" },
      { status: 500 }
    );
  }
}