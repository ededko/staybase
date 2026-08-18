"use server";

import { InternalRequestCategory, InternalRequestStatus, TicketPriority } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

const categories = new Set(Object.values(InternalRequestCategory));
const priorities = new Set(Object.values(TicketPriority));
const statuses = new Set(Object.values(InternalRequestStatus));

async function readAttachment(formData: FormData) {
  const file = formData.get("attachment");
  if (!(file instanceof File) || file.size === 0) return null;
  if (file.size > 2_000_000) throw new Error("Файл має бути до 2 МБ");
  const allowed = file.type.startsWith("image/") || file.type === "application/pdf";
  if (!allowed) throw new Error("Додайте фото або PDF");
  return `data:${file.type};base64,${Buffer.from(await file.arrayBuffer()).toString("base64")}`;
}

export async function createInternalRequest(formData: FormData) {
  const { workspace, session } = await requireWorkspace();
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const category = String(formData.get("category")) as InternalRequestCategory;
  const priority = String(formData.get("priority") || "NORMAL") as TicketPriority;
  const hostelId = Number(formData.get("hostelId")) || null;
  const roomId = Number(formData.get("roomId")) || null;
  const amountValue = String(formData.get("amount") || "").trim();
  if (title.length < 3 || description.length < 3 || !categories.has(category) || !priorities.has(priority)) throw new Error("Заповніть обов’язкові поля");

  if (hostelId) {
    const valid = await prisma.hostel.findFirst({ where: { id: hostelId, workspaceId: workspace.id }, select: { id: true } });
    if (!valid) throw new Error("Хостел не знайдено");
  }
  if (roomId) {
    const valid = await prisma.room.findFirst({ where: { id: roomId, hostel: { workspaceId: workspace.id } }, select: { id: true } });
    if (!valid) throw new Error("Кімнату не знайдено");
  }

  const request = await prisma.internalRequest.create({ data: {
    workspaceId: workspace.id,
    requestedByUserId: session.user.id,
    hostelId,
    roomId,
    category,
    priority,
    title,
    description,
    amount: amountValue || null,
    dueDate: formData.get("dueDate") ? new Date(String(formData.get("dueDate"))) : null,
    attachmentUrl: await readAttachment(formData),
  }});
  await recordAudit({ workspaceId: workspace.id, actor: session.user, action: "INTERNAL_REQUEST_CREATED", entityType: "InternalRequest", entityId: request.id, summary: `Створив(ла) внутрішню заявку «${title}»` });
  revalidatePath("/internal-requests");
  revalidatePath("/");
}

export async function updateInternalRequest(formData: FormData) {
  const { workspace, session, role } = await requireWorkspace();
  if (role === "STAFF") throw new Error("Змінювати статус може адміністратор");
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as InternalRequestStatus;
  if (!id || !statuses.has(status)) throw new Error("Некоректні дані");
  const assignedToUserId = String(formData.get("assignedToUserId") || "") || null;
  if (assignedToUserId) {
    const member = await prisma.workspaceMember.findFirst({ where: { workspaceId: workspace.id, userId: assignedToUserId }, select: { id: true } });
    if (!member) throw new Error("Працівника не знайдено");
  }
  const updated = await prisma.internalRequest.updateMany({
    where: { id, workspaceId: workspace.id },
    data: {
      status,
      assignedToUserId,
      approvedByUserId: status === "APPROVED" ? session.user.id : undefined,
      completedAt: status === "DONE" ? new Date() : null,
    },
  });
  if (updated.count) await recordAudit({ workspaceId: workspace.id, actor: session.user, action: "INTERNAL_REQUEST_UPDATED", entityType: "InternalRequest", entityId: id, summary: `Змінив(ла) статус внутрішньої заявки #${id} на ${status}` });
  revalidatePath("/internal-requests");
  revalidatePath("/");
}
