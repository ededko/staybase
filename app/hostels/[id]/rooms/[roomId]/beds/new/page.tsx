import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{
    id: string;
    roomId: string;
  }>;
};

async function createBed(formData: FormData) {
  "use server";

  const hostelId = Number(formData.get("hostelId"));
  const roomId = Number(formData.get("roomId"));
  const number = Number(formData.get("number"));

  await prisma.bed.create({
    data: {
      number,
      roomId,
    },
  });

  redirect(`/hostels/${hostelId}/rooms/${roomId}`);
}

export default async function NewBedPage({ params }: Props) {
  const { id: hostelId, roomId } = await params;

  const room = await prisma.room.findUnique({
    where: {
      id: Number(roomId),
    },
  });

  if (!room) {
    return <div className="p-8">Кімнату не знайдено.</div>;
  }

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