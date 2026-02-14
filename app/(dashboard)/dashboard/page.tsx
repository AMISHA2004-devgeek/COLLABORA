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
import { Plus, ArrowUpRight, Users } from "lucide-react";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Fetch owned notebooks
  const ownedNotebooks = await prisma.notebook.findMany({
    where: { userId: userId },
    orderBy: { updatedAt: "desc" },
  });

  // Fetch shared notebooks (where user is a collaborator)
  const collaborations = await prisma.notebookCollaborator.findMany({
    where: {
      userId: userId,
      status: "active",
      type: "human",
    },
    include: {
      notebook: true,
    },
    orderBy: { joinedAt: "desc" },
  });

  const sharedNotebooks = collaborations
    .filter((c) => c.notebook.userId !== userId) // Exclude notebooks user owns
    .map((c) => ({
      ...c.notebook,
      role: c.role,
      isShared: true,
    }));

  const totalNotebooks = ownedNotebooks.length + sharedNotebooks.length;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Your Notebooks
            </h1>
            <p className="mt-2 text-slate-600">
              {ownedNotebooks.length} owned
              {sharedNotebooks.length > 0 && ` • ${sharedNotebooks.length} shared with you`}
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
            {/* Owned Notebooks */}
            {ownedNotebooks.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                  My Notebooks
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {ownedNotebooks.map((notebook) => (
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

            {/* Shared Notebooks */}
            {sharedNotebooks.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Shared With Me
                </h2>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {sharedNotebooks.map((notebook) => (
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

                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-slate-500">
                              Updated:{" "}
                              {new Date(notebook.updatedAt).toLocaleDateString()}
                            </p>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {notebook.role}
                            </span>
                          </div>
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