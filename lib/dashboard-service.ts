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
    hostels,
    residentDemographics,
    newLeadApplications,
    openMaintenanceTickets,
    newQualityEntries,
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
    prisma.hostel.findMany({
      where: { workspaceId },
      include: { rooms: { include: { beds: { where: { isDisabled: false }, include: { resident: { select: { isActive: true } } } } } } },
      orderBy: { name: "asc" },
    }),
    prisma.resident.findMany({
      where: { workspaceId, isActive: true },
      select: { gender: true, birthDate: true },
    }),
    prisma.leadApplication.count({ where: { workspaceId, status: "NEW" } }),
    prisma.maintenanceTicket.count({ where: { workspaceId, status: { not: "DONE" } } }),
    prisma.qualityEntry.count({ where: { workspaceId, status: "NEW" } }),
  ]);

  const hostelOccupancy = hostels.map((hostel) => {
    const beds = hostel.rooms.flatMap((room) => room.beds);
    const occupied = beds.filter((bed) => bed.resident?.isActive).length;
    return {
      id: hostel.id,
      name: hostel.name,
      address: hostel.address,
      rooms: hostel.rooms.length,
      beds: beds.length,
      occupied,
      free: beds.length - occupied,
      percentage: beds.length ? Math.round((occupied / beds.length) * 100) : 0,
    };
  });

  const ages = residentDemographics.flatMap((resident) => resident.birthDate
    ? [Math.max(0, now.getFullYear() - resident.birthDate.getFullYear() - (now < new Date(now.getFullYear(), resident.birthDate.getMonth(), resident.birthDate.getDate()) ? 1 : 0))]
    : []);

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
    hostelOccupancy,
    demographics: {
      male: residentDemographics.filter((item) => item.gender === "MALE").length,
      female: residentDemographics.filter((item) => item.gender === "FEMALE").length,
      unspecified: residentDemographics.filter((item) => !item.gender || item.gender === "OTHER").length,
      averageAge: ages.length ? Math.round(ages.reduce((sum, age) => sum + age, 0) / ages.length) : null,
    },
    operations: { newLeadApplications, openMaintenanceTickets, newQualityEntries },
  };
}
