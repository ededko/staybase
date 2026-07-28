"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createRoom(_: unknown, formData: FormData) {
  const hostelId = Number(formData.get("hostelId"));
  const name = String(formData.get("name"));
  const floor = Number(formData.get("floor"));
  const bedsCount = Number(formData.get("bedsCount"));

  const room = await prisma.room.create({
    data: {
      hostelId,
      name,
      floor,
    },
  });

  await prisma.bed.createMany({
    data: Array.from({ length: bedsCount }, (_, index) => ({
      roomId: room.id,
      number: index + 1,
    })),
  });

  revalidatePath(`/hostels/${hostelId}/rooms`);

  return {
    success: true,
  };
}