"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function inviteHumanToOrganization(
  notebookId: string,
  email: string,
  organizationId: string, // ✅ NEW: Organization to invite to
  organizationName?: string // For new orgs
) {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Not authenticated");

    // Validate inputs
    if (!email || !notebookId || !organizationId) {
      throw new Error("Email, notebook ID, and organization are required");
    }

    const client = await clerkClient();

    // Check if creating new organization
    if (organizationId === "new" && organizationName) {
      console.log("🏢 Creating new organization:", organizationName);
      
      const newOrg = await client.organizations.createOrganization({
        name: organizationName,
        createdBy: userId,
      });
      
      organizationId = newOrg.id;
      console.log("✅ Organization created:", organizationId);

      // Update notebook with organization
      await prisma.notebook.update({
        where: { id: notebookId },
        data: { organizationId: newOrg.id },
      });
    }

    // Build redirect URL
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    baseUrl = baseUrl.replace(/\/$/, '');
    const redirectUrl = `${baseUrl}/accept-invite?notebook=${notebookId}&org=${organizationId}`;
    
    console.log("=" .repeat(60));
    console.log("🚀 ORGANIZATION INVITATION");
    console.log("Email:", email);
    console.log("Notebook:", notebookId);
    console.log("Organization:", organizationId);
    console.log("Redirect:", redirectUrl);
    console.log("=" .repeat(60));

    // Send Clerk organization invitation
    const invitation = await client.organizations.createOrganizationInvitation({
      organizationId,
      emailAddress: email,
      role: "org:member", // Can be: org:admin, org:member
      redirectUrl,
    });
    
    console.log("✅ Clerk org invitation sent!");
    console.log("Invitation ID:", invitation.id);

    // Store in database
    const invite = await prisma.collaborationInvite.create({
      data: {
        notebookId,
        senderId: userId,
        receiverEmail: email,
        message: `Join our organization to collaborate on: ${notebookId}`,
        status: "pending",
      },
    });

    console.log("✅ Database invite record created");
    console.log("Invite ID:", invite.id);
    console.log("=" .repeat(60));

    return { 
      success: true, 
      invitationId: invitation.id,
      organizationId,
    };
    
  } catch (error: any) {
    console.error("❌ INVITATION ERROR:", error.message);
    
    if (error?.errors) {
      console.error("Clerk errors:", error.errors);
    }
    
    throw new Error(error.message || "Failed to send invitation");
  }
}

// Get user's organizations
export async function getUserOrganizations() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Not authenticated");

    const client = await clerkClient();
    
    // Get organizations where user is a member
    const memberships = await client.users.getOrganizationMembershipList({
      userId,
    });

    return memberships.data.map((membership) => ({
      id: membership.organization.id,
      name: membership.organization.name,
      role: membership.role,
    }));
  } catch (error: any) {
    console.error("Error fetching organizations:", error);
    return [];
  }
}