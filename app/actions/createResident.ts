"use server";

import { redirect } from "next/navigation";
import { createResidentWithAssignment } from "@/lib/resident-service";
import { requireWorkspace } from "@/lib/session";

export async function createResident(formData: FormData) {
  const { workspace } = await requireWorkspace();
  const hostelId = Number(formData.get("hostelId"));
  const roomId = Number(formData.get("roomId"));
  const bedId = Number(formData.get("bedId"));

  await createResidentWithAssignment(
    {
      firstName: String(formData.get("firstName")),
      lastName: String(formData.get("lastName")),
      phone: String(formData.get("phone") || ""),
      email: String(formData.get("email") || ""),
      notes: "",
      checkIn: new Date(String(formData.get("checkIn"))),
      checkOut: formData.get("checkOut")
        ? new Date(String(formData.get("checkOut")))
        : null,
      birthDate: null,
      gender: null,
    },
    { workspaceId: workspace.id, hostelId, roomId, bedId }
  );

  redirect(`/hostels/${hostelId}/rooms/${roomId}/beds/${bedId}`);
}
