"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { TicketPriority, TicketStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

const statuses = new Set(Object.values(TicketStatus));
const priorities = new Set(Object.values(TicketPriority));

async function readPhoto(formData: FormData) {
  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) return String(formData.get("photoUrl") || "").trim() || null;
  if (!file.type.startsWith("image/") || file.size > 2_000_000) throw new Error("Фото має бути зображенням до 2 МБ");
  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  return `data:${file.type};base64,${base64}`;
}

async function resolveLocation(hostelId: number, roomId: number | null) {
  const hostel = await prisma.hostel.findUnique({ where: { id: hostelId }, select: { id: true, workspaceId: true } });
  if (!hostel) throw new Error("Хостел не знайдено");
  if (roomId) {
    const room = await prisma.room.findFirst({ where: { id: roomId, hostelId }, select: { id: true } });
    if (!room) throw new Error("Кімнату не знайдено");
  }
  return hostel;
}

export async function createMaintenanceTicket(formData: FormData) {
  const { workspace, session } = await requireWorkspace();
  const hostelId = Number(formData.get("hostelId"));
  const roomId = Number(formData.get("roomId")) || null;
  const description = String(formData.get("description") || "").trim();
  const category = String(formData.get("category") || "Інше").trim();
  const priorityValue = String(formData.get("priority") || "NORMAL") as TicketPriority;
  if (!hostelId || !description || !priorities.has(priorityValue)) throw new Error("Заповніть обов’язкові поля");
  const location = await resolveLocation(hostelId, roomId);
  if (location.workspaceId !== workspace.id) throw new Error("Немає доступу");
  const photoUrl = await readPhoto(formData);

  const ticket = await prisma.maintenanceTicket.create({ data: {
    workspaceId: workspace.id, hostelId, roomId, description, category, priority: priorityValue,
    photoUrl,
    reporterName: String(formData.get("reporterName") || "").trim() || null,
    reporterPhone: String(formData.get("reporterPhone") || "").trim() || null,
    assignedTo: String(formData.get("assignedTo") || "").trim() || null,
  }});
  await recordAudit({ workspaceId: workspace.id, actor: session.user, action: "MAINTENANCE_CREATED", entityType: "MaintenanceTicket", entityId: ticket.id, summary: `Створив(ла) ремонтну заявку «${category}»` });
  revalidatePath("/maintenance");
  redirect("/maintenance?created=1");
}

export async function createPublicMaintenanceTicket(formData: FormData) {
  if (String(formData.get("website") || "")) throw new Error("Некоректна заявка");
  const hostelId = Number(formData.get("hostelId"));
  const roomId = Number(formData.get("roomId")) || null;
  const description = String(formData.get("description") || "").trim();
  const category = String(formData.get("category") || "Інше").trim();
  const priorityValue = String(formData.get("priority") || "NORMAL") as TicketPriority;
  if (!hostelId || description.length < 4 || !priorities.has(priorityValue)) throw new Error("Опишіть проблему");
  const location = await resolveLocation(hostelId, roomId);
  const photoUrl = await readPhoto(formData);

  await prisma.maintenanceTicket.create({ data: {
    workspaceId: location.workspaceId, hostelId, roomId, description, category, priority: priorityValue,
    photoUrl,
    reporterName: String(formData.get("reporterName") || "").trim() || null,
    reporterPhone: String(formData.get("reporterPhone") || "").trim() || null,
  }});
  redirect("/report/maintenance/success");
}

export async function updateMaintenanceStatus(formData: FormData) {
  const { workspace, session } = await requireWorkspace();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as TicketStatus;
  if (!id || !statuses.has(status)) throw new Error("Некоректний статус");
  const updated = await prisma.maintenanceTicket.updateMany({
    where: { id, workspaceId: workspace.id },
    data: { status, completedAt: status === "DONE" ? new Date() : null },
  });
  if (updated.count) await recordAudit({ workspaceId: workspace.id, actor: session.user, action: "MAINTENANCE_STATUS_UPDATED", entityType: "MaintenanceTicket", entityId: id, summary: `Змінив(ла) статус ремонтної заявки #${id} на ${status}` });
  revalidatePath("/maintenance");
  revalidatePath("/");
}
