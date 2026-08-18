"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createBedRecord,
  deleteBedRecord,
  toggleBedDisabledRecord,
  updateBedRecord,
} from "@/lib/bed-service";
import { requirePermission } from "@/lib/session";

function bedInput(formData: FormData) {
  const hostelId = Number(formData.get("hostelId"));
  const roomId = Number(formData.get("roomId"));
  const number = Number(formData.get("number"));
  const notes = String(formData.get("notes") || "");

  if (
    !Number.isInteger(hostelId) ||
    hostelId < 1 ||
    !Number.isInteger(roomId) ||
    roomId < 1 ||
    !Number.isInteger(number) ||
    number < 1
  ) {
    throw new Error("Некоректні дані ліжка");
  }

  return { hostelId, roomId, number, notes };
}

function bedIds(formData: FormData) {
  const hostelId = Number(formData.get("hostelId"));
  const roomId = Number(formData.get("roomId"));
  const bedId = Number(formData.get("bedId"));

  if (
    !Number.isInteger(hostelId) ||
    hostelId < 1 ||
    !Number.isInteger(roomId) ||
    roomId < 1 ||
    !Number.isInteger(bedId) ||
    bedId < 1
  ) {
    throw new Error("Некоректні ідентифікатори ліжка");
  }

  return { hostelId, roomId, bedId };
}

function revalidateBedPages(hostelId: number, roomId: number, bedId?: number) {
  revalidatePath("/");
  revalidatePath(`/hostels/${hostelId}`);
  revalidatePath(`/hostels/${hostelId}/rooms`);
  revalidatePath(`/hostels/${hostelId}/rooms/${roomId}`);
  if (bedId) {
    revalidatePath(`/hostels/${hostelId}/rooms/${roomId}/beds/${bedId}`);
  }
}

export async function createBed(formData: FormData) {
  const { workspace } = await requirePermission("ROOMS_CREATE");
  const input = { ...bedInput(formData), workspaceId: workspace.id };
  const result = await createBedRecord(input);

  if (!result.success) {
    redirect(
      `/hostels/${input.hostelId}/rooms/${input.roomId}/beds/new?error=${result.reason}`
    );
  }

  revalidateBedPages(input.hostelId, input.roomId, result.bedId);
  redirect(
    `/hostels/${input.hostelId}/rooms/${input.roomId}/beds/${result.bedId}`
  );
}

export async function updateBed(formData: FormData) {
  const { workspace } = await requirePermission("ROOMS_EDIT");
  const { bedId } = bedIds(formData);
  const input = { ...bedInput(formData), workspaceId: workspace.id };
  const result = await updateBedRecord(bedId, input);

  if (!result.success) {
    redirect(
      `/hostels/${input.hostelId}/rooms/${input.roomId}/beds/${bedId}/edit?error=${result.reason}`
    );
  }

  revalidateBedPages(input.hostelId, input.roomId, bedId);
  redirect(`/hostels/${input.hostelId}/rooms/${input.roomId}/beds/${bedId}`);
}

export async function toggleBedDisabled(formData: FormData) {
  const { workspace } = await requirePermission("ROOMS_EDIT");
  const { hostelId, roomId, bedId } = bedIds(formData);
  const result = await toggleBedDisabledRecord(workspace.id, hostelId, roomId, bedId);

  if (!result.success) {
    redirect(
      `/hostels/${hostelId}/rooms/${roomId}/beds/${bedId}?error=${result.reason}`
    );
  }

  revalidateBedPages(hostelId, roomId, bedId);
  redirect(`/hostels/${hostelId}/rooms/${roomId}/beds/${bedId}`);
}

export async function deleteBed(formData: FormData) {
  const { workspace } = await requirePermission("ROOMS_DELETE");
  const { hostelId, roomId, bedId } = bedIds(formData);
  const result = await deleteBedRecord(workspace.id, hostelId, roomId, bedId);

  if (!result.success) {
    redirect(
      `/hostels/${hostelId}/rooms/${roomId}/beds/${bedId}?error=${result.reason}`
    );
  }

  revalidateBedPages(hostelId, roomId);
  redirect(`/hostels/${hostelId}/rooms/${roomId}`);
}
