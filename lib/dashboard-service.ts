import { prisma } from "@/lib/prisma";

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfNextMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 1);
}

export async function getDashboardData(workspaceId: string, now = new Date()) {
  const upcomingUntil = new Date(now);
  upcomingUntil.setDate(upcomingUntil.getDate() + 7);

  const paymentInclude = {
    resident: {
      include: {
        bed: {
          include: {
            room: { include: { hostel: true } },
          },
        },
      },
    },
  } as const;

  const [
    totalHostels,
    totalRooms,
    totalBeds,
    occupiedBeds,
    activeResidents,
    overduePayments,
    upcomingPayments,
    monthlyIncome,
    depositsHeld,
  ] = await Promise.all([
    prisma.hostel.count({ where: { workspaceId } }),
    prisma.room.count({ where: { hostel: { workspaceId } } }),
    prisma.bed.count({ where: { isDisabled: false, room: { hostel: { workspaceId } } } }),
    prisma.bed.count({
      where: { isDisabled: false, room: { hostel: { workspaceId } }, resident: { is: { isActive: true } } },
    }),
    prisma.resident.count({ where: { isActive: true, workspaceId } }),
    prisma.payment.findMany({
      where: { paid: false, dueDate: { lt: now }, resident: { workspaceId } },
      include: paymentInclude,
      orderBy: { dueDate: "asc" },
    }),
    prisma.payment.findMany({
      where: { paid: false, dueDate: { gte: now, lte: upcomingUntil }, resident: { workspaceId } },
      include: paymentInclude,
      orderBy: { dueDate: "asc" },
    }),
    prisma.payment.aggregate({
      where: {
        paid: true,
        type: { not: "DEPOSIT" },
        paidAt: { gte: startOfMonth(now), lt: startOfNextMonth(now) },
        resident: { workspaceId },
      },
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { paid: true, type: "DEPOSIT", resident: { workspaceId } },
      _sum: { amount: true },
    }),
  ]);

  return {
    totalHostels,
    totalRooms,
    totalBeds,
    occupiedBeds,
    freeBeds: totalBeds - occupiedBeds,
    occupancyPercentage: totalBeds
      ? Math.round((occupiedBeds / totalBeds) * 100)
      : 0,
    activeResidents,
    overdueAmount: overduePayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    ),
    upcomingAmount: upcomingPayments.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    ),
    monthlyIncome: Number(monthlyIncome._sum.amount || 0),
    depositsHeld: Number(depositsHeld._sum.amount || 0),
    overduePayments,
    upcomingPayments,
  };
}
