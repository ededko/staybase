import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getPaymentStatus } from "@/lib/payment-service";
import { requireWorkspace } from "@/lib/session";

type Props = {
  searchParams: Promise<{
    query?: string;
    hostel?: string;
    status?: string;
    type?: string;
    from?: string;
    to?: string;
  }>;
};

function toId(value: string | undefined) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

function statusLabel(status: string) {
  if (status === "paid") return "Оплачено";
  if (status === "overdue") return "Прострочено";
  return "Очікує";
}

function statusClass(status: string) {
  if (status === "paid") return "bg-green-100 text-green-700";
  if (status === "overdue") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

function typeLabel(type: string) {
  if (type === "DEPOSIT") return "Застава";
  if (type === "OTHER") return "Інше";
  return "Оренда";
}

function methodLabel(method: string) {
  return ({ CASH: "Готівка", BLIK: "BLIK", BANK_TRANSFER: "Переказ", CARD: "Картка", COMPANY: "Фірма", OTHER: "Інше" } as Record<string, string>)[method] || "—";
}

export default async function PaymentsPage({ searchParams }: Props) {
  const { query = "", hostel, status, type, from, to } = await searchParams;
  const hostelId = toId(hostel);
  const now = new Date();
  const { workspace } = await requireWorkspace();
  const filters: Prisma.PaymentWhereInput[] = [{ resident: { workspaceId: workspace.id } }];

  if (query.trim()) {
    filters.push({
      resident: {
        OR: [
          { firstName: { contains: query.trim(), mode: "insensitive" } },
          { lastName: { contains: query.trim(), mode: "insensitive" } },
        ],
      },
    });
  }

  if (hostelId) {
    filters.push({
      resident: { bed: { is: { room: { hostelId } } } },
    });
  }

  if (status === "paid") filters.push({ paid: true });
  if (status === "pending") filters.push({ paid: false, dueDate: { gte: now } });
  if (status === "overdue") filters.push({ paid: false, dueDate: { lt: now } });
  if (type === "RENT" || type === "DEPOSIT" || type === "OTHER") {
    filters.push({ type });
  }

  if (from || to) {
    filters.push({
      dueDate: {
        ...(from ? { gte: new Date(from) } : {}),
        ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
      },
    });
  }

  const [payments, hostels] = await Promise.all([
    prisma.payment.findMany({
      where: { AND: filters },
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
      orderBy: { dueDate: "desc" },
    }),
    prisma.hostel.findMany({ where: { workspaceId: workspace.id }, orderBy: { name: "asc" } }),
  ]);

  const unpaidTotal = payments
    .filter((payment) => !payment.paid)
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const overdueTotal = payments
    .filter((payment) => getPaymentStatus(payment, now) === "overdue")
    .reduce((sum, payment) => sum + Number(payment.amount), 0);
  const depositsHeld = payments
    .filter((payment) => payment.type === "DEPOSIT" && payment.paid)
    .reduce((sum, payment) => sum + Number(payment.amount), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">Платежі</h1>
          <p className="mt-2 text-slate-500">Контроль нарахувань та оплат мешканців</p>
        </div>
        <Link href="/payments/new" className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white hover:bg-slate-800">
          + Додати платіж
        </Link>
      </div>

      <div className="compact-stats mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <div className="compact-stat rounded-xl border bg-white"><p className="text-slate-500">Очікується</p><p className="mt-2 text-2xl font-bold">{unpaidTotal.toFixed(2)} zł</p></div>
        <div className="compact-stat rounded-xl border bg-white"><p className="text-slate-500">Прострочено</p><p className="mt-2 text-2xl font-bold text-red-600">{overdueTotal.toFixed(2)} zł</p></div>
        <div className="compact-stat rounded-xl border bg-white"><p className="text-slate-500">Отримані застави</p><p className="mt-2 text-2xl font-bold text-blue-600">{depositsHeld.toFixed(2)} zł</p></div>
      </div>

      <form className="mt-6 grid gap-4 rounded-2xl border bg-white p-5 shadow-sm md:grid-cols-6">
        <input name="query" defaultValue={query} placeholder="Пошук мешканця" className="rounded-lg border p-3 md:col-span-2" />
        <select name="hostel" defaultValue={hostelId?.toString() ?? ""} className="rounded-lg border p-3">
          <option value="">Усі хостели</option>
          {hostels.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select name="type" defaultValue={type ?? ""} className="rounded-lg border p-3">
          <option value="">Усі типи</option>
          <option value="RENT">Оренда</option>
          <option value="DEPOSIT">Застава</option>
          <option value="OTHER">Інше</option>
        </select>
        <select name="status" defaultValue={status ?? ""} className="rounded-lg border p-3">
          <option value="">Усі статуси</option>
          <option value="paid">Оплачено</option>
          <option value="pending">Очікує</option>
          <option value="overdue">Прострочено</option>
        </select>
        <input type="date" name="from" defaultValue={from} aria-label="Дата від" className="rounded-lg border p-3" />
        <input type="date" name="to" defaultValue={to} aria-label="Дата до" className="rounded-lg border p-3" />
        <div className="flex gap-3 md:col-span-6">
          <button className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800">Застосувати</button>
          <Link href="/payments" className="rounded-lg border px-4 py-2 hover:bg-slate-100">Скинути</Link>
        </div>
      </form>

      <div className="mt-6 overflow-x-auto rounded-2xl border bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b bg-slate-50 text-slate-500">
            <tr>
              <th className="px-5 py-4 font-medium">Мешканець</th>
              <th className="px-5 py-4 font-medium">Хостел</th>
              <th className="px-5 py-4 font-medium">Кімната</th>
              <th className="px-5 py-4 font-medium">Сума</th>
              <th className="px-5 py-4 font-medium">Тип</th>
              <th className="px-5 py-4 font-medium">Планова дата</th>
              <th className="px-5 py-4 font-medium">Оплачено</th>
              <th className="px-5 py-4 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {payments.map((payment) => {
              const paymentStatus = getPaymentStatus(payment, now);
              return (
                <tr key={payment.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-medium">
                    <Link href={`/payments/${payment.id}`} className="hover:underline">
                      {payment.resident.firstName} {payment.resident.lastName}
                    </Link>
                  </td>
                  <td className="px-5 py-4">{payment.resident.bed?.room.hostel.name || "—"}</td>
                  <td className="px-5 py-4">{payment.resident.bed?.room.name || "—"}</td>
                  <td className="px-5 py-4">{Number(payment.amount).toFixed(2)} zł</td>
                  <td className="px-5 py-4">{typeLabel(payment.type)}<small className="block text-slate-500">{methodLabel(payment.method)}</small></td>
                  <td className="px-5 py-4">{payment.dueDate.toLocaleDateString("uk-UA")}</td>
                  <td className="px-5 py-4">{payment.paidAt?.toLocaleDateString("uk-UA") || "—"}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-3 py-1 ${statusClass(paymentStatus)}`}>{statusLabel(paymentStatus)}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {payments.length === 0 && <div className="p-10 text-center text-slate-500">Платежів за вибраними умовами не знайдено.</div>}
      </div>
    </div>
  );
}
