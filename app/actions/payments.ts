"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createPaymentRecord,
  updatePaymentRecord,
} from "@/lib/payment-service";

function optionalDate(value: FormDataEntryValue | null) {
  return value ? new Date(String(value)) : null;
}

function formPaymentData(formData: FormData) {
  const paid = formData.get("paid") === "on";

  return {
    residentId: Number(formData.get("residentId")),
    amount: String(formData.get("amount")),
    dueDate: new Date(String(formData.get("dueDate"))),
    notes: String(formData.get("notes") || ""),
    paid,
    paidAt: paid ? optionalDate(formData.get("paidAt")) : null,
  };
}

function revalidatePaymentPages() {
  revalidatePath("/");
  revalidatePath("/payments");
  revalidatePath("/residents");
}

export async function createPaymentFromForm(formData: FormData) {
  const payment = await createPaymentRecord(formPaymentData(formData));

  revalidatePaymentPages();
  redirect(`/payments/${payment.id}`);
}

export async function updatePaymentFromForm(formData: FormData) {
  const paymentId = Number(formData.get("paymentId"));
  const payment = await updatePaymentRecord(paymentId, formPaymentData(formData));

  revalidatePaymentPages();
  redirect(`/payments/${payment.id}`);
}
