import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
  params: { id: string };
}

export default async function NotebookLayout({
  children,
  params,
}: LayoutProps) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const notebook = await prisma.notebook.findUnique({
    where: { id: params.id },
  });

  if (!notebook) {
    notFound();
  }

  // Owner
  if (notebook.userId === user.id) {
    return <>{children}</>;
  }

  // Collaborator
  const collaborator = await prisma.notebookCollaborator.findFirst({
    where: {
      notebookId: params.id,
      userId: user.id,
      status: "active",
    },
  });

  if (!collaborator) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
