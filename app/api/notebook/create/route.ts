import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { userId, orgId } = await auth(); // ✅ Get both userId and orgId

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { title, description } = await req.json();

    const notebook = await prisma.notebook.create({
      data: {
        title: title || "Untitled Notebook",
        description: description || "",
        userId,
        organizationId: orgId || null, // ✅ Assign to org if in org context
      },
    });

    return NextResponse.json({
      success: true,
      notebook,
    });
  } catch (error: any) {
    console.error("Create notebook error:", error);
    return NextResponse.json(
      { error: "Failed to create notebook" },
      { status: 500 }
    );
  }
}