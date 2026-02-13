import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { uploadAndSummarize } from "./upload-action";
import NotebookEditor from "./NotebookEditor";


interface NotebookPageProps {
  params: {
    id: string;
  };
}

export default async function NotebookPage({
  params,
}: NotebookPageProps) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // 🔐 Secure ownership validation
  const notebook = await prisma.notebook.findFirst({
    where: {
      id: params.id,
      userId, // critical security check
    },
  });

  if (!notebook) {
    // Either notebook doesn't exist OR user doesn't own it
    notFound();
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">
              {notebook.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
  <NotebookEditor notebook={notebook} />
</CardContent>


        </Card>
      </div>
    </div>
  );
}
