"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  archiveResidentRecord,
  createResidentWithAssignment,
  updateResidentWithAssignment,
} from "@/lib/resident-service";
import { requireWorkspace } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

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
  const { workspace, session } = await requireWorkspace();
  const input = residentInput(formData);
  const resident = await createResidentWithAssignment(input, assignment(formData, workspace.id));
  await recordAudit({ workspaceId: workspace.id, actor: session.user, action: "RESIDENT_CHECKED_IN", entityType: "Resident", entityId: resident.id, summary: `Заселив(ла) ${input.firstName} ${input.lastName}` });

  revalidateResidentPages();
  redirect("/residents");
}

export async function updateResidentDetails(formData: FormData) {
  const { workspace, session } = await requireWorkspace();
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
  const { workspace, session } = await requireWorkspace();
  const residentId = Number(formData.get("residentId"));

  await archiveResidentRecord(workspace.id, residentId);
  await recordAudit({ workspaceId: workspace.id, actor: session.user, action: "RESIDENT_CHECKED_OUT", entityType: "Resident", entityId: residentId, summary: `Виселив(ла) мешканця #${residentId}` });

  revalidateResidentPages();
  redirect("/residents");
}
