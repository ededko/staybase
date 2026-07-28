"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function createResident(formData: FormData) {
  const bedId = Number(formData.get("bedId"));

  await prisma.resident.create({
    data: {
      firstName: String(formData.get("firstName")),
      lastName: String(formData.get("lastName")),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
      checkIn: new Date(String(formData.get("checkIn"))),
      checkOut: formData.get("checkOut")
        ? new Date(String(formData.get("checkOut")))
        : null,
      bedId,
    },
  });

  redirect(
    `/hostels/${formData.get("hostelId")}/rooms/${formData.get(
      "roomId"
    )}/beds/${bedId}`
  );
}