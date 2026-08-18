"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function createHostel(
  _prevState: unknown,
  formData: FormData
) {
  const { workspace } = await requirePermission("HOSTELS_CREATE");
  const name = formData.get("name")?.toString().trim();
  const address = formData.get("address")?.toString().trim();
  const city = formData.get("city")?.toString().trim();

  if (!name) {
    return { error: "Назва обов'язкова" };
  }

  await prisma.hostel.create({
    data: {
      name,
      address: address || "",
      city: city || null,
      workspaceId: workspace.id,
    },
  });

  revalidatePath("/hostels");

  return { success: true };
}
