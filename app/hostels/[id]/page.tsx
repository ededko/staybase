import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireWorkspace } from "@/lib/session";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function HostelPage({ params }: Props) {
  const { id } = await params;
  const { workspace } = await requireWorkspace();

  const hostel = await prisma.hostel.findFirst({
    where: {
      id: Number(id),
      workspaceId: workspace.id,
    },
    include: {
      rooms: {
        include: {
          beds: {
            select: {
              id: true,
              resident: {
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  if (!hostel) {
    notFound();
  }

  const beds = hostel.rooms.flatMap((room) => room.beds);
  const occupiedBeds = beds.filter((bed) => bed.resident).length;
  const freeBeds = beds.length - occupiedBeds;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            {hostel.name}
          </h1>

          <p className="mt-2 text-slate-500">
            {hostel.address}
          </p>

          <div className="mt-8 flex gap-3 border-b pb-4">
            <button className="rounded-lg bg-slate-900 px-4 py-2 text-white">
              🏠 Огляд
            </button>

            <Link
              href={`/hostels/${id}/rooms`}
              className="rounded-lg px-4 py-2 hover:bg-slate-100"
            >
              🛏 Кімнати
            </Link>

            <button className="rounded-lg px-4 py-2 hover:bg-slate-100">
              👥 Мешканці
            </button>

            <button className="rounded-lg px-4 py-2 hover:bg-slate-100">
              💳 Платежі
            </button>

            <button className="rounded-lg px-4 py-2 hover:bg-slate-100">
              📝 Заявки
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-4">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-slate-500">Кімнат</p>
          <h2 className="mt-3 text-4xl font-bold">{hostel.rooms.length}</h2>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-slate-500">Ліжок</p>
          <h2 className="mt-3 text-4xl font-bold">{beds.length}</h2>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-slate-500">Мешканців</p>
          <h2 className="mt-3 text-4xl font-bold">{occupiedBeds}</h2>
        </div>

        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <p className="text-slate-500">Вільно</p>
          <h2 className="mt-3 text-4xl font-bold text-green-600">
            {freeBeds}
          </h2>
        </div>
      </div>
    </div>
  );
}
