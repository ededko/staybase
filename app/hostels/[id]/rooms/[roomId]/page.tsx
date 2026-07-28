import Link from "next/link";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{
    id: string;
    roomId: string;
  }>;
};

export default async function RoomPage({ params }: Props) {
  const { id: hostelId, roomId } = await params;

  const room = await prisma.room.findUnique({
    where: {
      id: Number(roomId),
    },
    include: {
      beds: {
        orderBy: {
          number: "asc",
        },
        include: {
          resident: true,
        },
      },
    },
  });

  if (!room) {
    return <div className="p-8">Кімнату не знайдено.</div>;
  }

  const occupiedBeds = room.beds.filter((bed) => bed.resident).length;
  const freeBeds = room.beds.length - occupiedBeds;

  return (
    <div className="p-8">
      <Link
        href={`/hostels/${hostelId}`}
        className="text-blue-600 hover:underline"
      >
        ← Назад до хостелу
      </Link>

      <div className="mt-6 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">{room.name}</h1>

          <p className="mt-2 text-slate-500">
            Ліжка у цій кімнаті
          </p>
        </div>

        <Link
          href={`/hostels/${hostelId}/rooms/${room.id}/beds/new`}
          className="rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700"
        >
          + Додати ліжко
        </Link>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border p-5">
          <p className="text-slate-500">Всього ліжок</p>
          <p className="mt-2 text-3xl font-bold">{room.beds.length}</p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-slate-500">Зайнято</p>
          <p className="mt-2 text-3xl font-bold text-red-600">
            {occupiedBeds}
          </p>
        </div>

        <div className="rounded-xl border p-5">
          <p className="text-slate-500">Вільно</p>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {freeBeds}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {room.beds.map((bed) => (
          <div
            key={bed.id}
            className="rounded-2xl border p-5 shadow-sm"
          >
            <h2 className="text-xl font-bold">
              🛏 Ліжко {bed.number}
            </h2>

            <p className="mt-3">
              Статус:{" "}
              {bed.resident ? (
                <span className="font-semibold text-red-600">
                  🔴 Зайняте
                </span>
              ) : (
                <span className="font-semibold text-green-600">
                  🟢 Вільне
                </span>
              )}
            </p>

            <p className="mt-2 text-slate-600">
              Мешканець:{" "}
              {bed.resident
                ? `${bed.resident.firstName} ${bed.resident.lastName}`
                : "—"}
            </p>

            {bed.resident && (
              <p className="mt-1 text-sm text-slate-500">
                📞 {bed.resident.phone || "Не вказано"}
              </p>
            )}

            <Link
              href={`/hostels/${hostelId}/rooms/${room.id}/beds/${bed.id}`}
              className="mt-5 inline-block rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
            >
              Відкрити
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}