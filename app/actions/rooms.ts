"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteRoomRecord, updateRoomRecord } from "@/lib/room-service";
import { requireWorkspace } from "@/lib/session";

export async function updateRoom(formData: FormData) {
  const { workspace } = await requireWorkspace();
  const roomId = Number(formData.get("roomId"));
  const hostelId = Number(formData.get("hostelId"));
  const name = String(formData.get("name")).trim();
  const floorValue = String(formData.get("floor"));
  const floor = floorValue ? Number(floorValue) : null;

  if (!roomId || !hostelId || !name || (floor !== null && !Number.isInteger(floor))) {
    throw new Error("Некоректні дані кімнати");
  }

  await updateRoomRecord(roomId, { workspaceId: workspace.id, hostelId, name, floor });
  revalidatePath(`/hostels/${hostelId}/rooms`);
  revalidatePath(`/hostels/${hostelId}/rooms/${roomId}`);
  redirect(`/hostels/${hostelId}/rooms/${roomId}`);
}

export async function deleteRoom(formData: FormData) {
  const { workspace } = await requireWorkspace();
  const roomId = Number(formData.get("roomId"));
  const hostelId = Number(formData.get("hostelId"));
  const result = await deleteRoomRecord(workspace.id, roomId);

  if (!result.deleted) {
    redirect(`/hostels/${hostelId}/rooms/${roomId}?error=${result.reason}`);
  }

  revalidatePath(`/hostels/${hostelId}/rooms`);
  redirect(`/hostels/${hostelId}/rooms`);
}
