"use server";

import { togglePaymentRecord } from "@/lib/payment-service";
import { redirect } from "next/navigation";

export async function togglePayment(formData: FormData) {
  const paymentId = Number(formData.get("paymentId"));
  const hostelId = String(formData.get("hostelId"));
  const roomId = String(formData.get("roomId"));
  const bedId = String(formData.get("bedId"));

  await togglePaymentRecord(paymentId);

  redirect(`/hostels/${hostelId}/rooms/${roomId}/beds/${bedId}`);
}
