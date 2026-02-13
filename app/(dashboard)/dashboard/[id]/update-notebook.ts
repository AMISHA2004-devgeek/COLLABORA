"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function updateNotebook(
  notebookId: string,
  formData: FormData
) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const title = formData.get("title") as string;
  const content = formData.get("content") as string;

  await prisma.notebook.update({
    where: {
      id: notebookId,
      userId,
    },
    data: {
      title,
      content,
    },
  });

  // 🔥 Redirect to dashboard after saving
  redirect("/dashboard");
}
