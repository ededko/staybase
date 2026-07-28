"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function updateResident(formData: FormData) {
  const residentId = Number(formData.get("residentId"));
  const hostelId = String(formData.get("hostelId"));
  const roomId = String(formData.get("roomId"));
  const bedId = String(formData.get("bedId"));

  await prisma.resident.update({
    where: {
      id: residentId,
    },
    data: {
      firstName: String(formData.get("firstName")),
      lastName: String(formData.get("lastName")),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
      checkIn: new Date(String(formData.get("checkIn"))),
      checkOut: formData.get("checkOut")
        ? new Date(String(formData.get("checkOut")))
        : null,
    },
  });

  redirect(`/hostels/${hostelId}/rooms/${roomId}/beds/${bedId}`);
}