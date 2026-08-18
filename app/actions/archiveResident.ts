"use server";

import { redirect } from "next/navigation";
import { archiveResidentRecord } from "@/lib/resident-service";
import { requireWorkspace } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

export async function archiveResident(formData: FormData) {
  const { workspace, session } = await requireWorkspace();
  const residentId = Number(formData.get("residentId"));
  const hostelId = String(formData.get("hostelId"));
  const roomId = String(formData.get("roomId"));
  const bedId = String(formData.get("bedId"));

  await archiveResidentRecord(workspace.id, residentId);
  await recordAudit({ workspaceId: workspace.id, actor: session.user, action: "RESIDENT_CHECKED_OUT", entityType: "Resident", entityId: residentId, summary: `Виселив(ла) мешканця #${residentId}` });

  redirect(`/hostels/${hostelId}/rooms/${roomId}/beds/${bedId}`);
}
