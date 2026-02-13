import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: { notebookId?: string };
}) {
  const user = await currentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const notebookId = searchParams?.notebookId;

  if (!notebookId) {
    redirect("/dashboard");
  }

  // ✅ SAFELY get primary email
  const email = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId
  )?.emailAddress;

  if (!email) {
    redirect("/dashboard");
  }

  const invite = await prisma.notebookCollaborator.findFirst({
    where: {
      notebookId,
      email,
      status: "pending",
      type: "human",
    },
  });

  if (!invite) {
    redirect(`/dashboard/${notebookId}`);
  }

  await prisma.notebookCollaborator.update({
    where: { id: invite.id },
    data: {
      userId: user.id,
      status: "active",
      email: null,
    },
  });

  redirect(`/dashboard/${notebookId}`);
}
