import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { checkInResident } from "@/app/actions/residents";

export default async function NewResidentPage() {
  const beds = await prisma.bed.findMany({
    where: { resident: { is: null } },
    include: {
      room: {
        include: { hostel: true },
      },
    },
    orderBy: [{ room: { hostel: { name: "asc" } } }, { room: { name: "asc" } }, { number: "asc" }],
  });

  return (
    <div className="max-w-2xl p-8">
      <Link href="/residents" className="text-blue-600 hover:underline">← Назад до мешканців</Link>

      <h1 className="mt-6 text-4xl font-bold text-slate-800">Заселити мешканця</h1>
      <p className="mt-2 text-slate-500">Оберіть вільне ліжко та внесіть дані мешканця.</p>

      {beds.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed p-8 text-center text-slate-500">
          Вільних ліжок немає.
        </div>
      ) : (
        <form action={checkInResident} className="mt-8 space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
          <select name="bedId" required className="w-full rounded-lg border p-3">
            <option value="">Оберіть ліжко</option>
            {beds.map((bed) => (
              <option key={bed.id} value={bed.id}>
                {bed.room.hostel.name} — {bed.room.name} — Ліжко {bed.number}
              </option>
            ))}
          </select>

          <div className="grid gap-4 md:grid-cols-2">
            <input name="firstName" required placeholder="Ім’я" className="w-full rounded-lg border p-3" />
            <input name="lastName" required placeholder="Прізвище" className="w-full rounded-lg border p-3" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input name="phone" placeholder="Телефон" className="w-full rounded-lg border p-3" />
            <input type="email" name="email" placeholder="Email" className="w-full rounded-lg border p-3" />
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600">Дата заселення</label>
            <input type="date" name="checkIn" required className="w-full rounded-lg border p-3" />
          </div>

          <button className="rounded-lg bg-green-600 px-5 py-3 text-white hover:bg-green-700">
            Заселити
          </button>
        </form>
      )}
    </div>
  );
}
