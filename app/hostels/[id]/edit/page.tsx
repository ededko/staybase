import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/session";
import { updateHostel } from "@/app/actions/hostels";

export default async function EditHostelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { workspace } = await requirePermission("HOSTELS_EDIT");
  const hostel = await prisma.hostel.findFirst({ where: { id: Number(id), workspaceId: workspace.id } });
  if (!hostel) notFound();
  return <main className="max-w-xl p-4 sm:p-6 lg:p-8"><Link href={`/hostels/${id}`} className="text-blue-600">← Назад</Link><h1 className="mt-6 text-3xl font-bold">Редагувати хостел</h1><form action={updateHostel} className="mt-6 space-y-4 rounded-2xl border bg-white p-6"><input type="hidden" name="hostelId" value={hostel.id}/><label className="block">Назва<input name="name" required defaultValue={hostel.name} className="mt-1 w-full rounded-lg border p-3"/></label><label className="block">Адреса<input name="address" defaultValue={hostel.address} className="mt-1 w-full rounded-lg border p-3"/></label><label className="block">Місто<input name="city" defaultValue={hostel.city || ""} className="mt-1 w-full rounded-lg border p-3"/></label><button className="rounded-lg bg-slate-900 px-5 py-3 text-white">Зберегти зміни</button></form></main>;
}
