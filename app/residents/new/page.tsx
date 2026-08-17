import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { checkInResident } from "@/app/actions/residents";
import ResidentFormFields, { BedOption } from "@/components/residents/ResidentFormFields";
import { requireWorkspace } from "@/lib/session";

export default async function NewResidentPage() {
  const { workspace } = await requireWorkspace();
  const beds = await prisma.bed.findMany({
    where: { resident: { is: null }, isDisabled: false, room: { hostel: { workspaceId: workspace.id } } },
    include: { room: { include: { hostel: true } } },
    orderBy: [{ room: { hostel: { name: "asc" } } }, { room: { name: "asc" } }, { number: "asc" }],
  });
  const bedOptions: BedOption[] = beds.map((bed) => ({
    id: bed.id,
    number: bed.number,
    roomId: bed.roomId,
    roomName: bed.room.name,
    hostelId: bed.room.hostelId,
    hostelName: bed.room.hostel.name,
  }));

  return (
    <div className="max-w-2xl p-8">
      <Link href="/residents" className="text-blue-600 hover:underline">← Назад до мешканців</Link>
      <h1 className="mt-6 text-4xl font-bold text-slate-800">Заселити мешканця</h1>
      <p className="mt-2 text-slate-500">Оберіть доступне ліжко та внесіть дані мешканця.</p>

      {bedOptions.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed p-8 text-center text-slate-500">Доступних ліжок немає.</div>
      ) : (
        <form action={checkInResident} className="mt-8 space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
          <ResidentFormFields beds={bedOptions} />
          <button className="rounded-lg bg-green-600 px-5 py-3 text-white hover:bg-green-700">Заселити</button>
        </form>
      )}
    </div>
  );
}
