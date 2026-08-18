import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CreateRoomButton from "@/components/CreateRoomButton";
import { requireWorkspace } from "@/lib/session";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function RoomsPage({ params }: Props) {
  const { id } = await params;
  const hostelId = Number(id);
  const { workspace } = await requireWorkspace();

  const hostel = await prisma.hostel.findFirst({
    where: { id: hostelId, workspaceId: workspace.id },
    include: {
      rooms: {
        orderBy: [{ floor: "asc" }, { name: "asc" }],
        include: {
          beds: {
            select: {
              id: true,
              isDisabled: true,
              resident: {
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  if (!hostel) notFound();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">Кімнати — {hostel.name}</h1>
          <p className="mt-2 text-slate-500">{hostel.address}</p>
        </div>

        <CreateRoomButton hostelId={hostel.id} />
      </div>

      <div className="room-grid mt-6 grid gap-3 lg:grid-cols-2 2xl:grid-cols-3">
        {hostel.rooms.map((room) => {
          const activeBeds = room.beds.filter((bed) => !bed.isDisabled);
          const capacity = activeBeds.length;
          const occupied = activeBeds.filter((bed) => bed.resident).length;
          const free = capacity - occupied;
          const isFull = capacity > 0 && free === 0;

          return (
            <div
              key={room.id}
              className="room-card rounded-2xl border bg-white shadow-sm"
            >
              <div>
                <h2 className="text-2xl font-bold">{room.name}</h2>
                <p className="mt-1 text-slate-500">
                  Поверх: {room.floor ?? "—"}
                </p>
              </div>

              <div className="room-card-stats grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-sm text-slate-500">Місткість</p>
                  <p className="mt-1 text-xl font-bold">{capacity}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Зайнято</p>
                  <p className="mt-1 text-xl font-bold text-red-600">{occupied}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Вільно</p>
                  <p className="mt-1 text-xl font-bold text-green-600">{free}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className={isFull ? "rounded-full bg-red-100 px-3 py-1 text-sm text-red-700" : "rounded-full bg-green-100 px-3 py-1 text-sm text-green-700"}>
                  {isFull ? "Повна" : "Доступна"}
                </span>
                <Link
                  href={`/hostels/${hostel.id}/rooms/${room.id}`}
                  className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
                >
                  Відкрити
                </Link>
              </div>
            </div>
          );
        })}

        {hostel.rooms.length === 0 && (
          <div className="rounded-2xl border border-dashed p-10 text-center text-slate-500">
            У цьому хостелі ще немає кімнат.
          </div>
        )}
      </div>
    </div>
  );
}
