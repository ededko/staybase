"use server";

import { redirect } from "next/navigation";
import { archiveResidentRecord } from "@/lib/resident-service";
import { requireWorkspace } from "@/lib/session";

export async function archiveResident(formData: FormData) {
  const { workspace } = await requireWorkspace();
  const residentId = Number(formData.get("residentId"));
  const hostelId = String(formData.get("hostelId"));
  const roomId = String(formData.get("roomId"));
  const bedId = String(formData.get("bedId"));

  await archiveResidentRecord(workspace.id, residentId);

  redirect(`/hostels/${hostelId}/rooms/${roomId}/beds/${bedId}`);
}
