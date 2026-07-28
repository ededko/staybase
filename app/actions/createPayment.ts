"use server";

import { createPaymentRecord } from "@/lib/payment-service";
import { redirect } from "next/navigation";

export async function createPayment(formData: FormData) {
  const residentId = Number(formData.get("residentId"));
  const hostelId = String(formData.get("hostelId"));
  const roomId = String(formData.get("roomId"));
  const bedId = String(formData.get("bedId"));

  await createPaymentRecord({
    residentId,
    amount: String(formData.get("amount")),
    dueDate: new Date(String(formData.get("dueDate"))),
    paid: false,
  });

  redirect(`/hostels/${hostelId}/rooms/${roomId}/beds/${bedId}`);
}
