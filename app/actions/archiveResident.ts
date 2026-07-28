"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function archiveResident(formData: FormData) {
  const residentId = Number(formData.get("residentId"));
  const hostelId = String(formData.get("hostelId"));
  const roomId = String(formData.get("roomId"));
  const bedId = String(formData.get("bedId"));

  await prisma.resident.update({
    where: {
      id: residentId,
    },
    data: {
      isActive: false,
      archivedAt: new Date(),
      checkOut: new Date(),
      bedId: null,
    },
  });

  redirect(`/hostels/${hostelId}/rooms/${roomId}/beds/${bedId}`);
}