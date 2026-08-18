"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

export async function updateHostel(formData: FormData) {
  const { workspace, session } = await requirePermission("HOSTELS_EDIT");
  const id = Number(formData.get("hostelId"));
  const name = String(formData.get("name") || "").trim();
  const address = String(formData.get("address") || "").trim();
  const city = String(formData.get("city") || "").trim() || null;
  if (!id || !name) throw new Error("Вкажіть назву хостела");
  const result = await prisma.hostel.updateMany({ where: { id, workspaceId: workspace.id }, data: { name, address, city } });
  if (!result.count) throw new Error("Хостел не знайдено");
  await recordAudit({ workspaceId: workspace.id, actor: session.user, action: "HOSTEL_UPDATED", entityType: "Hostel", entityId: id, summary: `Змінив(ла) хостел «${name}»` });
  revalidatePath("/hostels"); revalidatePath(`/hostels/${id}`);
  redirect(`/hostels/${id}`);
}

export async function deleteHostel(formData: FormData) {
  const { workspace, session } = await requirePermission("HOSTELS_DELETE");
  const id = Number(formData.get("hostelId"));
  const hostel = await prisma.hostel.findFirst({ where: { id, workspaceId: workspace.id }, select: { id: true, name: true, _count: { select: { rooms: true, leadApplications: true, maintenanceTickets: true, internalRequests: true } } } });
  if (!hostel) redirect("/hostels?error=not-found");
  if (Object.values(hostel._count).some((count) => count > 0)) redirect(`/hostels/${id}?error=not-empty`);
  await prisma.hostel.delete({ where: { id: hostel.id } });
  await recordAudit({ workspaceId: workspace.id, actor: session.user, action: "HOSTEL_DELETED", entityType: "Hostel", entityId: id, summary: `Видалив(ла) хостел «${hostel.name}»` });
  revalidatePath("/hostels"); redirect("/hostels");
}
