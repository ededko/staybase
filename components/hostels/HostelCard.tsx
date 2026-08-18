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
    <div className="hostel-card rounded-2xl border bg-white shadow-sm">
      <div className="hostel-card-header flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{hostel.name}</h2>

          <p className="text-slate-500">
            {hostel.city ?? "Місто не вказано"}
          </p>
        </div>

        <Link
          href={`/hostels/${hostel.id}`}
          className="hostel-card-action rounded-xl px-4 py-2"
        >
          Відкрити
        </Link>
      </div>

      <div className="hostel-card-stats grid grid-cols-3">
        <div className="hostel-card-stat rounded-xl bg-slate-50">
          <p className="text-sm text-slate-500">Ліжок</p>

          <p className="mt-2 text-3xl font-bold">
            {beds}
          </p>
        </div>

        <div className="hostel-card-stat rounded-xl bg-slate-50">
          <p className="text-sm text-slate-500">Зайнято</p>

          <p className="mt-2 text-3xl font-bold text-blue-600">
            {occupied}
          </p>
        </div>

        <div className="hostel-card-stat rounded-xl bg-slate-50">
          <p className="text-sm text-slate-500">Вільно</p>

          <p className="mt-2 text-3xl font-bold text-green-600">
            {beds - occupied}
          </p>
        </div>
      </div>
    </div>
  );
}
