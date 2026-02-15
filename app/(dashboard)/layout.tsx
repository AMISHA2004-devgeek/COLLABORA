import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { NotificationsPanel } from "@/components/notifications-panel";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <a href="/dashboard" className="text-2xl font-bold">
                COLLABORA
              </a>
            </div>

            {/* Center - Organization Switcher */}
            <div className="flex-1 flex justify-center">
              <OrganizationSwitcher
                hidePersonal={false}
                afterCreateOrganizationUrl="/dashboard"
                afterSelectOrganizationUrl="/dashboard"
                afterLeaveOrganizationUrl="/dashboard"
                createOrganizationMode="navigation"
                createOrganizationUrl="/organizations/create"
                organizationProfileMode="navigation"
                organizationProfileUrl="/organizations/:id"
                appearance={{
                  elements: {
                    rootBox: "flex items-center",
                    organizationSwitcherTrigger: 
                      "border rounded-lg px-4 py-2 hover:bg-gray-50 flex items-center gap-2",
                  },
                }}
              />
            </div>

            {/* Right side */}
            <div className="flex items-center gap-4">
              <NotificationsPanel />
              <UserButton 
                afterSignOutUrl="/sign-in"
                appearance={{
                  elements: {
                    avatarBox: "h-10 w-10"
                  }
                }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>{children}</main>
    </div>
  );
}