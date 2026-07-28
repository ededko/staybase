import { prisma } from "@/lib/prisma";

type PaymentData = {
  residentId: number;
  amount: string;
  dueDate: Date;
  notes?: string;
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
  return prisma.payment.create({
    data: {
      residentId: data.residentId,
      amount: data.amount,
      dueDate: data.dueDate,
      notes: data.notes?.trim() || null,
      paid: data.paid,
      paidAt: data.paid ? data.paidAt || new Date() : null,
    },
  });
}

export async function updatePaymentRecord(paymentId: number, data: PaymentData) {
  return prisma.payment.update({
    where: { id: paymentId },
    data: {
      residentId: data.residentId,
      amount: data.amount,
      dueDate: data.dueDate,
      notes: data.notes?.trim() || null,
      paid: data.paid,
      paidAt: data.paid ? data.paidAt || new Date() : null,
    },
  });
}

export async function togglePaymentRecord(paymentId: number) {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });

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
