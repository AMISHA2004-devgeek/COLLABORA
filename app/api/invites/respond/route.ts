import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
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

    const { inviteId, action } = await request.json();

    if (!inviteId || !action) {
      return NextResponse.json(
        { error: "Missing inviteId or action" },
        { status: 400 }
      );
    }

    // Find the invitation
    const invite = await prisma.collaborationInvite.findUnique({
      where: { id: inviteId },
      include: {
        notebook: true,
        sender: true,
      },
    });

    if (!invite) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Update invitation status
    const updatedInvite = await prisma.collaborationInvite.update({
      where: { id: inviteId },
      data: {
        status: action === "accept" ? "accepted" : "declined",
        receiverId: userId,
      },
    });

    // If accepted, create notification for sender
    if (action === "accept") {
      await prisma.notification.create({
        data: {
          userId: invite.senderId,
          type: "invite_accepted",
          title: "Invitation Accepted",
          message: `${invite.receiverEmail} accepted your invitation to collaborate on: ${invite.notebook.title}`,
          link: `/dashboard/${invite.notebookId}`,
        },
      });
    } else {
      // If declined, notify sender
      await prisma.notification.create({
        data: {
          userId: invite.senderId,
          type: "invite_declined",
          title: "Invitation Declined",
          message: `${invite.receiverEmail} declined your invitation to: ${invite.notebook.title}`,
          link: `/dashboard/${invite.notebookId}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      invite: updatedInvite,
    });
  } catch (error: any) {
    console.error("Error responding to invite:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process invitation" },
      { status: 500 }
    );
  }
}