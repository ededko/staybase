import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type BedInput = {
  workspaceId: string;
  hostelId: number;
  roomId: number;
  number: number;
  notes: string;
};

type BedMutationResult =
  | { success: true; bedId: number }
  | { success: false; reason: "not-found" | "duplicate" | "occupied" };

function isUniqueConstraintError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

async function roomExists(
  tx: Prisma.TransactionClient,
  workspaceId: string,
  hostelId: number,
  roomId: number
) {
  return tx.room.findFirst({
    where: { id: roomId, hostelId, hostel: { workspaceId } },
    select: { id: true },
  });
}

export async function createBedRecord(
  input: BedInput
): Promise<BedMutationResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      if (!(await roomExists(tx, input.workspaceId, input.hostelId, input.roomId))) {
        return { success: false, reason: "not-found" } as const;
      }

      const duplicate = await tx.bed.findFirst({
        where: { roomId: input.roomId, number: input.number },
        select: { id: true },
      });

      if (duplicate) return { success: false, reason: "duplicate" } as const;

      const bed = await tx.bed.create({
        data: {
          roomId: input.roomId,
          number: input.number,
          notes: input.notes.trim() || null,
        },
      });

      return { success: true, bedId: bed.id } as const;
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, reason: "duplicate" };
    }
    throw error;
  }
}

export async function updateBedRecord(
  bedId: number,
  input: BedInput
): Promise<BedMutationResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const bed = await tx.bed.findFirst({
        where: {
          id: bedId,
          roomId: input.roomId,
          room: { hostelId: input.hostelId, hostel: { workspaceId: input.workspaceId } },
        },
        select: { id: true },
      });

      if (!bed) return { success: false, reason: "not-found" } as const;

      const duplicate = await tx.bed.findFirst({
        where: {
          roomId: input.roomId,
          number: input.number,
          NOT: { id: bedId },
        },
        select: { id: true },
      });

      if (duplicate) return { success: false, reason: "duplicate" } as const;

      await tx.bed.update({
        where: { id: bedId },
        data: {
          number: input.number,
          notes: input.notes.trim() || null,
        },
      });

      return { success: true, bedId } as const;
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return { success: false, reason: "duplicate" };
    }
    throw error;
  }
}

export async function toggleBedDisabledRecord(
  workspaceId: string,
  hostelId: number,
  roomId: number,
  bedId: number
): Promise<BedMutationResult> {
  return prisma.$transaction(async (tx) => {
    const bed = await tx.bed.findFirst({
      where: { id: bedId, roomId, room: { hostelId, hostel: { workspaceId } } },
      include: { resident: { select: { id: true } } },
    });

    if (!bed) return { success: false, reason: "not-found" } as const;
    if (bed.resident) return { success: false, reason: "occupied" } as const;

    await tx.bed.update({
      where: { id: bedId },
      data: { isDisabled: !bed.isDisabled },
    });

    return { success: true, bedId } as const;
  });
}

export async function deleteBedRecord(
  workspaceId: string,
  hostelId: number,
  roomId: number,
  bedId: number
): Promise<BedMutationResult> {
  return prisma.$transaction(async (tx) => {
    const bed = await tx.bed.findFirst({
      where: { id: bedId, roomId, room: { hostelId, hostel: { workspaceId } } },
      include: { resident: { select: { id: true } } },
    });

    if (!bed) return { success: false, reason: "not-found" } as const;
    if (bed.resident) return { success: false, reason: "occupied" } as const;

    await tx.bed.delete({ where: { id: bedId } });
    return { success: true, bedId } as const;
  });
}
