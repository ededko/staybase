"use server";

import { revalidatePath } from "next/cache";
import { createRoomWithBeds } from "@/lib/room-service";
import { requirePermission } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

export async function createRoom(_: unknown, formData: FormData) {
  const { workspace, session } = await requirePermission("ROOMS_CREATE");
  const hostelId = Number(formData.get("hostelId"));
  const name = String(formData.get("name")).trim();
  const floor = Number(formData.get("floor"));
  const bedsCount = Number(formData.get("bedsCount"));

  if (!hostelId || !name || !Number.isInteger(bedsCount) || bedsCount < 1) {
    return { error: "Перевірте дані кімнати" };
  }

  const room = await createRoomWithBeds(
    {
      workspaceId: workspace.id,
      hostelId,
      name,
      floor: Number.isInteger(floor) ? floor : null,
    },
    bedsCount
  );
  await recordAudit({ workspaceId: workspace.id, actor: session.user, action: "ROOM_CREATED", entityType: "Room", entityId: room.id, summary: `Створив(ла) кімнату «${name}» з ${bedsCount} ліжками` });

  revalidatePath(`/hostels/${hostelId}/rooms`);

  return {
    success: true,
  };
}
