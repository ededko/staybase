import { prisma } from "@/lib/prisma";

export default async function Home() {
  const now = new Date();

  const [
    totalHostels,
    totalRooms,
    totalBeds,
    occupiedBeds,
    totalResidents,
    overdueResidentRows,
    overduePayments,
    expectedIncome,
    collectedIncome,
  ] = await Promise.all([
    prisma.hostel.count(),
    prisma.room.count(),
    prisma.bed.count(),
    prisma.bed.count({
      where: {
        resident: {
          is: {
            isActive: true,
          },
        },
      },
    }),
    prisma.resident.count(),
    prisma.payment.findMany({
      where: {
        paid: false,
        dueDate: {
          lt: now,
        },
      },
      distinct: ["residentId"],
      select: {
        residentId: true,
      },
    }),
    prisma.payment.count({
      where: {
        paid: false,
        dueDate: { lt: now },
      },
    }),
    prisma.payment.aggregate({
      _sum: { amount: true },
    }),
    prisma.payment.aggregate({
      where: { paid: true },
      _sum: { amount: true },
    }),
  ]);

  const freeBeds = totalBeds - occupiedBeds;
  const occupancyPercentage = totalBeds
    ? Math.round((occupiedBeds / totalBeds) * 100)
    : 0;
  const overdueResidents = overdueResidentRows.length;
  const totalExpectedIncome = Number(expectedIncome._sum.amount || 0);
  const totalCollectedIncome = Number(collectedIncome._sum.amount || 0);

  const metrics = [
    { label: "Хостелів", value: totalHostels },
    { label: "Кімнат", value: totalRooms },
    { label: "Ліжок", value: totalBeds },
    { label: "Зайнятих ліжок", value: occupiedBeds },
    { label: "Вільних ліжок", value: freeBeds },
    { label: "Завантаженість", value: `${occupancyPercentage}%` },
    { label: "Мешканців", value: totalResidents },
    { label: "Мешканців з простроченням", value: overdueResidents },
    { label: "Прострочених платежів", value: overduePayments },
    { label: "Очікуваний дохід", value: `${totalExpectedIncome.toFixed(2)} zł` },
    { label: "Отриманий дохід", value: `${totalCollectedIncome.toFixed(2)} zł` },
  ];

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <p className="mt-2 text-slate-500">
        Ласкаво просимо до StayBase CRM.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border bg-white p-6 shadow-sm"
          >
            <p className="text-sm text-slate-500">{metric.label}</p>
            <h2 className="mt-2 text-3xl font-bold">{metric.value}</h2>
          </div>
        ))}
      </div>
    </main>
  );
}
