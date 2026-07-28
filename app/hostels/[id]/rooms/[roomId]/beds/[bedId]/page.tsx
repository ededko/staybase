import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createResident } from "@/app/actions/createResident";
import { archiveResident } from "@/app/actions/archiveResident";
import { createPayment } from "@/app/actions/createPayment";
import { togglePayment } from "@/app/actions/togglePayment";

type Props = {
  params: Promise<{
    id: string;
    roomId: string;
    bedId: string;
  }>;
};

export default async function BedPage({ params }: Props) {
  const { id, roomId, bedId } = await params;

  const bed = await prisma.bed.findUnique({
    where: {
      id: Number(bedId),
    },
    include: {
  resident: {
    include: {
      payments: {
        orderBy: {
          dueDate: "desc",
        },
      },
    },
  },
},
  });

  if (!bed) {
    return <div className="p-8">Ліжко не знайдено.</div>;
  }

  return (
    <div className="p-8">
      <Link
        href={`/hostels/${id}/rooms/${roomId}`}
        className="text-blue-600 hover:underline"
      >
        ← Назад до кімнати
      </Link>

      <h1 className="mt-6 text-4xl font-bold">
        🛏 Ліжко №{bed.number}
      </h1>

      <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-slate-500">Статус</p>

        <p
          className={`mt-2 text-2xl font-bold ${
            bed.resident ? "text-red-600" : "text-green-600"
          }`}
        >
          {bed.resident ? "🔴 Зайняте" : "🟢 Вільне"}
        </p>

        <hr className="my-6" />

        {bed.resident ? (
          <>
            <h2 className="text-2xl font-bold">Мешканець</h2>

            <div className="mt-4 space-y-2">
              <p>
                <strong>Ім&apos;я:</strong>{" "}
                {bed.resident.firstName} {bed.resident.lastName}
              </p>

              <p>
                <strong>Телефон:</strong>{" "}
                {bed.resident.phone || "—"}
              </p>

              <p>
                <strong>Email:</strong>{" "}
                {bed.resident.email || "—"}
              </p>

              <p>
                <strong>Заселення:</strong>{" "}
                {bed.resident.checkIn.toLocaleDateString("uk-UA")}
              </p>

              <p>
                <strong>Виїзд:</strong>{" "}
                {bed.resident.checkOut
                  ? bed.resident.checkOut.toLocaleDateString("uk-UA")
                  : "—"}
              </p>
            </div>
            <hr className="my-8" />

<h2 className="text-2xl font-bold mb-4">
  💰 Платежі
</h2>

{bed.resident.payments.length === 0 ? (
  <p className="text-slate-500">
    Поки що платежів немає.
  </p>
) : (
  <div className="space-y-3">
    {bed.resident.payments.map((payment) => (
      <div
        key={payment.id}
        className="rounded-lg border p-4 flex justify-between items-center"
      >
        <div>
          <p className="font-semibold">
            {Number(payment.amount).toFixed(2)} zł
          </p>

          <p className="text-sm text-slate-500">
            До {payment.dueDate.toLocaleDateString("uk-UA")}
          </p>
        </div>

        <form action={togglePayment}>
  <input
    type="hidden"
    name="paymentId"
    value={payment.id}
  />

  <input
    type="hidden"
    name="hostelId"
    value={id}
  />

  <input
    type="hidden"
    name="roomId"
    value={roomId}
  />

  <input
    type="hidden"
    name="bedId"
    value={bed.id}
  />

  <button
    type="submit"
    className={`rounded-lg px-3 py-2 text-white ${
      payment.paid
        ? "bg-green-600 hover:bg-green-700"
        : "bg-red-600 hover:bg-red-700"
    }`}
  >
    {payment.paid ? "✅ Оплачено" : "❌ Не оплачено"}
  </button>
</form>
      </div>
    ))}
  </div>
)}

<form action={createPayment} className="mt-6 space-y-4">
  <input type="hidden" name="residentId" value={bed.resident.id} />
  <input type="hidden" name="hostelId" value={id} />
  <input type="hidden" name="roomId" value={roomId} />
  <input type="hidden" name="bedId" value={bed.id} />

  <input
    type="number"
    name="amount"
    placeholder="Сума"
    className="w-full rounded-lg border p-3"
    required
  />

  <input
    type="date"
    name="dueDate"
    className="w-full rounded-lg border p-3"
    required
  />

  <button
    type="submit"
    className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700"
  >
    ➕ Додати платіж
  </button>
</form>

            <div className="mt-8 flex gap-3">
  <button
    className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
  >
    Редагувати
  </button>

  <form action={archiveResident}>
    <input
      type="hidden"
      name="residentId"
      value={bed.resident.id}
    />

    <input
      type="hidden"
      name="hostelId"
      value={id}
    />

    <input
      type="hidden"
      name="roomId"
      value={roomId}
    />

    <input
      type="hidden"
      name="bedId"
      value={bed.id}
    />

    <button
      type="submit"
      className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
    >
      Виселити
    </button>
  </form>
</div>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold">
              Ліжко вільне
            </h2>

            <p className="mt-3 text-slate-600">
              Заповніть дані нового мешканця.
            </p>

            <form action={createResident} className="mt-6 space-y-4">
              <input type="hidden" name="hostelId" value={id} />
              <input type="hidden" name="roomId" value={roomId} />
              <input type="hidden" name="bedId" value={bed.id} />

              <input
                name="firstName"
                placeholder="Ім'я"
                className="w-full rounded-lg border p-3"
                required
              />

              <input
                name="lastName"
                placeholder="Прізвище"
                className="w-full rounded-lg border p-3"
                required
              />

              <input
                name="phone"
                placeholder="Телефон"
                className="w-full rounded-lg border p-3"
              />

              <input
                type="email"
                name="email"
                placeholder="Email"
                className="w-full rounded-lg border p-3"
              />

              <div>
                <label className="mb-1 block text-sm text-slate-600">
                  Дата заселення
                </label>

                <input
                  type="date"
                  name="checkIn"
                  className="w-full rounded-lg border p-3"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-600">
                  Дата виїзду
                </label>

                <input
                  type="date"
                  name="checkOut"
                  className="w-full rounded-lg border p-3"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-green-600 px-5 py-3 text-white hover:bg-green-700"
              >
                Заселити мешканця
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
