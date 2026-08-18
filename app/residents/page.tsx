import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getResidentStatus } from "@/lib/resident-service";
import { requireWorkspace } from "@/lib/session";

type Props = {
  searchParams: Promise<{ query?: string; hostel?: string; room?: string }>;
};

function toId(value: string | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

function statusLabel(status: string) {
  if (status === "archived") return "Архівний";
  if (status === "scheduled-departure") return "Запланований виїзд";
  return "Активний";
}

function statusClass(status: string) {
  if (status === "archived") return "bg-slate-100 text-slate-600";
  if (status === "scheduled-departure") return "bg-amber-100 text-amber-700";
  return "bg-green-100 text-green-700";
}

export default async function ResidentsPage({ searchParams }: Props) {
  const { query = "", hostel, room } = await searchParams;
  const hostelId = toId(hostel);
  const roomId = toId(room);
  const { workspace } = await requireWorkspace();
  const filters: Prisma.ResidentWhereInput[] = [{ workspaceId: workspace.id }];

  if (query.trim()) {
    filters.push({
      OR: [
        { firstName: { contains: query.trim(), mode: "insensitive" } },
        { lastName: { contains: query.trim(), mode: "insensitive" } },
        { phone: { contains: query.trim(), mode: "insensitive" } },
      ],
    });
  }
  if (hostelId) filters.push({ bed: { is: { room: { hostelId } } } });
  if (roomId) filters.push({ bed: { is: { roomId } } });

  const [residents, hostels, rooms] = await Promise.all([
    prisma.resident.findMany({
      where: { AND: filters },
      include: {
        bed: { include: { room: { include: { hostel: true } } } },
      },
      orderBy: [{ isActive: "desc" }, { lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.hostel.findMany({ where: { workspaceId: workspace.id }, orderBy: { name: "asc" } }),
    prisma.room.findMany({ where: { hostel: { workspaceId: workspace.id } }, include: { hostel: true }, orderBy: [{ hostel: { name: "asc" } }, { name: "asc" }] }),
  ]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">Мешканці</h1>
          <p className="mt-2 text-slate-500">Облік проживання та поточного розміщення</p>
        </div>
        <Link href="/residents/new" className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800">+ Заселити мешканця</Link>
      </div>

      <form className="mt-8 grid gap-4 rounded-2xl border bg-white p-5 shadow-sm md:grid-cols-4">
        <input name="query" defaultValue={query} placeholder="Пошук за ім’ям або телефоном" className="rounded-lg border p-3 md:col-span-2" />
        <select name="hostel" defaultValue={hostelId?.toString() ?? ""} className="rounded-lg border p-3"><option value="">Усі хостели</option>{hostels.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        <select name="room" defaultValue={roomId?.toString() ?? ""} className="rounded-lg border p-3"><option value="">Усі кімнати</option>{rooms.map((item) => <option key={item.id} value={item.id}>{item.hostel.name} — {item.name}</option>)}</select>
        <div className="flex gap-3 md:col-span-4"><button className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">Застосувати</button><Link href="/residents" className="rounded-lg border px-4 py-2 hover:bg-slate-100">Скинути</Link></div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500"><tr><th className="px-5 py-4 font-medium">Мешканець</th><th className="px-5 py-4 font-medium">Телефон</th><th className="px-5 py-4 font-medium">Розміщення</th><th className="px-5 py-4 font-medium">Заселення</th><th className="px-5 py-4 font-medium">Плановий виїзд</th><th className="px-5 py-4 font-medium">Оплачено до</th><th className="px-5 py-4 font-medium">Статус</th></tr></thead>
          <tbody className="divide-y">
            {residents.map((resident) => {
              const status = getResidentStatus(resident);
              return (
                <tr key={resident.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium"><Link href={`/residents/${resident.id}`} className="hover:underline">{resident.firstName} {resident.lastName}</Link></td>
                  <td className="px-5 py-4">{resident.phone || "—"}</td>
                  <td className="px-5 py-4">{resident.bed ? `${resident.bed.room.hostel.name} · ${resident.bed.room.name} · Ліжко ${resident.bed.number}` : "—"}</td>
                  <td className="px-5 py-4">{resident.checkIn.toLocaleDateString("uk-UA")}</td>
                  <td className="px-5 py-4">{resident.checkOut?.toLocaleDateString("uk-UA") || "—"}</td>
                  <td className="px-5 py-4">{resident.paidThrough?.toLocaleDateString("uk-UA") || "—"}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 ${statusClass(status)}`}>{statusLabel(status)}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {residents.length === 0 && <div className="p-10 text-center text-slate-500">Мешканців за вибраними умовами не знайдено.</div>}
      </div>
    </div>
  );
}
