import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { updateResidentDetails } from "@/app/actions/residents";
import ResidentFormFields, { BedOption } from "@/components/residents/ResidentFormFields";
import { requireWorkspace } from "@/lib/session";

type Props = { params: Promise<{ id: string }> };

function formatDate(date: Date | null) {
  return date ? date.toISOString().slice(0, 10) : "";
}

export default async function EditResidentPage({ params }: Props) {
  const { id } = await params;
  const residentId = Number(id);
  const { workspace } = await requireWorkspace();
  const [resident, beds] = await Promise.all([
    prisma.resident.findFirst({ where: { id: residentId, workspaceId: workspace.id } }),
    prisma.bed.findMany({
      where: {
        isDisabled: false,
        room: { hostel: { workspaceId: workspace.id } },
        OR: [{ resident: { is: null } }, { resident: { is: { id: residentId } } }],
      },
      include: { room: { include: { hostel: true } } },
      orderBy: [{ room: { hostel: { name: "asc" } } }, { room: { name: "asc" } }, { number: "asc" }],
    }),
  ]);

  if (!resident || !resident.isActive) notFound();

  const bedOptions: BedOption[] = beds.map((bed) => ({
    id: bed.id,
    number: bed.number,
    roomId: bed.roomId,
    roomName: bed.room.name,
    hostelId: bed.room.hostelId,
    hostelName: bed.room.hostel.name,
  }));

  return (
    <div className="max-w-2xl p-4 sm:p-6 lg:p-8">
      <Link href={`/residents/${resident.id}`} className="text-blue-600 hover:underline">← Назад до профілю</Link>
      <h1 className="mt-6 text-4xl font-bold text-slate-800">Редагувати мешканця</h1>

      <form action={updateResidentDetails} className="mt-8 space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
        <input type="hidden" name="residentId" value={resident.id} />
        <ResidentFormFields
          beds={bedOptions}
          resident={{
            firstName: resident.firstName,
            lastName: resident.lastName,
            phone: resident.phone,
            email: resident.email,
            notes: resident.notes,
            checkIn: formatDate(resident.checkIn),
            checkOut: formatDate(resident.checkOut),
            bedId: resident.bedId,
            birthDate: formatDate(resident.birthDate),
            gender: resident.gender,
          }}
        />
        <button className="rounded-lg bg-slate-900 px-5 py-3 text-white hover:bg-slate-800">Зберегти зміни</button>
      </form>
    </div>
  );
}
