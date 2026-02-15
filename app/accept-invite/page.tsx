import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: { notebook: string; org: string };
}) {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/sign-in");
  }

  const { notebook: notebookId, org: organizationId } = searchParams;

  if (!notebookId || !organizationId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Invitation</h1>
          <p className="text-gray-600">Missing notebook or organization information.</p>
        </div>
      </div>
    );
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const userEmail = user.emailAddresses[0]?.emailAddress;

    // Check if user is already in the organization
    const memberships = await client.users.getOrganizationMembershipList({
      userId,
    });

    const isMember = memberships.data.some(
      (m) => m.organization.id === organizationId
    );

    if (!isMember) {
      // User needs to accept the organization invitation first
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-2xl font-bold mb-4">Join Organization</h1>
            <p className="text-gray-600 mb-6">
              You've been invited to join an organization. Please check your email
              for the Clerk invitation and accept it first.
            </p>
            <a
              href={`https://accounts.clerk.dev/sign-in?redirect_url=${encodeURIComponent(
                window.location.href
              )}`}
              className="block w-full bg-black text-white text-center py-2 rounded hover:bg-gray-800"
            >
              Check Email & Sign In
            </a>
          </div>
        </div>
      );
    }

    // User is in the organization - update invite status
    if (userEmail) {
      await prisma.collaborationInvite.updateMany({
        where: {
          notebookId,
          receiverEmail: userEmail,
          status: "pending",
        },
        data: {
          receiverId: userId,
          status: "accepted",
        },
      });
    }

    // Create notification for the notebook owner
    const notebook = await prisma.notebook.findUnique({
      where: { id: notebookId },
      select: { userId: true, title: true },
    });

    if (notebook) {
      await prisma.notification.create({
        data: {
          userId: notebook.userId,
          type: "collaboration_accepted",
          title: "Collaborator Joined",
          message: `${userEmail} has joined your notebook: ${notebook.title}`,
          link: `/dashboard/${notebookId}`,
        },
      });
    }

    console.log("✅ User accepted invite and joined:", {
      userId,
      notebookId,
      organizationId,
    });

    // Redirect to the notebook
    redirect(`/dashboard/${notebookId}`);
  } catch (error: any) {
    console.error("Error accepting invite:", error);
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">
            Failed to process invitation: {error.message}
          </p>
          <a
            href="/dashboard"
            className="block w-full bg-black text-white text-center py-2 rounded hover:bg-gray-800"
          >
            Go to Dashboard
          </a>
        </div>
      </div>
    );
  }
}