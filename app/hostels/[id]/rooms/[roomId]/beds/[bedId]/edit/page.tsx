import Link from "next/link";
import { notFound } from "next/navigation";
import { updateBed } from "@/app/actions/beds";
import { requireWorkspace } from "@/lib/session";
import { prisma } from "@/lib/prisma";

type Props = {
  params: Promise<{ id: string; roomId: string; bedId: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function EditBedPage({ params, searchParams }: Props) {
  const { id: hostelId, roomId, bedId } = await params;
  const { error } = await searchParams;
  const { workspace } = await requireWorkspace();
  const bed = await prisma.bed.findFirst({
    where: {
      id: Number(bedId),
      roomId: Number(roomId),
      room: { hostelId: Number(hostelId), hostel: { workspaceId: workspace.id } },
    },
  });

  if (!bed) notFound();

  return (
    <div className="max-w-xl p-8">
      <Link
        href={`/hostels/${hostelId}/rooms/${roomId}/beds/${bedId}`}
        className="text-blue-600 hover:underline"
      >
        ← Назад до ліжка
      </Link>

      <h1 className="mt-6 text-3xl font-bold">Редагувати ліжко</h1>

      {error === "duplicate" && (
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
          Ліжко з таким номером уже є в цій кімнаті.
        </p>
      )}

      <form
        action={updateBed}
        className="mt-8 space-y-4 rounded-2xl border bg-white p-6 shadow-sm"
      >
        <input type="hidden" name="hostelId" value={hostelId} />
        <input type="hidden" name="roomId" value={roomId} />
        <input type="hidden" name="bedId" value={bed.id} />

        <div>
          <label className="mb-1 block text-sm text-slate-600">Номер ліжка</label>
          <input
            name="number"
            type="number"
            min={1}
            required
            defaultValue={bed.number}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Примітка</label>
          <textarea
            name="notes"
            rows={4}
            defaultValue={bed.notes ?? ""}
            className="w-full rounded-lg border p-3"
          />
        </div>

        <button className="rounded-lg bg-slate-900 px-5 py-3 text-white hover:bg-slate-800">
          Зберегти зміни
        </button>
      </form>
    </div>
  );
}
