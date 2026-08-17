"use server";

import { revalidatePath } from "next/cache";
import { createRoomWithBeds } from "@/lib/room-service";
import { requireWorkspace } from "@/lib/session";

export async function createRoom(_: unknown, formData: FormData) {
  const { workspace } = await requireWorkspace();
  const hostelId = Number(formData.get("hostelId"));
  const name = String(formData.get("name")).trim();
  const floor = Number(formData.get("floor"));
  const bedsCount = Number(formData.get("bedsCount"));

  if (!hostelId || !name || !Number.isInteger(bedsCount) || bedsCount < 1) {
    return { error: "Перевірте дані кімнати" };
  }

  await createRoomWithBeds(
    {
      workspaceId: workspace.id,
      hostelId,
      name,
      floor: Number.isInteger(floor) ? floor : null,
    },
    bedsCount
  );

  revalidatePath(`/hostels/${hostelId}/rooms`);

  return {
    success: true,
  };
}
