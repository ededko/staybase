"use server";

import { togglePaymentRecord } from "@/lib/payment-service";
import { redirect } from "next/navigation";
import { requireWorkspace } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

export async function togglePayment(formData: FormData) {
  const { workspace, session } = await requireWorkspace();
  const paymentId = Number(formData.get("paymentId"));
  const hostelId = String(formData.get("hostelId"));
  const roomId = String(formData.get("roomId"));
  const bedId = String(formData.get("bedId"));

  const payment = await togglePaymentRecord(workspace.id, paymentId);
  if (payment) {
    await recordAudit({ workspaceId: workspace.id, actor: session.user, action: "PAYMENT_TOGGLED", entityType: "Payment", entityId: payment.id, summary: `${payment.paid ? "Позначив(ла) оплату отриманою" : "Скасував(ла) оплату"}: #${payment.id}` });
  }

  redirect(`/hostels/${hostelId}/rooms/${roomId}/beds/${bedId}`);
}
