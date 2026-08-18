import { PaymentMethod, PaymentType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PaymentData = {
  workspaceId: string;
  residentId: number;
  amount: string;
  dueDate: Date;
  notes?: string;
  type: PaymentType;
  method: PaymentMethod;
  paid: boolean;
  paidAt?: Date | null;
  paidThrough?: Date | null;
};

function addMonth(date: Date) {
  const result = new Date(date);
  const day = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() + 1);
  const lastDay = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
  result.setDate(Math.min(day, lastDay));
  return result;
}

export function getPaymentStatus(
  payment: { paid: boolean; dueDate: Date },
  now = new Date()
) {
  if (payment.paid) return "paid";
  return payment.dueDate < now ? "overdue" : "pending";
}

export async function createPaymentRecord(data: PaymentData) {
  const resident = await validatePaymentData(data);
  const paidThrough = data.paid && data.type === PaymentType.RENT
    ? data.paidThrough || addMonth(resident.paidThrough || data.dueDate)
    : data.paidThrough || null;

  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({ data: {
      residentId: data.residentId,
      amount: data.amount,
      dueDate: data.dueDate,
      notes: data.notes?.trim() || null,
      type: data.type,
      method: data.method,
      paid: data.paid,
      paidAt: data.paid ? data.paidAt || new Date() : null,
      paidThrough,
    }});
    if (data.paid && data.type === PaymentType.RENT && paidThrough) {
      await tx.resident.updateMany({
        where: { id: data.residentId, OR: [{ paidThrough: null }, { paidThrough: { lt: paidThrough } }] },
        data: { paidThrough },
      });
    }
    return payment;
  });
}

export async function updatePaymentRecord(paymentId: number, data: PaymentData) {
  await validatePaymentData(data);

  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, resident: { workspaceId: data.workspaceId } },
    select: { id: true },
  });
  if (!payment) throw new Error("Платіж не знайдено");

  return prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({ where: { id: payment.id }, data: {
      residentId: data.residentId,
      amount: data.amount,
      dueDate: data.dueDate,
      notes: data.notes?.trim() || null,
      type: data.type,
      method: data.method,
      paid: data.paid,
      paidAt: data.paid ? data.paidAt || new Date() : null,
      paidThrough: data.paidThrough || null,
    }});
    if (data.paid && data.type === PaymentType.RENT && data.paidThrough) {
      await tx.resident.updateMany({
        where: { id: data.residentId, OR: [{ paidThrough: null }, { paidThrough: { lt: data.paidThrough } }] },
        data: { paidThrough: data.paidThrough },
      });
    }
    return updated;
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
    select: { id: true, paidThrough: true },
  });

  if (!resident) throw new Error("Мешканця не знайдено");
  return resident;
}

export async function togglePaymentRecord(workspaceId: string, paymentId: number) {
  const payment = await prisma.payment.findFirst({
    where: { id: paymentId, resident: { workspaceId } },
    include: { resident: { select: { paidThrough: true } } },
  });

  if (!payment) return null;

  const paid = !payment.paid;

  const paidThrough = paid && payment.type === PaymentType.RENT
    ? payment.paidThrough || addMonth(payment.resident.paidThrough || payment.dueDate)
    : payment.paidThrough;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.payment.update({ where: { id: paymentId }, data: {
      paid,
      paidAt: paid ? new Date() : null,
      paidThrough,
    }});
    if (paid && payment.type === PaymentType.RENT && paidThrough) {
      await tx.resident.updateMany({
        where: { id: payment.residentId, OR: [{ paidThrough: null }, { paidThrough: { lt: paidThrough } }] },
        data: { paidThrough },
      });
    }
    return updated;
  });
}
