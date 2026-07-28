"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function deleteResident(formData: FormData) {
  const residentId = Number(formData.get("residentId"));

  await prisma.resident.delete({
    where: {
      id: residentId,
    },
  });

  redirect(
    `/hostels/${formData.get("hostelId")}/rooms/${formData.get(
      "roomId"
    )}/beds/${formData.get("bedId")}`
  );
}