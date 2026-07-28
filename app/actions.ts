"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createHostel(
  _prevState: unknown,
  formData: FormData
) {
  const name = formData.get("name")?.toString().trim();
  const address = formData.get("address")?.toString().trim();

  if (!name) {
    return { error: "Назва обов'язкова" };
  }

  await prisma.hostel.create({
    data: {
      name,
      address: address || "",
    },
  });

  revalidatePath("/hostels");

  return { success: true };
}