import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { createBed } from "@/app/actions/beds";
import { requireWorkspace } from "@/lib/session";

type Props = {
  params: Promise<{
    id: string;
    roomId: string;
  }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function NewBedPage({ params, searchParams }: Props) {
  const { id: hostelId, roomId } = await params;
  const { error } = await searchParams;
  const { workspace } = await requireWorkspace();

  const room = await prisma.room.findFirst({
    where: { id: Number(roomId), hostelId: Number(hostelId), hostel: { workspaceId: workspace.id } },
    include: { beds: { select: { number: true } } },
  });

  if (!room) notFound();

  const nextNumber = Math.max(0, ...room.beds.map((bed) => bed.number)) + 1;

  return (
    <div className="p-8 max-w-xl">
      <Link
        href={`/hostels/${hostelId}/rooms/${roomId}`}
        className="text-blue-600 hover:underline"
      >
        ← Назад
      </Link>

      <h1 className="mt-6 text-3xl font-bold">
        Додати ліжко
      </h1>

      {error === "duplicate" && (
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
          Ліжко з таким номером уже є в цій кімнаті.
        </p>
      )}

      <form action={createBed} className="mt-8 space-y-6">
        <input
          type="hidden"
          name="hostelId"
          value={hostelId}
        />

        <input
          type="hidden"
          name="roomId"
          value={roomId}
        />

        <div>
          <label className="mb-2 block font-medium">
            Номер ліжка
          </label>

          <input
            name="number"
            type="number"
          required
          min={1}
          defaultValue={nextNumber}
          className="w-full rounded-xl border p-3"
        />
      </div>

        <div>
          <label className="mb-2 block font-medium">Примітка</label>
          <textarea
            name="notes"
            rows={4}
            placeholder="Наприклад: верхнє ліжко біля вікна"
            className="w-full rounded-xl border p-3"
          />
        </div>

        <button
          type="submit"
          className="rounded-xl bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Створити
        </button>
      </form>
    </div>
  );
}
