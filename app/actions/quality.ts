"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { QualityStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

const statuses = new Set(Object.values(QualityStatus));

export async function createQualityEntry(formData: FormData) {
  const { workspace, session } = await requirePermission("QUALITY_CREATE");
  const hostelId = Number(formData.get("hostelId")) || null;
  const roomId = Number(formData.get("roomId")) || null;
  const text = String(formData.get("text") || "").trim();
  const rating = Number(formData.get("rating")) || null;
  if (!text) throw new Error("Додайте текст відгуку або зауваження");
  if (rating && (rating < 1 || rating > 5)) throw new Error("Оцінка має бути від 1 до 5");

  if (hostelId) {
    const allowed = await prisma.hostel.count({ where: { id: hostelId, workspaceId: workspace.id } });
    if (!allowed) throw new Error("Хостел не знайдено");
  }
  if (roomId) {
    const allowed = await prisma.room.count({ where: { id: roomId, hostel: { workspaceId: workspace.id } } });
    if (!allowed) throw new Error("Кімнату не знайдено");
  }

  const entry = await prisma.qualityEntry.create({ data: {
    workspaceId: workspace.id, hostelId, roomId, text, rating,
    source: String(formData.get("source") || "INTERNAL"),
    authorName: String(formData.get("authorName") || "").trim() || null,
    category: String(formData.get("category") || "Інше"),
    assignedTo: String(formData.get("assignedTo") || "").trim() || null,
  }});
  await recordAudit({ workspaceId: workspace.id, actor: session.user, action: "QUALITY_CREATED", entityType: "QualityEntry", entityId: entry.id, summary: `Додав(ла) запис контролю якості: ${entry.category}` });
  revalidatePath("/quality");
  redirect("/quality?created=1");
}

export async function updateQualityStatus(formData: FormData) {
  const { workspace, session } = await requirePermission("QUALITY_EDIT");
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as QualityStatus;
  if (!id || !statuses.has(status)) throw new Error("Некоректний статус");
  const updated = await prisma.qualityEntry.updateMany({ where: { id, workspaceId: workspace.id }, data: { status } });
  if (updated.count) await recordAudit({ workspaceId: workspace.id, actor: session.user, action: "QUALITY_STATUS_UPDATED", entityType: "QualityEntry", entityId: id, summary: `Змінив(ла) статус запису якості #${id} на ${status}` });
  revalidatePath("/quality");
}
