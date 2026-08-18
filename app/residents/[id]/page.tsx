import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { checkOutResident } from "@/app/actions/residents";
import { getResidentStatus } from "@/lib/resident-service";
import { requireWorkspace } from "@/lib/session";

type Props = { params: Promise<{ id: string }> };

function statusLabel(status: string) {
  if (status === "archived") return "Архівний";
  if (status === "scheduled-departure") return "Запланований виїзд";
  return "Активний";
}

export default async function ResidentPage({ params }: Props) {
  const { id } = await params;
  const { workspace } = await requireWorkspace();
  const resident = await prisma.resident.findFirst({
    where: { id: Number(id), workspaceId: workspace.id },
    include: {
      bed: { include: { room: { include: { hostel: true } } } },
      payments: {
        where: { paid: true },
        orderBy: { dueDate: "desc" },
        take: 1,
        select: { dueDate: true },
      },
      stays: {
        include: {
          bed: { include: { room: { include: { hostel: true } } } },
        },
        orderBy: { startedAt: "desc" },
      },
    },
  });

  if (!resident) notFound();

  const status = getResidentStatus(resident);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Link href="/residents" className="text-blue-600 hover:underline">← Назад до мешканців</Link>
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div><h1 className="text-4xl font-bold text-slate-800">{resident.firstName} {resident.lastName}</h1><p className="mt-2 text-slate-500">{statusLabel(status)}</p></div>
        {resident.isActive && <div className="flex flex-wrap gap-3"><Link href={`/residents/${resident.id}/edit`} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Редагувати</Link><Link href={`/residents/${resident.id}/edit#accommodation`} className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">Перемістити</Link><form action={checkOutResident}><input type="hidden" name="residentId" value={resident.id} /><button className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700">Архівувати</button></form></div>}
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-2xl font-bold">Особисті дані</h2><dl className="mt-5 space-y-3 text-slate-700"><div><dt className="text-sm text-slate-500">Телефон</dt><dd>{resident.phone || "—"}</dd></div><div><dt className="text-sm text-slate-500">Email</dt><dd>{resident.email || "—"}</dd></div><div><dt className="text-sm text-slate-500">Дата народження</dt><dd>{resident.birthDate?.toLocaleDateString("uk-UA") || "—"}</dd></div><div><dt className="text-sm text-slate-500">Стать</dt><dd>{resident.gender === "MALE" ? "Чоловік" : resident.gender === "FEMALE" ? "Жінка" : resident.gender === "OTHER" ? "Інше" : "—"}</dd></div><div><dt className="text-sm text-slate-500">Заселення</dt><dd>{resident.checkIn.toLocaleDateString("uk-UA")}</dd></div><div><dt className="text-sm text-slate-500">Плановий виїзд</dt><dd>{resident.checkOut?.toLocaleDateString("uk-UA") || "—"}</dd></div></dl></section>
        <section className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-2xl font-bold">Поточне розміщення</h2><p className="mt-5 text-slate-700">{resident.bed ? `${resident.bed.room.hostel.name} · ${resident.bed.room.name} · Ліжко ${resident.bed.number}` : "Мешканець не має активного розміщення."}</p></section>
        <section className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-2xl font-bold">Платежі</h2><p className="mt-5 text-slate-700">Оплачено до: {resident.payments[0]?.dueDate.toLocaleDateString("uk-UA") || "—"}</p></section>
        <section className="rounded-2xl border bg-white p-6 shadow-sm"><h2 className="text-2xl font-bold">Примітки</h2><p className="mt-5 whitespace-pre-wrap text-slate-700">{resident.notes || "—"}</p></section>
      </div>

      <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold">Історія проживання</h2>
        {resident.stays.length === 0 ? (
          <p className="mt-5 text-slate-500">Історії розміщення поки немає.</p>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b text-slate-500">
                <tr>
                  <th className="py-3 pr-5 font-medium">Розміщення</th>
                  <th className="py-3 pr-5 font-medium">Від</th>
                  <th className="py-3 font-medium">До</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {resident.stays.map((stay) => (
                  <tr key={stay.id}>
                    <td className="py-4 pr-5">
                      {stay.bed.room.hostel.name} · {stay.bed.room.name} · Ліжко {stay.bed.number}
                    </td>
                    <td className="py-4 pr-5">{stay.startedAt.toLocaleDateString("uk-UA")}</td>
                    <td className="py-4">
                      {stay.endedAt?.toLocaleDateString("uk-UA") || "Зараз"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
