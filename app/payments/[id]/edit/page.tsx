import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updatePaymentFromForm } from "@/app/actions/payments";

type Props = { params: Promise<{ id: string }> };

function formatDate(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export default async function EditPaymentPage({ params }: Props) {
  const { id } = await params;
  const [payment, residents] = await Promise.all([
    prisma.payment.findUnique({ where: { id: Number(id) } }),
    prisma.resident.findMany({ orderBy: [{ isActive: "desc" }, { lastName: "asc" }, { firstName: "asc" }] }),
  ]);

  if (!payment) notFound();

  return (
    <div className="max-w-2xl p-8">
      <Link href={`/payments/${payment.id}`} className="text-blue-600 hover:underline">← Назад до платежу</Link>
      <h1 className="mt-6 text-4xl font-bold text-slate-800">Редагувати платіж</h1>

      <form action={updatePaymentFromForm} className="mt-8 space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
        <input type="hidden" name="paymentId" value={payment.id} />

        <div>
          <label className="mb-1 block text-sm text-slate-600">Мешканець</label>
          <select name="residentId" required defaultValue={payment.residentId} className="w-full rounded-lg border p-3">
            {residents.map((resident) => <option key={resident.id} value={resident.id}>{resident.firstName} {resident.lastName}</option>)}
          </select>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div><label className="mb-1 block text-sm text-slate-600">Сума</label><input type="number" name="amount" min="0" step="0.01" required defaultValue={Number(payment.amount)} className="w-full rounded-lg border p-3" /></div>
          <div><label className="mb-1 block text-sm text-slate-600">Термін оплати</label><input type="date" name="dueDate" required defaultValue={formatDate(payment.dueDate)} className="w-full rounded-lg border p-3" /></div>
        </div>

        <div><label className="mb-1 block text-sm text-slate-600">Примітки</label><textarea name="notes" rows={3} defaultValue={payment.notes || ""} className="w-full rounded-lg border p-3" /></div>
        <label className="flex items-center gap-2 text-slate-700"><input type="checkbox" name="paid" defaultChecked={payment.paid} /> Позначити як оплачений</label>
        <div><label className="mb-1 block text-sm text-slate-600">Дата оплати</label><input type="date" name="paidAt" defaultValue={formatDate(payment.paidAt)} className="w-full rounded-lg border p-3" /></div>

        <button className="rounded-lg bg-slate-900 px-5 py-3 text-white hover:bg-slate-800">Зберегти зміни</button>
      </form>
    </div>
  );
}
