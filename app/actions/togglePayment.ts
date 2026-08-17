"use server";

import { togglePaymentRecord } from "@/lib/payment-service";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/session";

export async function togglePayment(formData: FormData) {
  const { workspace } = await requireWorkspace();
  const paymentId = Number(formData.get("paymentId"));
  const hostelId = String(formData.get("hostelId"));
  const roomId = String(formData.get("roomId"));
  const bedId = String(formData.get("bedId"));

  await togglePaymentRecord(workspace.id, paymentId);

  redirect(`/hostels/${hostelId}/rooms/${roomId}/beds/${bedId}`);
}
