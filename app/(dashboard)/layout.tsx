import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";

import { NotificationsPanel } from "@/components/notifications-panel";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "COLLABORA",
  description: "Manage your notebooks",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left Side - Logo */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">
              COLLABORA
            </h1>
          </div>

          {/* Right Side - Controls */}
          <div className="flex items-center gap-4">
            {/* Organization Switcher */}
            <OrganizationSwitcher
              afterCreateOrganizationUrl="/dashboard"
              afterSelectOrganizationUrl="/dashboard"
              afterLeaveOrganizationUrl="/dashboard"
              appearance={{
                elements: {
                  rootBox: "flex items-center",
                  organizationSwitcherTrigger:
                    "border rounded-lg px-3 py-2 hover:bg-gray-50 text-sm",
                },
              }}
            />

            {/* Notifications */}
            <NotificationsPanel />

            {/* New Notebook Button */}
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                New Notebook
              </Button>
            </Link>

            {/* User Avatar */}
            <UserButton
              afterSignOutUrl="/sign-in"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 bg-slate-50">
        {children}
      </main>
    </div>
  );
}
