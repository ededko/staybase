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
    { label: "Хостели", value: dashboard.totalHostels, icon: "⌂" },
    { label: "Кімнати", value: dashboard.totalRooms, icon: "▦" },
    { label: "Усі ліжка", value: dashboard.totalBeds, icon: "▱" },
    { label: "Зайнято", value: dashboard.occupiedBeds, icon: "●" },
    { label: "Вільно", value: dashboard.freeBeds, icon: "○" },
    { label: "Завантаженість", value: `${dashboard.occupancyPercentage}%`, icon: "◔" },
    { label: "Мешканці", value: dashboard.activeResidents, icon: "♙" },
    {
      label: "Прострочений борг",
      value: `${dashboard.overdueAmount.toFixed(2)} zł`,
      accent: "danger",
      icon: "!",
    },
    {
      label: "До сплати за 7 днів",
      value: `${dashboard.upcomingAmount.toFixed(2)} zł`,
      accent: "warning",
      icon: "↗",
    },
    {
      label: "Отримано цього місяця",
      value: `${dashboard.monthlyIncome.toFixed(2)} zł`,
      accent: "success",
      icon: "+",
    },
    {
      label: "Отримані застави",
      value: `${dashboard.depositsHeld.toFixed(2)} zł`,
      accent: "info",
      icon: "◇",
    },
  ];

  return (
    <main className="dashboard-page p-4 sm:p-6 lg:p-8">
      <div className="dashboard-hero flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">ОГЛЯД СЬОГОДНІ</p>
          <h1 className="text-4xl font-bold">Все під контролем</h1>
          <p className="mt-2 text-slate-500">Хостели, мешканці та платежі в одному місці</p>
        </div>
        <Link
          href="/payments/new"
          className="primary-action rounded-xl px-5 py-3 font-semibold"
        >
          + Додати платіж
        </Link>
      </div>

      <div className="metrics-grid mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className={`metric-card ${metric.accent || ""}`}>
            <div><p className="metric-label">{metric.label}</p><p className="metric-value">{metric.value}</p></div>
            <span className="metric-icon">{metric.icon}</span>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <div className="section-heading"><div><p className="eyebrow">ОБ’ЄКТИ</p><h2>Завантаженість хостелів</h2></div><Link href="/hostels">Переглянути всі →</Link></div>
        <div className="hostel-occupancy-grid mt-4">
          {dashboard.hostelOccupancy.map((hostel) => <Link href={`/hostels/${hostel.id}`} key={hostel.id} className="occupancy-card">
            <div className={`house-visual ${occupancyTone(hostel.percentage)}`}><HouseIcon /><span>{hostel.percentage}%</span></div>
            <div className="min-w-0 flex-1"><h3>{hostel.name}</h3><p>{hostel.address}</p><div className="occupancy-bar"><i style={{ width: `${hostel.percentage}%` }} /></div><div className="occupancy-meta"><span>{hostel.occupied} зайнято</span><span>{hostel.free} вільно</span></div></div>
          </Link>)}
        </div>
      </section>

      <section className="demographics-card mt-8">
        <div><p className="eyebrow">МЕШКАНЦІ</p><h2>Хто зараз проживає</h2><p>Статистика заповнюватиметься з анкет мешканців</p></div>
        <div className="demographics-stats"><div><b>{dashboard.demographics.male}</b><span>Чоловіки</span></div><div><b>{dashboard.demographics.female}</b><span>Жінки</span></div><div><b>{dashboard.demographics.averageAge ?? "—"}</b><span>Середній вік</span></div><div><b>{dashboard.demographics.unspecified}</b><span>Не вказано</span></div></div>
      </section>

      <section className="mt-8">
        <div className="section-heading"><div><p className="eyebrow">РОБОЧІ ПРОЦЕСИ</p><h2>Що потребує уваги</h2></div></div>
        <div className="workflow-grid mt-4">
          <Link href="/applications" className="workflow-card"><span>📝</span><div><b>{dashboard.operations.newLeadApplications}</b><p>Нові запити на заселення</p></div><i>→</i></Link>
          <Link href="/maintenance" className="workflow-card"><span>🛠️</span><div><b>{dashboard.operations.openMaintenanceTickets}</b><p>Відкриті ремонтні заявки</p></div><i>→</i></Link>
          <Link href="/quality" className="workflow-card"><span>⭐</span><div><b>{dashboard.operations.newQualityEntries}</b><p>Нові записи контролю якості</p></div><i>→</i></Link>
          <Link href="/internal-requests" className="workflow-card"><span>📋</span><div><b>{dashboard.operations.openInternalRequests}</b><p>Внутрішні заявки команди</p></div><i>→</i></Link>
        </div>
      </section>

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

function occupancyTone(value: number) { return value >= 80 ? "full" : value >= 40 ? "medium" : "low"; }

function HouseIcon() {
  return <svg viewBox="0 0 96 96" aria-hidden="true"><path d="M12 43 48 13l36 30v39a7 7 0 0 1-7 7H19a7 7 0 0 1-7-7V43Z" fill="currentColor" opacity=".16"/><path d="m8 45 40-33 40 33M18 39v43h60V39M39 82V58h18v24" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round"/><path d="M26 50h10v10H26zm34 0h10v10H60z" fill="currentColor"/></svg>;
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
