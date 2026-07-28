"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function checkInResident(formData: FormData) {
  const bedId = Number(formData.get("bedId"));

  const bed = await prisma.bed.findUnique({
    where: { id: bedId },
    include: { resident: true },
  });

  if (!bed || bed.resident) {
    throw new Error("Ліжко недоступне для заселення");
  }

  await prisma.resident.create({
    data: {
      firstName: String(formData.get("firstName")).trim(),
      lastName: String(formData.get("lastName")).trim(),
      phone: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      checkIn: new Date(String(formData.get("checkIn"))),
      bedId,
    },
  });

  revalidatePath("/residents");
  redirect("/residents");
}

export async function updateResidentDetails(formData: FormData) {
  const residentId = Number(formData.get("residentId"));

  await prisma.resident.update({
    where: { id: residentId },
    data: {
      firstName: String(formData.get("firstName")).trim(),
      lastName: String(formData.get("lastName")).trim(),
      phone: String(formData.get("phone") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      checkIn: new Date(String(formData.get("checkIn"))),
      checkOut: formData.get("checkOut")
        ? new Date(String(formData.get("checkOut")))
        : null,
    },
  });

  revalidatePath("/residents");
  redirect(`/residents/${residentId}`);
}

export async function checkOutResident(formData: FormData) {
  const residentId = Number(formData.get("residentId"));

  await prisma.resident.update({
    where: { id: residentId },
    data: {
      isActive: false,
      archivedAt: new Date(),
      checkOut: new Date(),
      bedId: null,
    },
  });

  revalidatePath("/residents");
  redirect("/residents");
}
