import { PaymentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PaymentData = {
  workspaceId: string;
  residentId: number;
  amount: string;
  dueDate: Date;
  notes?: string;
  type: PaymentType;
  paid: boolean;
  paidAt?: Date | null;
};

export function getPaymentStatus(
  payment: { paid: boolean; dueDate: Date },
  now = new Date()
) {
  if (payment.paid) return "paid";
  return payment.dueDate < now ? "overdue" : "pending";
}

export async function createPaymentRecord(data: PaymentData) {
  await validatePaymentData(data);

  return prisma.payment.create({
    data: {
      residentId: data.residentId,
      amount: data.amount,
      dueDate: data.dueDate,
      notes: data.notes?.trim() || null,
      type: data.type,
      paid: data.paid,
      paidAt: data.paid ? data.paidAt || new Date() : null,
    },
  });
}

export async function updatePaymentRecord(paymentId: number, data: PaymentData) {
  await validatePaymentData(data);

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, resident: { workspaceId: data.workspaceId } },
    select: { id: true },
  });
  if (!payment) throw new Error("Платіж не знайдено");

  return prisma.payment.update({
    where: { id: payment.id },
    data: {
      residentId: data.residentId,
      amount: data.amount,
      dueDate: data.dueDate,
      notes: data.notes?.trim() || null,
      type: data.type,
      paid: data.paid,
      paidAt: data.paid ? data.paidAt || new Date() : null,
    },
  });
}

async function validatePaymentData(data: PaymentData) {
  const amount = Number(data.amount);

  if (
    !Number.isInteger(data.residentId) ||
    data.residentId < 1 ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    Number.isNaN(data.dueDate.getTime()) ||
    (data.paidAt && Number.isNaN(data.paidAt.getTime()))
  ) {
    throw new Error("Некоректні дані платежу");
  }

  const resident = await prisma.resident.findUnique({
    where: { id: data.residentId, workspaceId: data.workspaceId },
    select: { id: true },
  });

  if (!resident) throw new Error("Мешканця не знайдено");
}

export async function togglePaymentRecord(workspaceId: string, paymentId: number) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, resident: { workspaceId } },
  });

  if (!payment) return null;

  const paid = !payment.paid;

  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      paid,
      paidAt: paid ? new Date() : null,
    },
  });
}
