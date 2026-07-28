import Link from "next/link";

type Bed = {
  id: number;
  resident: unknown | null;
};

type Room = {
  beds: Bed[];
};

type Props = {
  hostel: {
    id: number;
  name: string;
  city: string | null;
  rooms: Room[];
  };
};

export default function HostelCard({ hostel }: Props) {
  const beds = hostel.rooms.reduce(
  (sum: number, room: Room) => sum + room.beds.length,
  0
);

  const occupied = hostel.rooms.reduce(
  (sum: number, room: Room) =>
    sum + room.beds.filter((bed: Bed) => bed.resident).length,
  0
);

  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{hostel.name}</h2>

          <p className="text-slate-500">
            {hostel.city ?? "Місто не вказано"}
          </p>
        </div>

        <Link
          href={`/hostels/${hostel.id}`}
          className="rounded-lg bg-slate-900 px-4 py-2 text-white hover:bg-slate-800"
        >
          Відкрити
        </Link>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Ліжок</p>

          <p className="mt-2 text-3xl font-bold">
            {beds}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Зайнято</p>

          <p className="mt-2 text-3xl font-bold text-blue-600">
            {occupied}
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-sm text-slate-500">Вільно</p>

          <p className="mt-2 text-3xl font-bold text-green-600">
            {beds - occupied}
          </p>
        </div>
      </div>
    </div>
  );
}
