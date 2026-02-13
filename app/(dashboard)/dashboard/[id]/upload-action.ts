"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";


import mammoth from "mammoth";
import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});


export async function uploadAndSummarize(
  notebookId: string,
  formData: FormData
) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const file = formData.get("file") as File;
  if (!file) return;

  const buffer = Buffer.from(await file.arrayBuffer());

  let extractedText = "";
if (file.type === "application/pdf") {
  const pdf = (await import("pdf-parse")).default;
  const data = await pdf(buffer);
  extractedText = data.text;
}



  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    extractedText = result.value;
  }

  // 🔥 AI Summarization
const summary = await groq.chat.completions.create({
  model: "llama-3.3-70b-versatile",
  messages: [
    {
      role: "system",
      content:
        "Summarize this academic/research document clearly and structurally.",
    },
    {
      role: "user",
      content: extractedText.slice(0, 12000),
    },
  ],
});


  const summaryText = summary.choices[0].message.content || "";

  // 🔐 Ownership validation
  const notebook = await prisma.notebook.findFirst({
    where: {
      id: notebookId,
      userId,
    },
  });

  if (!notebook) redirect("/dashboard");

  await prisma.notebook.update({
    where: { id: notebookId },
    data: {
      originalText: extractedText,
      summaryText,
      content: summaryText,
    },
  });

  redirect(`/dashboard/${notebookId}`);
}








































