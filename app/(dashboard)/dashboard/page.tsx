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
import { Plus, ArrowUpRight, Users, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default async function DashboardPage() {
  const { userId, orgId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // ✅ Fetch personal notebooks (no org) - also include user for consistency
  const personalNotebooks = await prisma.notebook.findMany({
    where: {
      userId: userId,
      organizationId: null,
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

  // ✅ Fetch workspace notebooks (if in org)
  const workspaceNotebooks = orgId
    ? await prisma.notebook.findMany({
        where: {
          organizationId: orgId,
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

  const totalNotebooks = personalNotebooks.length + workspaceNotebooks.length;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              {orgId ? "Workspace Notebooks" : "Your Notebooks"}
            </h1>
            <p className="mt-2 text-slate-600">
              {orgId
                ? `${workspaceNotebooks.length} workspace • ${personalNotebooks.length} personal`
                : `${personalNotebooks.length} notebook${personalNotebooks.length !== 1 ? "s" : ""}`
              }
            </p>
          </div>

          <Link href="/dashboard/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Notebook
            </Button>
          </Link>
        </div>

        {/* Empty State */}
        {totalNotebooks === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="mb-4 rounded-lg bg-slate-100 p-3">
                <Plus className="h-8 w-8 text-slate-600" />
              </div>
              <h2 className="mb-2 text-lg font-semibold text-slate-900">
                No notebooks yet
              </h2>
              <p className="mb-6 text-center text-slate-600">
                Create your first notebook to get started
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Workspace Notebooks */}
            {workspaceNotebooks.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Workspace
                  <Badge variant="secondary">{workspaceNotebooks.length}</Badge>
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {workspaceNotebooks.map((notebook) => (
                    <Link
                      key={notebook.id}
                      href={`/dashboard/${notebook.id}`}
                      className="group"
                    >
                      <Card className="hover:shadow-md transition cursor-pointer relative border-l-4 border-l-blue-500">
                        <CardHeader>
                          <div className="absolute top-4 right-4 text-gray-400 group-hover:text-gray-700 transition-colors">
                            <ArrowUpRight className="h-5 w-5" />
                          </div>

                          <CardTitle className="pr-8">{notebook.title}</CardTitle>

                          <CardDescription>
                            {notebook.description || "No description"}
                          </CardDescription>

                          <div className="flex items-center justify-between mt-3">
                            <p className="text-xs text-slate-500">
                              {new Date(notebook.updatedAt).toLocaleDateString()}
                            </p>
                            {notebook.userId === userId ? (
                              <Badge>Owner</Badge>
                            ) : (
                              <div className="text-xs text-gray-600">
                                by {notebook.user.name || notebook.user.email}
                              </div>
                            )}
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Personal Notebooks */}
            {personalNotebooks.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Personal
                  <Badge variant="secondary">{personalNotebooks.length}</Badge>
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {personalNotebooks.map((notebook) => (
                    <Link
                      key={notebook.id}
                      href={`/dashboard/${notebook.id}`}
                      className="group"
                    >
                      <Card className="hover:shadow-md transition cursor-pointer relative">
                        <CardHeader>
                          <div className="absolute top-4 right-4 text-gray-400 group-hover:text-gray-700 transition-colors">
                            <ArrowUpRight className="h-5 w-5" />
                          </div>

                          <CardTitle className="pr-8">{notebook.title}</CardTitle>

                          <CardDescription>
                            {notebook.description || "No description"}
                          </CardDescription>

                          <p className="text-xs text-slate-500 mt-2">
                            Updated:{" "}
                            {new Date(notebook.updatedAt).toLocaleDateString()}
                          </p>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}