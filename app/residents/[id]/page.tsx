import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { checkOutResident } from "@/app/actions/residents";

type Props = { params: Promise<{ id: string }> };

export default async function ResidentPage({ params }: Props) {
  const { id } = await params;
  const resident = await prisma.resident.findUnique({
    where: { id: Number(id) },
    include: {
      bed: { include: { room: { include: { hostel: true } } } },
      payments: { orderBy: { dueDate: "desc" } },
    },
  });

  if (!resident) notFound();

  const now = new Date();
  const overduePayments = resident.payments.filter((payment) => !payment.paid && payment.dueDate < now);
  const pendingPayments = resident.payments.filter((payment) => !payment.paid && payment.dueDate >= now);

  return (
    <div className="p-8">
      <Link href="/residents" className="text-blue-600 hover:underline">← Назад до мешканців</Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">
            {resident.firstName} {resident.lastName}
          </h1>
          <p className="mt-2 text-slate-500">
            {resident.bed
              ? `${resident.bed.room.hostel.name} · ${resident.bed.room.name} · Ліжко ${resident.bed.number}`
              : "Не проживає"}
          </p>
        </div>

        <div className="flex gap-3">
          <Link href={`/residents/${resident.id}/edit`} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
            Редагувати
          </Link>
          {resident.isActive && (
            <form action={checkOutResident}>
              <input type="hidden" name="residentId" value={resident.id} />
              <button className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700">Виселити</button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Дані мешканця</h2>
          <dl className="mt-5 space-y-3 text-slate-700">
            <div><dt className="text-sm text-slate-500">Статус</dt><dd>{resident.isActive ? "Активний" : "Виселений"}</dd></div>
            <div><dt className="text-sm text-slate-500">Телефон</dt><dd>{resident.phone || "—"}</dd></div>
            <div><dt className="text-sm text-slate-500">Email</dt><dd>{resident.email || "—"}</dd></div>
            <div><dt className="text-sm text-slate-500">Заселення</dt><dd>{resident.checkIn.toLocaleDateString("uk-UA")}</dd></div>
            <div><dt className="text-sm text-slate-500">Виїзд</dt><dd>{resident.checkOut?.toLocaleDateString("uk-UA") || "—"}</dd></div>
          </dl>
        </section>

        <section className="rounded-2xl border bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-bold">Статус платежів</h2>
          <div className="mt-5 space-y-3">
            <p className={overduePayments.length ? "font-medium text-red-600" : "font-medium text-green-600"}>
              {overduePayments.length ? `Прострочених платежів: ${overduePayments.length}` : "Прострочених платежів немає"}
            </p>
            <p className="text-slate-600">Неоплачених у строк: {pendingPayments.length}</p>
            {resident.payments.length === 0 ? (
              <p className="text-slate-500">Платежів ще немає.</p>
            ) : (
              <div className="space-y-2">
                {resident.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-lg border p-3 text-sm">
                    <span>{Number(payment.amount).toFixed(2)} zł · до {payment.dueDate.toLocaleDateString("uk-UA")}</span>
                    <span className={payment.paid ? "text-green-600" : payment.dueDate < now ? "text-red-600" : "text-amber-600"}>
                      {payment.paid ? "Оплачено" : payment.dueDate < now ? "Прострочено" : "Очікує"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
