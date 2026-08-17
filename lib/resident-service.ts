import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type ResidentInput = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  notes: string;
  checkIn: Date;
  checkOut: Date | null;
};

export function getResidentStatus(resident: {
  isActive: boolean;
  checkOut: Date | null;
}) {
  if (!resident.isActive) return "archived";
  return resident.checkOut ? "scheduled-departure" : "active";
}

type Assignment = {
  workspaceId: string;
  hostelId: number;
  roomId: number;
  bedId: number;
};

function residentData(input: ResidentInput) {
  return {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    phone: input.phone.trim() || null,
    email: input.email.trim() || null,
    notes: input.notes.trim() || null,
    checkIn: input.checkIn,
    checkOut: input.checkOut,
  };
}

async function validateAvailableBed(
  tx: Prisma.TransactionClient,
  assignment: Assignment,
  residentId?: number
) {
  const bed = await tx.bed.findFirst({
    where: {
      id: assignment.bedId,
      roomId: assignment.roomId,
      isDisabled: false,
      room: {
        hostelId: assignment.hostelId,
        hostel: { workspaceId: assignment.workspaceId },
      },
    },
    include: {
      resident: { select: { id: true } },
    },
  });

  if (!bed || (bed.resident && bed.resident.id !== residentId)) {
    throw new Error("Обране ліжко недоступне");
  }
}

export async function createResidentWithAssignment(
  input: ResidentInput,
  assignment: Assignment
) {
  return prisma.$transaction(async (tx) => {
    await validateAvailableBed(tx, assignment);

    const resident = await tx.resident.create({
      data: {
        ...residentData(input),
        workspaceId: assignment.workspaceId,
        bedId: assignment.bedId,
      },
    });

    await tx.stay.create({
      data: {
        residentId: resident.id,
        bedId: assignment.bedId,
        startedAt: input.checkIn,
      },
    });

    return resident;
  });
}

export async function updateResidentWithAssignment(
  residentId: number,
  input: ResidentInput,
  assignment: Assignment
) {
  return prisma.$transaction(async (tx) => {
    await validateAvailableBed(tx, assignment, residentId);

    const resident = await tx.resident.findFirst({
      where: { id: residentId, workspaceId: assignment.workspaceId },
      select: { bedId: true, isActive: true },
    });

    if (!resident || !resident.isActive) {
      throw new Error("Активного мешканця не знайдено");
    }

    if (resident.bedId !== assignment.bedId) {
      const movedAt = new Date();

      await tx.stay.updateMany({
        where: { residentId, endedAt: null },
        data: { endedAt: movedAt },
      });

      await tx.stay.create({
        data: {
          residentId,
          bedId: assignment.bedId,
          startedAt: movedAt,
        },
      });
    }

    return tx.resident.update({
      where: { id: residentId },
      data: {
        ...residentData(input),
        bedId: assignment.bedId,
      },
    });
  });
}

export async function archiveResidentRecord(workspaceId: string, residentId: number) {
  return prisma.$transaction(async (tx) => {
    const checkedOutAt = new Date();

    const resident = await tx.resident.findFirst({
      where: { id: residentId, workspaceId },
      select: { id: true },
    });
    if (!resident) throw new Error("Мешканця не знайдено");

    await tx.stay.updateMany({
      where: { residentId, endedAt: null },
      data: { endedAt: checkedOutAt },
    });

    return tx.resident.update({
      where: { id: residentId },
      data: {
        isActive: false,
        archivedAt: checkedOutAt,
        checkOut: checkedOutAt,
        bedId: null,
      },
    });
  });
}
