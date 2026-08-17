import Link from "next/link";
import { getDashboardData } from "@/lib/dashboard-service";
import { requireWorkspace } from "@/lib/session";

function paymentTypeLabel(type: string) {
  if (type === "DEPOSIT") return "Застава";
  if (type === "OTHER") return "Інше";
  return "Оренда";
}

function residentLocation(payment: {
  resident: {
    bed: {
      room: { name: string; hostel: { name: string } };
    } | null;
  };
}) {
  const bed = payment.resident.bed;
  return bed ? `${bed.room.hostel.name} · ${bed.room.name}` : "—";
}

export default async function Home() {
  const { workspace } = await requireWorkspace();
  const dashboard = await getDashboardData(workspace.id);
  const metrics = [
    { label: "Хостелів", value: dashboard.totalHostels },
    { label: "Кімнат", value: dashboard.totalRooms },
    { label: "Активних ліжок", value: dashboard.totalBeds },
    { label: "Зайнято", value: dashboard.occupiedBeds },
    { label: "Вільно", value: dashboard.freeBeds },
    { label: "Завантаженість", value: `${dashboard.occupancyPercentage}%` },
    { label: "Активних мешканців", value: dashboard.activeResidents },
    {
      label: "Прострочений борг",
      value: `${dashboard.overdueAmount.toFixed(2)} zł`,
      accent: "text-red-600",
    },
    {
      label: "До сплати за 7 днів",
      value: `${dashboard.upcomingAmount.toFixed(2)} zł`,
      accent: "text-amber-600",
    },
    {
      label: "Отримано цього місяця",
      value: `${dashboard.monthlyIncome.toFixed(2)} zł`,
      accent: "text-green-600",
    },
    {
      label: "Отримані застави",
      value: `${dashboard.depositsHeld.toFixed(2)} zł`,
      accent: "text-blue-600",
    },
  ];

  return (
    <main className="p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">Dashboard</h1>
          <p className="mt-2 text-slate-500">Поточний стан хостелів і платежів</p>
        </div>
        <Link
          href="/payments/new"
          className="rounded-xl bg-slate-900 px-5 py-3 text-white hover:bg-slate-800"
        >
          + Додати платіж
        </Link>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{metric.label}</p>
            <p className={`mt-2 text-3xl font-bold ${metric.accent || ""}`}>
              {metric.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <PaymentTable
          title="Прострочені платежі"
          emptyText="Прострочених платежів немає."
          payments={dashboard.overduePayments}
          overdue
        />
        <PaymentTable
          title="До сплати протягом 7 днів"
          emptyText="Найближчими 7 днями оплат немає."
          payments={dashboard.upcomingPayments}
        />
      </div>
    </main>
  );
}

type DashboardPayment = Awaited<ReturnType<typeof getDashboardData>>["overduePayments"][number];

function PaymentTable({
  title,
  emptyText,
  payments,
  overdue = false,
}: {
  title: string;
  emptyText: string;
  payments: DashboardPayment[];
  overdue?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border bg-white shadow-sm">
      <div className="flex items-center justify-between border-b p-5">
        <h2 className="text-xl font-bold">{title}</h2>
        <Link
          href={overdue ? "/payments?status=overdue" : "/payments?status=pending"}
          className="text-sm text-blue-600 hover:underline"
        >
          Усі платежі
        </Link>
      </div>
      {payments.length === 0 ? (
        <p className="p-6 text-slate-500">{emptyText}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-5 py-3 font-medium">Мешканець</th>
                <th className="px-5 py-3 font-medium">Сума</th>
                <th className="px-5 py-3 font-medium">Дата</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.slice(0, 8).map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    <Link href={`/payments/${payment.id}`} className="font-medium hover:underline">
                      {payment.resident.firstName} {payment.resident.lastName}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {residentLocation(payment)} · {paymentTypeLabel(payment.type)}
                    </p>
                  </td>
                  <td className={`px-5 py-4 font-semibold ${overdue ? "text-red-600" : ""}`}>
                    {Number(payment.amount).toFixed(2)} zł
                  </td>
                  <td className="px-5 py-4">{payment.dueDate.toLocaleDateString("uk-UA")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
