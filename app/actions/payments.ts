"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PaymentMethod, PaymentType } from "@prisma/client";
import {
  createPaymentRecord,
  updatePaymentRecord,
} from "@/lib/payment-service";
import { requirePermission } from "@/lib/session";
import { recordAudit } from "@/lib/audit";

function optionalDate(value: FormDataEntryValue | null) {
  return value ? new Date(String(value)) : null;
}

function formPaymentData(formData: FormData, workspaceId: string) {
  const paid = formData.get("paid") === "on";
  const typeValue = String(formData.get("type"));
  const type = Object.values(PaymentType).includes(typeValue as PaymentType)
    ? (typeValue as PaymentType)
    : PaymentType.RENT;
  const methodValue = String(formData.get("method") || "CASH");
  const method = Object.values(PaymentMethod).includes(methodValue as PaymentMethod)
    ? (methodValue as PaymentMethod)
    : PaymentMethod.CASH;

  return {
    workspaceId,
    residentId: Number(formData.get("residentId")),
    amount: String(formData.get("amount")),
    dueDate: new Date(String(formData.get("dueDate"))),
    notes: String(formData.get("notes") || ""),
    type,
    method,
    paid,
    paidAt: paid ? optionalDate(formData.get("paidAt")) : null,
    paidThrough: optionalDate(formData.get("paidThrough")),
  };
}

function revalidatePaymentPages() {
  revalidatePath("/");
  revalidatePath("/payments");
  revalidatePath("/residents");
}

export async function createPaymentFromForm(formData: FormData) {
  const { workspace, session } = await requirePermission("PAYMENTS_CREATE");
  const payment = await createPaymentRecord(formPaymentData(formData, workspace.id));
  await recordAudit({
    workspaceId: workspace.id,
    actor: session.user,
    action: "PAYMENT_CREATED",
    entityType: "Payment",
    entityId: payment.id,
    summary: `Створив(ла) платіж ${Number(payment.amount).toFixed(2)} zł`,
    metadata: { residentId: payment.residentId, paid: payment.paid, method: payment.method },
  });

  revalidatePaymentPages();
  redirect(`/payments/${payment.id}`);
}

export async function updatePaymentFromForm(formData: FormData) {
  const { workspace, session } = await requirePermission("PAYMENTS_EDIT");
  const paymentId = Number(formData.get("paymentId"));
  const payment = await updatePaymentRecord(paymentId, formPaymentData(formData, workspace.id));
  await recordAudit({
    workspaceId: workspace.id,
    actor: session.user,
    action: "PAYMENT_UPDATED",
    entityType: "Payment",
    entityId: payment.id,
    summary: `Змінив(ла) платіж #${payment.id}`,
    metadata: { residentId: payment.residentId, paid: payment.paid, method: payment.method },
  });

  revalidatePaymentPages();
  redirect(`/payments/${payment.id}`);
}
