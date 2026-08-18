import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateRoom } from "@/app/actions/rooms";
import { requireWorkspace } from "@/lib/session";

type Props = {
  params: Promise<{ id: string; roomId: string }>;
};

export default async function EditRoomPage({ params }: Props) {
  const { id: hostelId, roomId } = await params;
  const { workspace } = await requireWorkspace();
  const room = await prisma.room.findFirst({ where: { id: Number(roomId), hostel: { workspaceId: workspace.id } } });

  if (!room || room.hostelId !== Number(hostelId)) notFound();

  return (
    <div className="max-w-xl p-4 sm:p-6 lg:p-8">
      <Link href={`/hostels/${hostelId}/rooms/${roomId}`} className="text-blue-600 hover:underline">
        ← Назад до кімнати
      </Link>

      <h1 className="mt-6 text-3xl font-bold">Редагувати кімнату</h1>

      <form action={updateRoom} className="mt-8 space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
        <input type="hidden" name="roomId" value={room.id} />
        <input type="hidden" name="hostelId" value={hostelId} />

        <div>
          <label className="mb-1 block text-sm text-slate-600">Назва кімнати</label>
          <input name="name" required defaultValue={room.name} className="w-full rounded-lg border p-3" />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Поверх</label>
          <input name="floor" type="number" defaultValue={room.floor ?? ""} className="w-full rounded-lg border p-3" />
        </div>

        <button className="rounded-lg bg-slate-900 px-5 py-3 text-white hover:bg-slate-800">Зберегти зміни</button>
      </form>
    </div>
  );
}
