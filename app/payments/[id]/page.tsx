import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPaymentStatus } from "@/lib/payment-service";
import { requireWorkspace } from "@/lib/session";

type Props = { params: Promise<{ id: string }> };

export default async function PaymentPage({ params }: Props) {
  const { id } = await params;
  const { workspace } = await requireWorkspace();
  const payment = await prisma.payment.findFirst({
    where: { id: Number(id), resident: { workspaceId: workspace.id } },
    include: {
      resident: {
        include: {
          bed: {
            include: {
              room: {
                include: { hostel: true },
              },
            },
          },
        },
      },
    },
  });

  if (!payment) notFound();

  const status = getPaymentStatus(payment);
  const statusText = status === "paid" ? "Оплачено" : status === "overdue" ? "Прострочено" : "Очікує оплату";
  const statusClass = status === "paid" ? "text-green-600" : status === "overdue" ? "text-red-600" : "text-amber-600";
  const typeText = payment.type === "DEPOSIT" ? "Застава" : payment.type === "OTHER" ? "Інше" : "Оренда";

  return (
    <div className="max-w-3xl p-4 sm:p-6 lg:p-8">
      <Link href="/payments" className="text-blue-600 hover:underline">← Назад до платежів</Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">Платіж #{payment.id}</h1>
          <p className="mt-2 text-slate-500">{payment.resident.firstName} {payment.resident.lastName}</p>
        </div>
        <Link href={`/payments/${payment.id}/edit`} className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Редагувати</Link>
      </div>

      <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
        <dl className="grid gap-5 md:grid-cols-2">
          <div><dt className="text-sm text-slate-500">Сума</dt><dd className="mt-1 text-2xl font-bold">{Number(payment.amount).toFixed(2)} zł</dd></div>
          <div><dt className="text-sm text-slate-500">Статус</dt><dd className={`mt-1 text-lg font-semibold ${statusClass}`}>{statusText}</dd></div>
          <div><dt className="text-sm text-slate-500">Тип платежу</dt><dd className="mt-1">{typeText}</dd></div>
          <div><dt className="text-sm text-slate-500">Термін оплати</dt><dd className="mt-1">{payment.dueDate.toLocaleDateString("uk-UA")}</dd></div>
          <div><dt className="text-sm text-slate-500">Дата оплати</dt><dd className="mt-1">{payment.paidAt?.toLocaleDateString("uk-UA") || "—"}</dd></div>
          <div><dt className="text-sm text-slate-500">Хостел</dt><dd className="mt-1">{payment.resident.bed?.room.hostel.name || "—"}</dd></div>
          <div><dt className="text-sm text-slate-500">Кімната</dt><dd className="mt-1">{payment.resident.bed?.room.name || "—"}</dd></div>
          <div className="md:col-span-2"><dt className="text-sm text-slate-500">Примітки</dt><dd className="mt-1 whitespace-pre-wrap">{payment.notes || "—"}</dd></div>
        </dl>
      </div>
    </div>
  );
}
