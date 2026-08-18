"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  archiveResidentRecord,
  createResidentWithAssignment,
  updateResidentWithAssignment,
} from "@/lib/resident-service";
import { requirePermission } from "@/lib/session";
import { recordAudit } from "@/lib/audit";
import { createPaymentRecord } from "@/lib/payment-service";
import { PaymentMethod, PaymentType } from "@prisma/client";

function residentInput(formData: FormData) {
  const firstName = String(formData.get("firstName")).trim();
  const lastName = String(formData.get("lastName")).trim();
  const checkIn = new Date(String(formData.get("checkIn")));
  const checkOut = formData.get("checkOut")
    ? new Date(String(formData.get("checkOut")))
    : null;
  const birthDate = formData.get("birthDate") ? new Date(String(formData.get("birthDate"))) : null;
  const genderValue = String(formData.get("gender") || "");
  const gender = ["MALE", "FEMALE", "OTHER"].includes(genderValue)
    ? (genderValue as "MALE" | "FEMALE" | "OTHER")
    : null;
  const monthlyRentValue = String(formData.get("monthlyRent") || "").trim();
  const monthlyRent = monthlyRentValue ? monthlyRentValue : null;
  const dueDayValue = Number(formData.get("paymentDueDay"));
  const paymentDueDay = Number.isInteger(dueDayValue) && dueDayValue >= 1 && dueDayValue <= 31 ? dueDayValue : checkIn.getDate();

  if (
    !firstName ||
    !lastName ||
    Number.isNaN(checkIn.getTime()) ||
    (checkOut && Number.isNaN(checkOut.getTime())) ||
    (checkOut && checkOut < checkIn)
    || (birthDate && Number.isNaN(birthDate.getTime()))
  ) {
    throw new Error("Некоректні дані мешканця");
  }

  return {
    firstName,
    lastName,
    phone: String(formData.get("phone") || ""),
    email: String(formData.get("email") || ""),
    notes: String(formData.get("notes") || ""),
    checkIn,
    checkOut,
    birthDate,
    gender,
    monthlyRent,
    paymentDueDay,
  };
}

function assignment(formData: FormData, workspaceId: string) {
  const value = {
    hostelId: Number(formData.get("hostelId")),
    roomId: Number(formData.get("roomId")),
    bedId: Number(formData.get("bedId")),
  };

  if (
    !Number.isInteger(value.hostelId) ||
    value.hostelId < 1 ||
    !Number.isInteger(value.roomId) ||
    value.roomId < 1 ||
    !Number.isInteger(value.bedId) ||
    value.bedId < 1
  ) {
    throw new Error("Некоректне розміщення мешканця");
  }

  return { ...value, workspaceId };
}

function revalidateResidentPages() {
  revalidatePath("/");
  revalidatePath("/residents");
  revalidatePath("/hostels");
}

export async function checkInResident(formData: FormData) {
  const { workspace, session } = await requirePermission("RESIDENTS_CREATE");
  const input = residentInput(formData);
  const resident = await createResidentWithAssignment(input, assignment(formData, workspace.id));
  if (formData.get("createPayment") === "on") {
    const amount = String(formData.get("paymentAmount") || "");
    const dueDateValue = String(formData.get("paymentDueDate") || formData.get("checkIn"));
    const typeValue = String(formData.get("paymentType") || "RENT") as PaymentType;
    const methodValue = String(formData.get("paymentMethod") || "CASH") as PaymentMethod;
    await createPaymentRecord({ workspaceId:workspace.id, residentId:resident.id, amount, dueDate:new Date(dueDateValue), notes:String(formData.get("paymentNotes")||""), type:Object.values(PaymentType).includes(typeValue)?typeValue:PaymentType.RENT, method:Object.values(PaymentMethod).includes(methodValue)?methodValue:PaymentMethod.CASH, paid:true, paidAt:new Date(), paidThrough:formData.get("paymentPaidThrough")?new Date(String(formData.get("paymentPaidThrough"))):null });
  }
  const applicationId = Number(formData.get("applicationId"));
  if (applicationId) {
    const { prisma } = await import("@/lib/prisma");
    await prisma.leadApplication.updateMany({ where:{ id:applicationId, workspaceId:workspace.id }, data:{ status:"MOVED_IN" } });
  }
  await recordAudit({ workspaceId: workspace.id, actor: session.user, action: "RESIDENT_CHECKED_IN", entityType: "Resident", entityId: resident.id, summary: `Заселив(ла) ${input.firstName} ${input.lastName}` });

  revalidateResidentPages();
  redirect("/residents");
}

export async function updateResidentDetails(formData: FormData) {
  const { workspace, session } = await requirePermission("RESIDENTS_EDIT");
  const residentId = Number(formData.get("residentId"));

  const input = residentInput(formData);
  await updateResidentWithAssignment(
    residentId,
    input,
    assignment(formData, workspace.id)
  );
  await recordAudit({ workspaceId: workspace.id, actor: session.user, action: "RESIDENT_UPDATED", entityType: "Resident", entityId: residentId, summary: `Змінив(ла) дані ${input.firstName} ${input.lastName}` });

  revalidateResidentPages();
  redirect(`/residents/${residentId}`);
}

export async function checkOutResident(formData: FormData) {
  const { workspace, session } = await requirePermission("RESIDENTS_CHECKOUT");
  const residentId = Number(formData.get("residentId"));

  await archiveResidentRecord(workspace.id, residentId);
  await recordAudit({ workspaceId: workspace.id, actor: session.user, action: "RESIDENT_CHECKED_OUT", entityType: "Resident", entityId: residentId, summary: `Виселив(ла) мешканця #${residentId}` });

  revalidateResidentPages();
  redirect("/residents");
}
