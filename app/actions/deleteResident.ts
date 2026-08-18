"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { requirePermission } from "@/lib/session";

export async function deleteResident(formData: FormData) {
  const { workspace } = await requirePermission("RESIDENTS_EDIT");
  const residentId = Number(formData.get("residentId"));

  const resident = await prisma.resident.findFirst({ where: { id: residentId, workspaceId: workspace.id } });
  if (!resident) throw new Error("Мешканця не знайдено");
  await prisma.resident.delete({ where: { id: resident.id } });

  redirect(
    `/hostels/${formData.get("hostelId")}/rooms/${formData.get(
      "roomId"
    )}/beds/${formData.get("bedId")}`
  );
}
