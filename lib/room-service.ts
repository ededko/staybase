import { prisma } from "@/lib/prisma";

type RoomInput = {
  workspaceId: string;
  hostelId: number;
  name: string;
  floor: number | null;
};

export async function createRoomWithBeds(input: RoomInput, bedsCount: number) {
  return prisma.$transaction(async (tx) => {
    const hostel = await tx.hostel.findFirst({
      where: { id: input.hostelId, workspaceId: input.workspaceId },
      select: { id: true },
    });
    if (!hostel) throw new Error("Хостел не знайдено");

    const room = await tx.room.create({
      data: { hostelId: input.hostelId, name: input.name, floor: input.floor },
    });

    await tx.bed.createMany({
      data: Array.from({ length: bedsCount }, (_, index) => ({
        roomId: room.id,
        number: index + 1,
      })),
    });

    return room;
  });
}

export async function updateRoomRecord(roomId: number, input: RoomInput) {
  const room = await prisma.room.findFirst({
    where: { id: roomId, hostelId: input.hostelId, hostel: { workspaceId: input.workspaceId } },
    select: { id: true },
  });
  if (!room) throw new Error("Кімнату не знайдено");

  return prisma.room.update({
    where: { id: room.id },
    data: {
      name: input.name,
      floor: input.floor,
    },
  });
}

export async function deleteRoomRecord(workspaceId: string, roomId: number) {
  return prisma.$transaction(async (tx) => {
    const room = await tx.room.findUnique({
      where: { id: roomId, hostel: { workspaceId } },
      include: {
        beds: {
          include: {
            resident: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!room) return { deleted: false, reason: "not-found" as const };

    if (room.beds.some((bed) => bed.resident)) {
      return { deleted: false, reason: "occupied" as const };
    }

    await tx.bed.deleteMany({ where: { roomId } });
    await tx.room.delete({ where: { id: roomId } });

    return { deleted: true as const };
  });
}
