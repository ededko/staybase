import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cache } from "react";

export const getCurrentSession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  return session;
});

export async function requireSession() {
  const session = await getCurrentSession();
  if (!session) throw new Error("Необхідно увійти в систему");
  return session;
}

export const getWorkspaceMembership = cache(async () => {
  const session = await getCurrentSession();
  if (!session) return null;
  return prisma.workspaceMember.findFirst({
    where: { userId: session.user.id },
    include: { workspace: true },
    orderBy: { createdAt: "asc" },
  });
});

export const requireWorkspace = cache(async () => {
  const session = await requireSession();
  const membership = await getWorkspaceMembership();

  if (!membership) throw new Error("Робочий простір не знайдено");

  return {
    session,
    workspace: membership.workspace,
    role: membership.role,
  };
});
