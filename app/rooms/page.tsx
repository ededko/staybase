import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/session";

export default async function RoomsPage({ searchParams }: { searchParams: Promise<{ hostel?: string; query?: string }> }) {
  const { hostel = "", query = "" } = await searchParams;
  const { workspace } = await requireWorkspace();
  const hostelId = Number(hostel) || undefined;
  const [rooms, hostels] = await Promise.all([
    prisma.room.findMany({
      where: {
        hostel: { workspaceId: workspace.id },
        ...(hostelId ? { hostelId } : {}),
        ...(query.trim() ? { name: { contains: query.trim(), mode: "insensitive" as const } } : {}),
      },
      include: { hostel: true, beds: { where: { isDisabled: false }, select: { resident: { select: { isActive: true } } } } },
      orderBy: [{ hostel: { name: "asc" } }, { name: "asc" }],
    }),
    prisma.hostel.findMany({ where: { workspaceId: workspace.id }, orderBy: { name: "asc" } }),
  ]);

  return <main className="operations-page p-4 sm:p-6 lg:p-8">
    <header className="operations-header"><div><p className="eyebrow">РОЗМІЩЕННЯ</p><h1 className="text-4xl font-bold">Кімнати</h1><p className="mt-2 text-slate-500">Усі кімнати мережі в одному місці</p></div></header>
    <form className="mt-6 grid max-w-3xl gap-3 rounded-2xl border bg-white p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto]">
      <input name="query" defaultValue={query} placeholder="Назва кімнати" />
      <select name="hostel" defaultValue={hostel}><option value="">Усі хостели</option>{hostels.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <button className="primary-action rounded-xl px-4 py-2 font-semibold">Знайти</button>
    </form>
    <section className="room-overview-grid mt-6">
      {rooms.map((room) => {
        const occupied = room.beds.filter((bed) => bed.resident?.isActive).length;
        const free = room.beds.length - occupied;
        const percentage = room.beds.length ? Math.round(occupied / room.beds.length * 100) : 0;
        return <article className="room-overview-card" key={room.id}>
          <div><p className="eyebrow">{room.hostel.name}</p><h2>{room.name}</h2><p>Поверх: {room.floor ?? "—"}</p></div>
          <span className={`occupancy-dot ${percentage === 100 ? "full" : percentage >= 50 ? "medium" : "low"}`}>{percentage}%</span>
          <div className="room-overview-stats"><span><b>{room.beds.length}</b>ліжок</span><span><b>{occupied}</b>зайнято</span><span><b>{free}</b>вільно</span></div>
          <Link href={`/hostels/${room.hostelId}/rooms/${room.id}`}>Відкрити →</Link>
        </article>;
      })}
      {rooms.length === 0 && <div className="empty-state">Кімнат не знайдено.</div>}
    </section>
  </main>;
}
