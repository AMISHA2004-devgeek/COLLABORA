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
    const { title, summary, content, messages } = await req.json();

    console.log("Saving notebook:", { title, hasSummary: !!summary, hasMessages: !!messages }); // 🔍 DEBUG

    // Validate
    if (!title && !summary && !content) {
      return NextResponse.json(
        { error: "Title, summary, or content required" },
        { status: 400 }
      );
    }

    // Create new notebook
    const notebook = await prisma.notebook.create({
      data: {
        title: title || "Untitled Notebook",
        content: content || summary || "",
        summaryText: summary || "",
        userId,
        // Store chat messages if your schema supports it
        // chatMessages: messages || [],
      },
    });

    console.log("Created notebook:", notebook.id); // 🔍 DEBUG

    return NextResponse.json({ 
      success: true, 
      notebook // ✅ Return the whole notebook object
    });

  } catch (error: any) {
    console.error("Save error:", error);
    
    return NextResponse.json(
      { error: "Failed to save notebook", details: error.message },
      { status: 500 }
    );
  }
}