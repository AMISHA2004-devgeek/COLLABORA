"use client";

import { useState } from "react";
import { useOrganization } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Send, X, Loader2, ExternalLink } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function InviteToOrganization() {
  const { organization, invitations, memberships } = useOrganization({
    invitations: {
      pageSize: 20,
      keepPreviousData: true,
    },
    memberships: {
      pageSize: 20,
      keepPreviousData: true,
    },
  });

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const handleInvite = async () => {
    if (!email || !organization) return;

    setSending(true);
    try {
      await organization.inviteMember({
        emailAddress: email,
        role: "org:member",
      });

      setEmail("");
      setOpen(false);
      alert(`Invitation sent to ${email}!`);
    } catch (error: any) {
      console.error("Invite error:", error);
      alert(error.errors?.[0]?.message || "Failed to send invite");
    } finally {
      setSending(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!organization || !confirm("Remove this member from the workspace?")) return;

    try {
      await organization.removeMember(userId);
      alert("Member removed successfully!");
    } catch (error) {
      console.error("Remove error:", error);
      alert("Failed to remove member");
    }
  };

  if (!organization) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg">
        <p className="text-gray-600 mb-4">
          Create or join a workspace to collaborate
        </p>
        <p className="text-sm text-gray-500">
          Use the organization switcher above to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invite Section */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button className="w-full">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite to Workspace
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite People to {organization.name}</DialogTitle>
            <DialogDescription>
              Send an email invitation to join your workspace
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Input
                type="email"
                placeholder="colleague@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && email) {
                    handleInvite();
                  }
                }}
              />
            </div>
            <Button
              onClick={handleInvite}
              disabled={!email || sending}
              className="w-full"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Members List */}
      <div>
        <h3 className="font-semibold mb-3">
          Members ({memberships?.count || 0})
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {memberships?.data?.map((membership) => {
            const userData = membership.publicUserData;
            if (!userData) return null;

            return (
              <div
                key={membership.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {userData.identifier?.[0]?.toUpperCase() || "?"}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">
                      {userData.firstName && userData.lastName
                        ? `${userData.firstName} ${userData.lastName}`
                        : userData.identifier}
                    </p>
                    <p className="text-xs text-gray-600">
                      {userData.identifier}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={membership.role === "org:admin" ? "default" : "secondary"}>
                    {membership.role === "org:admin" ? "Admin" : "Member"}
                  </Badge>
                  {membership.role !== "org:admin" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveMember(userData.userId || "")}
                      title="Remove member"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {(!memberships?.data || memberships.data.length === 0) && (
            <p className="text-sm text-gray-500 text-center py-4">
              No members yet
            </p>
          )}
        </div>
      </div>

      {/* Pending Invitations - View Only */}
      {invitations && invitations.count && invitations.count > 0 && (
        <div>
          <h3 className="font-semibold mb-3">
            Pending Invitations ({invitations.count})
          </h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {invitations.data?.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-3 bg-yellow-50 rounded border border-yellow-200"
              >
                <div>
                  <p className="font-medium">{invitation.emailAddress}</p>
                  <p className="text-xs text-gray-600">
                    Invited {new Date(invitation.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="outline" className="text-yellow-700">
                  Pending
                </Badge>
              </div>
            ))}
          </div>
          
          {/* Manage via Clerk Dashboard */}
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded text-xs">
            <p className="text-blue-900 mb-2">
              💡 To revoke invitations, visit your organization settings
            </p>
            <a
              href={`https://dashboard.clerk.com`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 underline flex items-center gap-1"
            >
              Manage in Clerk Dashboard
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      )}

      {/* Help Text */}
      <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
        <p>💡 <strong>Tip:</strong> Invited users will receive an email with a link to join your workspace.</p>
      </div>
    </div>
  );
}