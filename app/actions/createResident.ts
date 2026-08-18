"use server";

import { redirect } from "next/navigation";
import { createResidentWithAssignment } from "@/lib/resident-service";
import { requireWorkspace } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

export async function createResident(formData: FormData) {
  const { workspace, session } = await requireWorkspace();
  const hostelId = Number(formData.get("hostelId"));
  const roomId = Number(formData.get("roomId"));
  const bedId = Number(formData.get("bedId"));

  const resident = await createResidentWithAssignment(
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
  await recordAudit({ workspaceId: workspace.id, actor: session.user, action: "RESIDENT_CHECKED_IN", entityType: "Resident", entityId: resident.id, summary: `Заселив(ла) ${resident.firstName} ${resident.lastName}` });

  redirect(`/hostels/${hostelId}/rooms/${roomId}/beds/${bedId}`);
}
