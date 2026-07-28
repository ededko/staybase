import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import CreateRoomButton from "@/components/CreateRoomButton";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RoomsPage({ params }: Props) {
  const { id } = await params;

  const hostel = await prisma.hostel.findUnique({
    where: {
      id: Number(id),
    },
    include: {
      rooms: {
        include: {
          beds: {
            include: {
              resident: true,
            },
          },
        },
      },
    },
  });

  if (!hostel) {
    notFound();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            Кімнати — {hostel.name}
          </h1>

          <p className="mt-2 text-slate-500">
            {hostel.address}
          </p>
        </div>

        <CreateRoomButton hostelId={hostel.id} />
      </div>

      <div className="mt-8 space-y-4">
        {hostel.rooms.map((room) => {
          const occupied = room.beds.filter(
            (bed) => bed.resident
          ).length;

          return (
            <div
              key={room.id}
              className="flex items-center justify-between rounded-2xl border bg-white p-6 shadow-sm"
            >
              <div>
                <h2 className="text-2xl font-bold">
                  {room.name}
                </h2>

                <p className="text-slate-500">
  Ліжок: {room.beds.length} • Зайнято: {occupied}
</p>

            
              </div>

              <Link
                href={`/hostels/${id}/rooms/${room.id}`}
                className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
              >
                Відкрити
              </Link>
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