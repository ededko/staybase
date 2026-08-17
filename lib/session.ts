import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function requireSession() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Необхідно увійти в систему");
  return session;
}

export async function requireWorkspace() {
  const session = await requireSession();
  const membership = await prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });

  if (!membership) throw new Error("Робочий простір не знайдено");

  return {
    session,
    workspace: membership.workspace,
    role: membership.role,
  };
}
