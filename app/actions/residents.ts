"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  archiveResidentRecord,
  createResidentWithAssignment,
  updateResidentWithAssignment,
} from "@/lib/resident-service";
import { requireWorkspace } from "@/lib/session";

function residentInput(formData: FormData) {
  const firstName = String(formData.get("firstName")).trim();
  const lastName = String(formData.get("lastName")).trim();
  const checkIn = new Date(String(formData.get("checkIn")));
  const checkOut = formData.get("checkOut")
    ? new Date(String(formData.get("checkOut")))
    : null;

  if (
    !firstName ||
    !lastName ||
    Number.isNaN(checkIn.getTime()) ||
    (checkOut && Number.isNaN(checkOut.getTime())) ||
    (checkOut && checkOut < checkIn)
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
  const { workspace } = await requireWorkspace();
  await createResidentWithAssignment(residentInput(formData), assignment(formData, workspace.id));

  revalidateResidentPages();
  redirect("/residents");
}

export async function updateResidentDetails(formData: FormData) {
  const { workspace } = await requireWorkspace();
  const residentId = Number(formData.get("residentId"));

  await updateResidentWithAssignment(
    residentId,
    residentInput(formData),
    assignment(formData, workspace.id)
  );

  revalidateResidentPages();
  redirect(`/residents/${residentId}`);
}

export async function checkOutResident(formData: FormData) {
  const { workspace } = await requireWorkspace();
  const residentId = Number(formData.get("residentId"));

  await archiveResidentRecord(workspace.id, residentId);

  revalidateResidentPages();
  redirect("/residents");
}
