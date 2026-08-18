"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

const leadStatuses = new Set(Object.values(LeadStatus));

export async function createLeadApplication(formData: FormData) {
  const { workspace, session } = await requireWorkspace();
  const fullName = String(formData.get("fullName") || "").trim();
  const phone = String(formData.get("phone") || "").trim();
  const hostelId = Number(formData.get("hostelId")) || null;
  const peopleCount = Math.max(1, Number(formData.get("peopleCount")) || 1);
  const stayMonths = Number(formData.get("stayMonths")) || null;
  const budget = Number(formData.get("budget")) || null;
  const desiredMoveInValue = String(formData.get("desiredMoveIn") || "");

  if (!fullName || !phone) throw new Error("Вкажіть ім’я та телефон");

  if (hostelId) {
    const allowed = await prisma.hostel.count({ where: { id: hostelId, workspaceId: workspace.id } });
    if (!allowed) throw new Error("Хостел не знайдено");
  }

  const lead = await prisma.leadApplication.create({
    data: {
      workspaceId: workspace.id,
      hostelId,
      fullName,
      phone,
      email: String(formData.get("email") || "").trim() || null,
      peopleCount,
      desiredMoveIn: desiredMoveInValue ? new Date(desiredMoveInValue) : null,
      stayMonths,
      budget,
      source: String(formData.get("source") || "MANUAL"),
      notes: String(formData.get("notes") || "").trim() || null,
      assignedTo: String(formData.get("assignedTo") || "").trim() || null,
    },
  });
  await recordAudit({ workspaceId: workspace.id, actor: session.user, action: "LEAD_CREATED", entityType: "LeadApplication", entityId: lead.id, summary: `Створив(ла) заявку на заселення: ${fullName}` });

  revalidatePath("/applications");
  redirect("/applications?created=1");
}

export async function updateLeadStatus(formData: FormData) {
  const { workspace, session } = await requireWorkspace();
  const id = Number(formData.get("id"));
  const status = String(formData.get("status")) as LeadStatus;
  if (!id || !leadStatuses.has(status)) throw new Error("Некоректний статус");
  const updated = await prisma.leadApplication.updateMany({ where: { id, workspaceId: workspace.id }, data: { status } });
  if (updated.count) await recordAudit({ workspaceId: workspace.id, actor: session.user, action: "LEAD_STATUS_UPDATED", entityType: "LeadApplication", entityId: id, summary: `Змінив(ла) статус заявки на заселення #${id} на ${status}` });
  revalidatePath("/applications");
}
