import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { createResident } from "@/app/actions/createResident";
import { archiveResident } from "@/app/actions/archiveResident";
import { createPayment } from "@/app/actions/createPayment";
import { togglePayment } from "@/app/actions/togglePayment";
import { deleteBed, toggleBedDisabled } from "@/app/actions/beds";
import { notFound } from "next/navigation";
import { requireWorkspace } from "@/lib/session";

type Props = {
  params: Promise<{
    id: string;
    roomId: string;
    bedId: string;
  }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function BedPage({ params, searchParams }: Props) {
  const { id, roomId, bedId } = await params;
  const { error } = await searchParams;
  const { workspace } = await requireWorkspace();

  const bed = await prisma.bed.findFirst({
    where: {
      id: Number(bedId),
      roomId: Number(roomId),
      room: { hostelId: Number(id), hostel: { workspaceId: workspace.id } },
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

  if (!bed) notFound();

  return (
    <div className="p-8">
      <Link
        href={`/hostels/${id}/rooms/${roomId}`}
        className="text-blue-600 hover:underline"
      >
        ← Назад до кімнати
      </Link>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">🛏 Ліжко №{bed.number}</h1>
          {bed.notes && <p className="mt-2 text-slate-500">{bed.notes}</p>}
        </div>
        <Link
          href={`/hostels/${id}/rooms/${roomId}/beds/${bed.id}/edit`}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Редагувати ліжко
        </Link>
      </div>

      {error === "occupied" && (
        <p className="mt-6 rounded-lg bg-red-50 p-4 text-red-700">
          Зайняте ліжко не можна вимкнути або видалити. Спочатку виселіть мешканця.
        </p>
      )}

      <div className="mt-8 rounded-2xl border bg-white p-6 shadow-sm">
        <p className="text-slate-500">Статус</p>

        <p
          className={`mt-2 text-2xl font-bold ${
            bed.isDisabled
              ? "text-slate-500"
              : bed.resident
                ? "text-red-600"
                : "text-green-600"
          }`}
        >
          {bed.isDisabled
            ? "⚪ Вимкнене"
            : bed.resident
              ? "🔴 Зайняте"
              : "🟢 Вільне"}
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
        ) : bed.isDisabled ? (
          <div>
            <h2 className="text-2xl font-bold">Ліжко тимчасово не використовується</h2>
            <p className="mt-3 text-slate-600">
              Увімкніть його, щоб знову заселяти мешканців.
            </p>
          </div>
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

      <div className="mt-8 flex flex-wrap gap-3 border-t pt-6">
        <form action={toggleBedDisabled}>
          <input type="hidden" name="hostelId" value={id} />
          <input type="hidden" name="roomId" value={roomId} />
          <input type="hidden" name="bedId" value={bed.id} />
          <button
            disabled={Boolean(bed.resident)}
            className="rounded-lg bg-slate-600 px-4 py-2 text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {bed.isDisabled ? "Увімкнути ліжко" : "Вимкнути ліжко"}
          </button>
        </form>

        <form action={deleteBed}>
          <input type="hidden" name="hostelId" value={id} />
          <input type="hidden" name="roomId" value={roomId} />
          <input type="hidden" name="bedId" value={bed.id} />
          <button
            disabled={Boolean(bed.resident)}
            className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Видалити ліжко
          </button>
        </form>
      </div>
    </div>
  );
}
