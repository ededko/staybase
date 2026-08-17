"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession, requireWorkspace } from "@/lib/session";

function normalizeEmail(value: FormDataEntryValue | null) {
  const email = String(value || "").trim().toLowerCase();
  if (!email.includes("@") || email.length > 254) throw new Error("Некоректний email");
  return email;
}

export async function inviteAdmin(formData: FormData) {
  const { session, workspace, role } = await requireWorkspace();
  if (role !== "OWNER") throw new Error("Лише власник може додавати адміністраторів");
  const email = normalizeEmail(formData.get("email"));
  if (email === session.user.email.toLowerCase()) throw new Error("Це ваш email");

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
      create: { workspaceId: workspace.id, userId: user.id, role: "ADMIN" },
      update: {},
    });
  } else {
    await prisma.workspaceInvite.upsert({
      where: { workspaceId_email: { workspaceId: workspace.id, email } },
      create: { workspaceId: workspace.id, email, invitedByUserId: session.user.id },
      update: { invitedByUserId: session.user.id },
    });
  }
  revalidatePath("/settings/team");
}

export async function removeAdmin(formData: FormData) {
  const { workspace, role } = await requireWorkspace();
  if (role !== "OWNER") throw new Error("Лише власник може видаляти адміністраторів");
  const memberId = String(formData.get("memberId") || "");
  await prisma.workspaceMember.deleteMany({ where: { id: memberId, workspaceId: workspace.id, role: "ADMIN" } });
  revalidatePath("/settings/team");
}

export async function cancelInvite(formData: FormData) {
  const { workspace, role } = await requireWorkspace();
  if (role !== "OWNER") throw new Error("Лише власник може скасовувати запрошення");
  const inviteId = String(formData.get("inviteId") || "");
  await prisma.workspaceInvite.deleteMany({ where: { id: inviteId, workspaceId: workspace.id } });
  revalidatePath("/settings/team");
}

export async function acceptInvite(formData: FormData) {
  const session = await requireSession();
  const inviteId = String(formData.get("inviteId") || "");
  const invite = await prisma.workspaceInvite.findFirst({
    where: { id: inviteId, email: session.user.email.toLowerCase() },
  });
  if (!invite) throw new Error("Запрошення не знайдено");

  await prisma.$transaction([
    prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: session.user.id } },
      create: { workspaceId: invite.workspaceId, userId: session.user.id, role: "ADMIN" },
      update: {},
    }),
    prisma.workspaceInvite.delete({ where: { id: invite.id } }),
  ]);
  redirect("/");
}
