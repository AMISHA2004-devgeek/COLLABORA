import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Plus, ArrowUpRight, Crown, Users, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { InviteToOrganization } from "@/components/invite-to-organization";

export default async function DashboardPage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch notebooks owned by user
  const ownedNotebooks = await prisma.notebook.findMany({
    where: {
      userId: userId,
    },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Fetch notebooks user is collaborating on (in same org, but not owner)
  const collaboratingNotebooks = orgId
    ? await prisma.notebook.findMany({
        where: {
          organizationId: orgId,
          userId: { not: userId }, // Not owned by current user
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {orgId ? "Workspace" : "Your Notebooks"}
            </h1>
            <p className="mt-2 text-slate-600">
              {ownedNotebooks.length} owned • {collaboratingNotebooks.length} collaborating
            </p>
          </div>

          <Link href="/dashboard/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Notebook
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content - 3 columns */}
          <div className="lg:col-span-3 space-y-8">
            {/* Owned Notebooks */}
            <div>
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                You Own
                <Badge variant="secondary">{ownedNotebooks.length}</Badge>
              </h2>
              {ownedNotebooks.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-gray-500">No notebooks yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {ownedNotebooks.map((notebook) => (
                    <Link
                      key={notebook.id}
                      href={`/dashboard/${notebook.id}`}
                      className="group"
                    >
                      <Card className="hover:shadow-md transition cursor-pointer relative">
                        <CardHeader>
                          <div className="absolute top-4 right-4 text-gray-400 group-hover:text-gray-700">
                            <ArrowUpRight className="h-5 w-5" />
                          </div>
                          <CardTitle className="pr-8">{notebook.title}</CardTitle>
                          <CardDescription>
                            {notebook.description || "No description"}
                          </CardDescription>
                          <div className="flex items-center gap-2 mt-2">
                            <p className="text-xs text-slate-500">
                              {new Date(notebook.updatedAt).toLocaleDateString()}
                            </p>
                            {notebook.organizationId && (
                              <Badge variant="outline" className="text-xs">
                                <Building2 className="h-3 w-3 mr-1" />
                                Workspace
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Collaborating Notebooks */}
            {collaboratingNotebooks.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-500" />
                  You're Collaborating On
                  <Badge variant="secondary">{collaboratingNotebooks.length}</Badge>
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {collaboratingNotebooks.map((notebook) => (
                    <Link
                      key={notebook.id}
                      href={`/dashboard/${notebook.id}`}
                      className="group"
                    >
                      <Card className="hover:shadow-md transition cursor-pointer relative border-l-4 border-l-blue-500">
                        <CardHeader>
                          <div className="absolute top-4 right-4 text-gray-400 group-hover:text-gray-700">
                            <ArrowUpRight className="h-5 w-5" />
                          </div>
                          <CardTitle className="pr-8">{notebook.title}</CardTitle>
                          <CardDescription>
                            {notebook.description || "No description"}
                          </CardDescription>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-slate-500">
                              {new Date(notebook.updatedAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-600">
                              by {notebook.user.name || notebook.user.email}
                            </p>
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - 1 column */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Team Management</CardTitle>
              </CardHeader>
              <CardContent>
                <InviteToOrganization />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}