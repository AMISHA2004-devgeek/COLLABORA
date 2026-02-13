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
import { Plus, ArrowUpRight } from "lucide-react"; // ✅ Add ArrowUpRight

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const safeUserId = userId;

  const notebooks = await prisma.notebook.findMany({
    where: { userId: safeUserId },
    orderBy: { createdAt: "desc" },
  });

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
              Create and manage your research notebooks
            </p>
          </div>

          <Link href="/dashboard/new">
            <Button size="lg" className="gap-2">
              <Plus className="h-4 w-4" />
              Create Notebook
            </Button>
          </Link>
        </div>

        {/* Notebook List */}
        {notebooks.length === 0 ? (
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {notebooks.map((notebook) => (
              <Link
                key={notebook.id}
                href={`/dashboard/${notebook.id}`}
                className="group"
              >
                <Card className="hover:shadow-md transition cursor-pointer relative">
                  <CardHeader>
                    {/* ✅ Arrow Icon - Top Right */}
                    <div className="absolute top-4 right-4 text-gray-400 group-hover:text-gray-700 transition-colors">
                      <ArrowUpRight className="h-5 w-5" />
                    </div>

                    <CardTitle className="pr-8">{notebook.title}</CardTitle>

                    <CardDescription>
                      {notebook.description || "No description"}
                    </CardDescription>

                    <p className="text-xs text-slate-500 mt-2">
                      Created:{" "}
                      {new Date(notebook.createdAt).toLocaleString()}
                    </p>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}