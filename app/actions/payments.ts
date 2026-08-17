"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PaymentType } from "@prisma/client";
import {
  createPaymentRecord,
  updatePaymentRecord,
} from "@/lib/payment-service";
import { requireWorkspace } from "@/lib/session";

function optionalDate(value: FormDataEntryValue | null) {
  return value ? new Date(String(value)) : null;
}

function formPaymentData(formData: FormData, workspaceId: string) {
  const paid = formData.get("paid") === "on";
  const typeValue = String(formData.get("type"));
  const type = Object.values(PaymentType).includes(typeValue as PaymentType)
    ? (typeValue as PaymentType)
    : PaymentType.RENT;

  return {
    workspaceId,
    residentId: Number(formData.get("residentId")),
    amount: String(formData.get("amount")),
    dueDate: new Date(String(formData.get("dueDate"))),
    notes: String(formData.get("notes") || ""),
    type,
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
  const { workspace } = await requireWorkspace();
  const payment = await createPaymentRecord(formPaymentData(formData, workspace.id));

  revalidatePaymentPages();
  redirect(`/payments/${payment.id}`);
}

export async function updatePaymentFromForm(formData: FormData) {
  const { workspace } = await requireWorkspace();
  const paymentId = Number(formData.get("paymentId"));
  const payment = await updatePaymentRecord(paymentId, formPaymentData(formData, workspace.id));

  revalidatePaymentPages();
  redirect(`/payments/${payment.id}`);
}
