import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateResidentDetails } from "@/app/actions/residents";

type Props = { params: Promise<{ id: string }> };

function formatDate(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export default async function EditResidentPage({ params }: Props) {
  const { id } = await params;
  const resident = await prisma.resident.findUnique({ where: { id: Number(id) } });

  if (!resident) notFound();

  return (
    <div className="max-w-2xl p-8">
      <Link href={`/residents/${resident.id}`} className="text-blue-600 hover:underline">← Назад до профілю</Link>

      <h1 className="mt-6 text-4xl font-bold text-slate-800">Редагувати мешканця</h1>

      <form action={updateResidentDetails} className="mt-8 space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
        <input type="hidden" name="residentId" value={resident.id} />

        <div className="grid gap-4 md:grid-cols-2">
          <input name="firstName" required defaultValue={resident.firstName} placeholder="Ім’я" className="w-full rounded-lg border p-3" />
          <input name="lastName" required defaultValue={resident.lastName} placeholder="Прізвище" className="w-full rounded-lg border p-3" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input name="phone" defaultValue={resident.phone || ""} placeholder="Телефон" className="w-full rounded-lg border p-3" />
          <input type="email" name="email" defaultValue={resident.email || ""} placeholder="Email" className="w-full rounded-lg border p-3" />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-slate-600">Дата заселення</label>
            <input type="date" name="checkIn" required defaultValue={formatDate(resident.checkIn)} className="w-full rounded-lg border p-3" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Дата виїзду</label>
            <input type="date" name="checkOut" defaultValue={formatDate(resident.checkOut)} className="w-full rounded-lg border p-3" />
          </div>
        </div>

        <button className="rounded-lg bg-slate-900 px-5 py-3 text-white hover:bg-slate-800">Зберегти зміни</button>
      </form>
    </div>
  );
}
