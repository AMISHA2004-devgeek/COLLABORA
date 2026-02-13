"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createNotebook(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;

  await prisma.notebook.create({
    data: {
      title: title || "Untitled",
      description: description || "",
      userId,
    },
  });
}
