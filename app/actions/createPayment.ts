"use server";

import { createPaymentRecord } from "@/lib/payment-service";
import { redirect } from "next/navigation";
import { PaymentType } from "@prisma/client";
import { requireWorkspace } from "@/lib/session";

export async function createPayment(formData: FormData) {
  const { workspace } = await requireWorkspace();
  const residentId = Number(formData.get("residentId"));
  const hostelId = String(formData.get("hostelId"));
  const roomId = String(formData.get("roomId"));
  const bedId = String(formData.get("bedId"));

  await createPaymentRecord({
    workspaceId: workspace.id,
    residentId,
    amount: String(formData.get("amount")),
    dueDate: new Date(String(formData.get("dueDate"))),
    type: PaymentType.RENT,
    paid: false,
  });

  redirect(`/hostels/${hostelId}/rooms/${roomId}/beds/${bedId}`);
}
