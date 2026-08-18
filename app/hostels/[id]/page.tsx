import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { requireWorkspace } from "@/lib/session";
import { deleteHostel } from "@/app/actions/hostels";

type Props = {
  params: Promise<{
    id: string;
  }>; 
  searchParams: Promise<{ error?: string }>;
};

export default async function HostelPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { workspace, permissions } = await requireWorkspace();
  const { error } = await searchParams;

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
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">
            {hostel.name}
          </h1>

          <p className="mt-2 text-slate-500">
            {hostel.address}
          </p>

          <div className="hostel-tabs mt-6 flex gap-2 overflow-x-auto border-b pb-3">
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
      {error === "not-empty" && <p className="mt-5 rounded-xl bg-red-100 p-4 text-red-700">Хостел не можна видалити, поки в ньому є кімнати або пов’язані заявки. Спочатку видаліть або перенесіть ці дані.</p>}

      <div className="compact-stats mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="compact-stat rounded-2xl border bg-white shadow-sm">
          <p className="text-slate-500">Кімнат</p>
          <h2 className="mt-3 text-4xl font-bold">{hostel.rooms.length}</h2>
        </div>

        <div className="compact-stat rounded-2xl border bg-white shadow-sm">
          <p className="text-slate-500">Ліжок</p>
          <h2 className="mt-3 text-4xl font-bold">{beds.length}</h2>
        </div>

        <div className="compact-stat rounded-2xl border bg-white shadow-sm">
          <p className="text-slate-500">Мешканців</p>
          <h2 className="mt-3 text-4xl font-bold">{occupiedBeds}</h2>
        </div>

        <div className="compact-stat rounded-2xl border bg-white shadow-sm">
          <p className="text-slate-500">Вільно</p>
          <h2 className="mt-3 text-4xl font-bold text-green-600">
            {freeBeds}
          </h2>
        </div>
      </div>
      <div className="mt-8 flex flex-wrap gap-3 border-t pt-6">{permissions.includes("HOSTELS_EDIT")&&<Link href={`/hostels/${id}/edit`} className="rounded-lg bg-slate-900 px-4 py-2 text-white">Редагувати хостел</Link>}{permissions.includes("HOSTELS_DELETE")&&<form action={deleteHostel}><input type="hidden" name="hostelId" value={hostel.id}/><button className="rounded-lg bg-red-600 px-4 py-2 text-white">Видалити хостел</button></form>}</div>
    </div>
  );
}
