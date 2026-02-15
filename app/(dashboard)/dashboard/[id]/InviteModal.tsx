"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { inviteHumanToOrganization, getUserOrganizations } from "./invite-action";

export default function InviteModal({ 
  notebookId, 
  onClose 
}: { 
  notebookId: string; 
  onClose: () => void;
}) {
  const router = useRouter();
  
  const [step, setStep] = useState<"select-org" | "enter-email">("select-org");
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<string>("");
  const [newOrgName, setNewOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  // Load user's organizations
  useEffect(() => {
    async function loadOrgs() {
      try {
        const orgs = await getUserOrganizations();
        setOrganizations(orgs);
      } catch (error) {
        console.error("Failed to load organizations:", error);
      }
    }
    loadOrgs();
  }, []);

  async function handleSendInvite() {
    if (!email.trim()) {
      alert("Please enter an email address");
      return;
    }

    if (!selectedOrg) {
      alert("Please select an organization");
      return;
    }

    setLoading(true);

    try {
      await inviteHumanToOrganization(
        notebookId,
        email,
        selectedOrg,
        selectedOrg === "new" ? newOrgName : undefined
      );

      alert("✅ Invitation sent! They'll receive an email to join the organization.");
      onClose();
      router.refresh();
    } catch (error: any) {
      alert(error.message || "Failed to send invitation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-md space-y-4">
        <h3 className="font-semibold text-lg">Invite Human Collaborator</h3>

        {step === "select-org" && (
          <>
            <p className="text-sm text-gray-600">
              Select which organization to invite them to:
            </p>

            <div className="space-y-2">
              {organizations.map((org) => (
                <label
                  key={org.id}
                  className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="radio"
                    name="organization"
                    value={org.id}
                    checked={selectedOrg === org.id}
                    onChange={(e) => setSelectedOrg(e.target.value)}
                    className="w-4 h-4"
                  />
                  <div>
                    <div className="font-medium">{org.name}</div>
                    <div className="text-xs text-gray-500">Role: {org.role}</div>
                  </div>
                </label>
              ))}

              <label className="flex items-center gap-3 p-3 border rounded cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="organization"
                  value="new"
                  checked={selectedOrg === "new"}
                  onChange={(e) => setSelectedOrg(e.target.value)}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <div className="font-medium flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Organization
                  </div>
                </div>
              </label>

              {selectedOrg === "new" && (
                <input
                  type="text"
                  placeholder="Organization name"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="w-full border rounded p-2 mt-2"
                />
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={onClose}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!selectedOrg) {
                    alert("Please select an organization");
                    return;
                  }
                  if (selectedOrg === "new" && !newOrgName.trim()) {
                    alert("Please enter organization name");
                    return;
                  }
                  setStep("enter-email");
                }}
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
              >
                Next
              </button>
            </div>
          </>
        )}

        {step === "enter-email" && (
          <>
            <p className="text-sm text-gray-600">
              Enter the email address to invite:
            </p>

            <div className="p-3 bg-blue-50 rounded text-sm">
              <strong>Organization:</strong>{" "}
              {selectedOrg === "new"
                ? newOrgName
                : organizations.find((o) => o.id === selectedOrg)?.name}
            </div>

            <input
              type="email"
              placeholder="collaborator@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border rounded p-2"
              autoFocus
            />

            <p className="text-xs text-gray-500">
              💡 They'll receive an email invitation to join the organization and access this notebook.
            </p>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setStep("select-org")}
                className="px-4 py-2 border rounded hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleSendInvite}
                disabled={loading}
                className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}