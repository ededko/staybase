import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createPaymentFromForm } from "@/app/actions/payments";
import { requireWorkspace } from "@/lib/session";
import ResidentPaymentPicker from "@/components/payments/ResidentPaymentPicker";

export default async function NewPaymentPage({ searchParams }: { searchParams: Promise<{ residentId?: string }> }) {
  const { residentId } = await searchParams;
  const { workspace } = await requireWorkspace();
  const residents = await prisma.resident.findMany({
    where: { workspaceId: workspace.id, isActive: true },
    include: {
      bed: {
        include: {
          room: {
            include: { hostel: true },
          },
        },
      },
    },
    orderBy: [{ isActive: "desc" }, { lastName: "asc" }, { firstName: "asc" }],
  });
  const hostels = await prisma.hostel.findMany({ where: { workspaceId: workspace.id }, select: { id:true,name:true }, orderBy:{name:"asc"} });
  const residentOptions = residents.map((resident) => ({ id:resident.id, name:`${resident.lastName} ${resident.firstName}`, phone:resident.phone||"", hostelId:resident.bed?.room.hostelId||null, hostelName:resident.bed?.room.hostel.name||"Без хостела", roomName:resident.bed?.room.name||"Без кімнати", bedNumber:resident.bed?.number||null, paidThrough:resident.paidThrough?.toLocaleDateString("uk-UA")||"" }));

  return (
    <div className="max-w-2xl p-4 sm:p-6 lg:p-8">
      <Link href="/payments" className="text-blue-600 hover:underline">← Назад до платежів</Link>
      <h1 className="mt-6 text-4xl font-bold text-slate-800">Додати платіж</h1>

      <form action={createPaymentFromForm} className="mt-8 space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
        <ResidentPaymentPicker residents={residentOptions} hostels={hostels} initialId={residentId || ""} />

        <div>
          <label className="mb-1 block text-sm text-slate-600">Тип платежу</label>
          <select name="type" defaultValue="RENT" className="w-full rounded-lg border p-3">
            <option value="RENT">Оренда</option>
            <option value="DEPOSIT">Застава</option>
            <option value="OTHER">Інше</option>
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-slate-600">Сума</label>
            <input type="number" name="amount" min="0.01" step="0.01" required className="w-full rounded-lg border p-3" />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-600">Дата планової оплати</label>
            <input type="date" name="dueDate" required className="w-full rounded-lg border p-3" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Спосіб оплати</label>
          <select name="method" defaultValue="CASH" className="w-full rounded-lg border p-3">
            <option value="CASH">Готівка</option><option value="BLIK">BLIK</option><option value="BANK_TRANSFER">Банківський переказ</option><option value="CARD">Картка</option><option value="COMPANY">Оплата від фірми</option><option value="OTHER">Інше</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Примітки</label>
          <textarea name="notes" rows={3} className="w-full rounded-lg border p-3" />
        </div>

        <label className="flex items-center gap-2 text-slate-700">
          <input type="checkbox" name="paid" /> Позначити як оплачений
        </label>

        <div>
          <label className="mb-1 block text-sm text-slate-600">Дата оплати</label>
          <input type="date" name="paidAt" className="w-full rounded-lg border p-3" />
        </div>

        <details className="rounded-xl border p-4">
          <summary className="cursor-pointer font-semibold">Інший період оплати</summary>
          <label className="mt-3 block text-sm text-slate-600">Оплачено до конкретної дати</label>
          <input type="date" name="paidThrough" className="mt-1 w-full rounded-lg border p-3" />
          <p className="mt-2 text-xs text-slate-500">Не заповнюйте для стандартної місячної оплати — система перенесе дату на місяць автоматично.</p>
        </details>

        <button className="rounded-lg bg-green-600 px-5 py-3 text-white hover:bg-green-700">Створити платіж</button>
      </form>
    </div>
  );
}
