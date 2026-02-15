import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { notebookId, email, organizationId, message } = await request.json();

    if (!notebookId || !email || !organizationId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user owns the notebook
    const notebook = await prisma.notebook.findUnique({
      where: { id: notebookId },
    });

    if (!notebook || notebook.userId !== userId) {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const client = await clerkClient();

    // Build redirect URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const redirectUrl = `${baseUrl}/accept-invite?notebook=${notebookId}&org=${organizationId}`;

    // Send Clerk organization invitation
    const clerkInvite = await client.organizations.createOrganizationInvitation({
      organizationId,
      emailAddress: email,
      role: "org:member",
      redirectUrl,
    });

    // Store in database
    const invite = await prisma.collaborationInvite.create({
      data: {
        notebookId,
        senderId: userId,
        receiverEmail: email,
        message: message || `You've been invited to collaborate on a notebook`,
        status: "pending",
      },
    });

    return NextResponse.json({
      success: true,
      invite,
      clerkInviteId: clerkInvite.id,
    });
  } catch (error: any) {
    console.error("Error sending invite:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send invitation" },
      { status: 500 }
    );
  }
}