import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { deleteRoom } from "@/app/actions/rooms";
import { requireWorkspace } from "@/lib/session";

type Props = {
  params: Promise<{ id: string; roomId: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function RoomPage({ params, searchParams }: Props) {
  const { id: hostelId, roomId } = await params;
  const { error } = await searchParams;
  const { workspace } = await requireWorkspace();

  const room = await prisma.room.findFirst({
    where: { id: Number(roomId), hostel: { workspaceId: workspace.id } },
    include: {
      beds: {
        orderBy: { number: "asc" },
        include: { resident: true },
      },
    },
  });

  if (!room || room.hostelId !== Number(hostelId)) notFound();

  const activeBeds = room.beds.filter((bed) => !bed.isDisabled);
  const occupiedBeds = activeBeds.filter((bed) => bed.resident).length;
  const freeBeds = activeBeds.length - occupiedBeds;
  const disabledBeds = room.beds.length - activeBeds.length;

  return (
    <div className="p-8">
      <Link href={`/hostels/${hostelId}/rooms`} className="text-blue-600 hover:underline">
        ← Назад до кімнат
      </Link>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">{room.name}</h1>
          <p className="mt-2 text-slate-500">Поверх: {room.floor ?? "—"}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href={`/hostels/${hostelId}/rooms/${room.id}/edit`} className="rounded-xl bg-blue-600 px-5 py-3 text-white hover:bg-blue-700">
            Редагувати кімнату
          </Link>
          <Link href={`/hostels/${hostelId}/rooms/${room.id}/beds/new`} className="rounded-xl bg-slate-900 px-5 py-3 text-white hover:bg-slate-800">
            + Додати ліжко
          </Link>
        </div>
      </div>

      {error === "occupied" && (
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
          Кімнату не можна видалити, поки в ній є заселені мешканці.
        </p>
      )}

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <div className="rounded-xl border bg-white p-5"><p className="text-slate-500">Місткість</p><p className="mt-2 text-3xl font-bold">{activeBeds.length}</p></div>
        <div className="rounded-xl border bg-white p-5"><p className="text-slate-500">Зайнято</p><p className="mt-2 text-3xl font-bold text-red-600">{occupiedBeds}</p></div>
        <div className="rounded-xl border bg-white p-5"><p className="text-slate-500">Вільно</p><p className="mt-2 text-3xl font-bold text-green-600">{freeBeds}</p></div>
        <div className="rounded-xl border bg-white p-5"><p className="text-slate-500">Вимкнено</p><p className="mt-2 text-3xl font-bold text-slate-500">{disabledBeds}</p></div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2">
        {room.beds.map((bed) => (
          <div key={bed.id} className="rounded-2xl border bg-white p-5 shadow-sm">
            <h2 className="text-xl font-bold">🛏 Ліжко {bed.number}</h2>
            <p className="mt-3">Статус: {bed.isDisabled ? <span className="font-semibold text-slate-500">⚪ Вимкнене</span> : bed.resident ? <span className="font-semibold text-red-600">🔴 Зайняте</span> : <span className="font-semibold text-green-600">🟢 Вільне</span>}</p>
            <p className="mt-2 text-slate-600">Мешканець: {bed.resident ? `${bed.resident.firstName} ${bed.resident.lastName}` : "—"}</p>
            {bed.resident && <p className="mt-1 text-sm text-slate-500">📞 {bed.resident.phone || "Не вказано"}</p>}
            <Link href={`/hostels/${hostelId}/rooms/${room.id}/beds/${bed.id}`} className="mt-5 inline-block rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">Відкрити</Link>
          </div>
        ))}
      </div>

      <form action={deleteRoom} className="mt-8 border-t pt-6">
        <input type="hidden" name="roomId" value={room.id} />
        <input type="hidden" name="hostelId" value={hostelId} />
        <button className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700">Видалити кімнату</button>
      </form>
    </div>
  );
}
