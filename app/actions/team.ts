"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession, requireWorkspace } from "@/lib/session";
import { WorkspaceRole } from "@prisma/client";
import { recordAudit } from "@/lib/audit";
import { allPermissions } from "@/lib/permissions";

function readPermissions(formData: FormData) {
  const values = formData.getAll("permissions").map(String);
  return values.filter((value) => allPermissions.includes(value as never));
}

function normalizeEmail(value: FormDataEntryValue | null) {
  const email = String(value || "").trim().toLowerCase();
  if (!email.includes("@") || email.length > 254) throw new Error("Некоректний email");
  return email;
}

export async function inviteAdmin(formData: FormData) {
  const { session, workspace, role } = await requireWorkspace();
  if (role !== "OWNER") throw new Error("Лише власник може додавати адміністраторів");
  const email = normalizeEmail(formData.get("email"));
  const roleValue = String(formData.get("role") || "ADMIN");
  const invitedRole = roleValue === "STAFF" ? WorkspaceRole.STAFF : WorkspaceRole.ADMIN;
  const permissions = readPermissions(formData);
  if (email === session.user.email.toLowerCase()) throw new Error("Це ваш email");

  const user = await prisma.user.findUnique({ where: { email } });
  if (user) {
    await prisma.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
      create: { workspaceId: workspace.id, userId: user.id, role: invitedRole, permissions, permissionsConfigured: true },
      update: { role: invitedRole, permissions, permissionsConfigured: true },
    });
  } else {
    await prisma.workspaceInvite.upsert({
      where: { workspaceId_email: { workspaceId: workspace.id, email } },
      create: { workspaceId: workspace.id, email, invitedByUserId: session.user.id, role: invitedRole, permissions, permissionsConfigured: true },
      update: { invitedByUserId: session.user.id, role: invitedRole, permissions, permissionsConfigured: true },
    });
  }
  await recordAudit({ workspaceId: workspace.id, actor: session.user, action: "MEMBER_INVITED", entityType: "WorkspaceMember", summary: `Запросив(ла) ${email} як ${invitedRole === "ADMIN" ? "адміністратора" : "працівника"}` });
  revalidatePath("/settings/team");
}

export async function updateMemberPermissions(formData: FormData) {
  const { workspace, role, session } = await requireWorkspace();
  if (role !== "OWNER") throw new Error("Лише власник може змінювати доступи");
  const memberId = String(formData.get("memberId") || "");
  const roleValue = String(formData.get("role") || "STAFF");
  const memberRole = roleValue === "ADMIN" ? WorkspaceRole.ADMIN : WorkspaceRole.STAFF;
  const permissions = readPermissions(formData);
  const member = await prisma.workspaceMember.findFirst({ where: { id: memberId, workspaceId: workspace.id, role: { not: "OWNER" } }, include: { user: true } });
  if (!member) throw new Error("Учасника не знайдено");
  await prisma.workspaceMember.update({ where: { id: member.id }, data: { role: memberRole, permissions, permissionsConfigured: true } });
  await recordAudit({ workspaceId: workspace.id, actor: session.user, action: "MEMBER_PERMISSIONS_UPDATED", entityType: "WorkspaceMember", entityId: member.id, summary: `Змінив(ла) доступи для ${member.user.email}` });
  revalidatePath("/settings/team");
}

export async function removeAdmin(formData: FormData) {
  const { workspace, role } = await requireWorkspace();
  if (role !== "OWNER") throw new Error("Лише власник може видаляти адміністраторів");
  const memberId = String(formData.get("memberId") || "");
  await prisma.workspaceMember.deleteMany({ where: { id: memberId, workspaceId: workspace.id, role: { not: "OWNER" } } });
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
      create: { workspaceId: invite.workspaceId, userId: session.user.id, role: invite.role, permissions: invite.permissions, permissionsConfigured: invite.permissionsConfigured },
      update: { role: invite.role, permissions: invite.permissions, permissionsConfigured: invite.permissionsConfigured },
    }),
    prisma.workspaceInvite.delete({ where: { id: invite.id } }),
  ]);
  redirect("/");
}
