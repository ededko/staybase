import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { checkInResident } from "@/app/actions/residents";
import ResidentFormFields, { BedOption } from "@/components/residents/ResidentFormFields";
import { requireWorkspace } from "@/lib/session";

export default async function NewResidentPage({ searchParams }: { searchParams: Promise<{ applicationId?:string }> }) {
  const { applicationId } = await searchParams;
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
  const application = applicationId ? await prisma.leadApplication.findFirst({ where:{ id:Number(applicationId), workspaceId:workspace.id } }) : null;
  const [firstName = "", ...lastParts] = application?.fullName.split(/\s+/) || [];
  const initialResident = application ? { firstName, lastName:lastParts.join(" "), phone:application.phone, email:application.email, notes:application.notes, checkIn:application.desiredMoveIn?.toISOString().slice(0,10)||new Date().toISOString().slice(0,10), checkOut:"" } : undefined;

  return (
    <div className="max-w-2xl p-4 sm:p-6 lg:p-8">
      <Link href="/residents" className="text-blue-600 hover:underline">← Назад до мешканців</Link>
      <h1 className="mt-6 text-4xl font-bold text-slate-800">Заселити мешканця</h1>
      <p className="mt-2 text-slate-500">Оберіть доступне ліжко та внесіть дані мешканця.</p>

      {bedOptions.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed p-4 sm:p-6 lg:p-8 text-center text-slate-500">Доступних ліжок немає.</div>
      ) : (
        <form action={checkInResident} className="mt-8 space-y-4 rounded-2xl border bg-white p-6 shadow-sm">
          <ResidentFormFields beds={bedOptions} resident={initialResident} />
          {application && <input type="hidden" name="applicationId" value={application.id}/>} 
          <details className="rounded-xl border p-4"><summary className="cursor-pointer font-bold">Прийняти оплату одразу</summary><label className="mt-4 flex items-center gap-2"><input type="checkbox" name="createPayment"/> Записати платіж разом із заселенням</label><div className="mt-4 grid gap-3 md:grid-cols-2"><label>Сума, zł<input name="paymentAmount" type="number" min="0.01" step="0.01" className="w-full rounded-lg border p-3"/></label><label>Тип<select name="paymentType" className="w-full rounded-lg border p-3"><option value="RENT">Оренда</option><option value="DEPOSIT">Застава</option><option value="OTHER">Інше</option></select></label><label>Спосіб<select name="paymentMethod" className="w-full rounded-lg border p-3"><option value="CASH">Готівка</option><option value="BLIK">BLIK</option><option value="BANK_TRANSFER">Переказ</option><option value="CARD">Картка</option><option value="COMPANY">Фірма</option><option value="OTHER">Інше</option></select></label><label>Дата планової оплати<input name="paymentDueDate" type="date" className="w-full rounded-lg border p-3"/></label><label>Оплачено до<input name="paymentPaidThrough" type="date" className="w-full rounded-lg border p-3"/></label><label>Примітка<input name="paymentNotes" className="w-full rounded-lg border p-3"/></label></div></details>
          <button className="rounded-lg bg-green-600 px-5 py-3 text-white hover:bg-green-700">Заселити</button>
        </form>
      )}
    </div>
  );
}
