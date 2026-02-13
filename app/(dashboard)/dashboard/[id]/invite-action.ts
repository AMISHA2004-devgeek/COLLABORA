"use server";

import { clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function inviteHuman(
  notebookId: string,
  email: string
) {
  try {
    // Validate inputs
    if (!email || !notebookId) {
      throw new Error("Email and notebook ID are required");
    }

    // ✅ Auto-detect the correct URL based on environment
    let baseUrl = 'http://localhost:3000';
    
    try {
      if (process.env.NEXT_PUBLIC_APP_URL) {
        baseUrl = process.env.NEXT_PUBLIC_APP_URL;
      } else if (process.env.VERCEL_URL) {
        baseUrl = `https://${process.env.VERCEL_URL}`;
      }
    } catch (urlError) {
      console.warn("⚠️ Could not determine base URL, using localhost");
    }

    // Remove trailing slash from baseUrl to prevent double slashes
    baseUrl = baseUrl.replace(/\/$/, '');
    
    const redirectUrl = `${baseUrl}/notebook/${notebookId}`;

    
    console.log("=" .repeat(60));
    console.log("🚀 INVITATION ATTEMPT");
    console.log("Email:", email);
    console.log("Notebook ID:", notebookId);
    console.log("Redirect URL:", redirectUrl);
    console.log("Environment:", process.env.NODE_ENV);
    console.log("=" .repeat(60));

    // Get Clerk client
    const client = await clerkClient();

    // Send Clerk invitation (even if user exists)
    const invitation = await client.invitations.createInvitation({
      emailAddress: email,
      redirectUrl,
      ignoreExisting: true, // ✅ Allow inviting existing users
    });
    
    console.log("✅ Clerk invitation created successfully!");
    console.log("Invitation ID:", invitation.id);
    console.log("Status:", invitation.status);

    // Store in database
    const collaborator = await prisma.notebookCollaborator.create({
      data: {
        notebookId,
        email,
        type: "human",
        role: "editor",
        status: "pending",
      },
    });

    console.log("✅ Database record created");
    console.log("Collaborator ID:", collaborator.id);
    console.log("=" .repeat(60));

    return { success: true, invitationId: invitation.id };
    
  } catch (error: any) {
    console.error("=" .repeat(60));
    console.error("❌ INVITATION ERROR");
    console.error("Error type:", error?.constructor?.name || "Unknown");
    console.error("Error message:", error?.message || "No message");
    console.error("Error status:", error?.status || "No status");
    
    // Try to extract Clerk-specific errors
    if (error?.errors && Array.isArray(error.errors)) {
      console.error("Clerk error details:");
      error.errors.forEach((err: any, i: number) => {
        console.error(`  [${i}]`, {
          code: err?.code,
          message: err?.message,
          longMessage: err?.longMessage,
        });
      });
    }
    
    console.error("=" .repeat(60));
    
    // Return user-friendly error message
    let userMessage = "Failed to send invitation. ";
    
    if (error?.errors && Array.isArray(error.errors) && error.errors.length > 0) {
      userMessage += error.errors[0]?.longMessage || error.errors[0]?.message || error.message;
    } else if (error?.message) {
      userMessage += error.message;
    } else {
      userMessage += "Please check the server logs for details.";
    }
    
    throw new Error(userMessage);
  }
}