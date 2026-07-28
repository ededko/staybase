import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type Props = {
  searchParams: Promise<{
    query?: string;
    hostel?: string;
    room?: string;
  }>;
};

function toId(value: string | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

export default async function ResidentsPage({ searchParams }: Props) {
  const { query = "", hostel, room } = await searchParams;
  const hostelId = toId(hostel);
  const roomId = toId(room);
  const filters: Prisma.ResidentWhereInput[] = [];

  if (query.trim()) {
    filters.push({
      OR: [
        { firstName: { contains: query.trim(), mode: "insensitive" } },
        { lastName: { contains: query.trim(), mode: "insensitive" } },
        { phone: { contains: query.trim(), mode: "insensitive" } },
        { email: { contains: query.trim(), mode: "insensitive" } },
      ],
    });
  }

  if (hostelId) {
    filters.push({
      bed: { is: { room: { hostelId } } },
    });
  }

  if (roomId) {
    filters.push({
      bed: { is: { roomId } },
    });
  }

  const [residents, hostels, rooms] = await Promise.all([
    prisma.resident.findMany({
      where: filters.length ? { AND: filters } : undefined,
      include: {
        bed: {
          include: {
            room: {
              include: {
                hostel: true,
              },
            },
          },
        },
        payments: {
          where: { paid: false },
          orderBy: { dueDate: "asc" },
          take: 1,
        },
      },
      orderBy: [{ isActive: "desc" }, { lastName: "asc" }, { firstName: "asc" }],
    }),
    prisma.hostel.findMany({ orderBy: { name: "asc" } }),
    prisma.room.findMany({
      include: { hostel: true },
      orderBy: [{ hostel: { name: "asc" } }, { name: "asc" }],
    }),
  ]);

  const now = new Date();

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">Мешканці</h1>
          <p className="mt-2 text-slate-500">
            Облік заселень, проживання та платежів
          </p>
        </div>

        <Link
          href="/residents/new"
          className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800"
        >
          + Заселити мешканця
        </Link>
      </div>

      <form className="mt-8 grid gap-4 rounded-2xl border bg-white p-5 shadow-sm md:grid-cols-4">
        <input
          name="query"
          defaultValue={query}
          placeholder="Пошук за ім’ям, телефоном або email"
          className="rounded-lg border p-3 md:col-span-2"
        />

        <select name="hostel" defaultValue={hostelId?.toString() ?? ""} className="rounded-lg border p-3">
          <option value="">Усі хостели</option>
          {hostels.map((item) => (
            <option key={item.id} value={item.id}>{item.name}</option>
          ))}
        </select>

        <select name="room" defaultValue={roomId?.toString() ?? ""} className="rounded-lg border p-3">
          <option value="">Усі кімнати</option>
          {rooms.map((item) => (
            <option key={item.id} value={item.id}>
              {item.hostel.name} — {item.name}
            </option>
          ))}
        </select>

        <div className="flex gap-3 md:col-span-4">
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">
            Застосувати
          </button>
          <Link href="/residents" className="rounded-lg border px-4 py-2 hover:bg-slate-100">
            Скинути
          </Link>
        </div>
      </form>

      <div className="mt-6 overflow-hidden rounded-2xl border bg-white shadow-sm">
        {residents.length === 0 ? (
          <div className="p-10 text-center text-slate-500">
            Мешканців за вибраними умовами не знайдено.
          </div>
        ) : (
          <div className="divide-y">
            {residents.map((resident) => {
              const unpaidPayment = resident.payments[0];
              const paymentStatus = !unpaidPayment
                ? "✅ Без прострочень"
                : unpaidPayment.dueDate < now
                  ? "🔴 Прострочено"
                  : "🟡 Очікує оплату";

              return (
                <Link
                  key={resident.id}
                  href={`/residents/${resident.id}`}
                  className="flex flex-wrap items-center justify-between gap-4 p-5 hover:bg-slate-50"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-slate-800">
                      {resident.firstName} {resident.lastName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {resident.bed
                        ? `${resident.bed.room.hostel.name} · ${resident.bed.room.name} · Ліжко ${resident.bed.number}`
                        : "Не проживає"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm">
                    <span className={resident.isActive ? "rounded-full bg-green-100 px-3 py-1 text-green-700" : "rounded-full bg-slate-100 px-3 py-1 text-slate-600"}>
                      {resident.isActive ? "Активний" : "Виселений"}
                    </span>
                    <span className="text-slate-600">{paymentStatus}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
