import QRCode from "qrcode";
import Image from "next/image";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/session";

async function publicOrigin() {
  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const protocol = h.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
  return host ? `${protocol}://${host}` : (process.env.BETTER_AUTH_URL || "http://localhost:3000");
}

export default async function MaintenanceQrPage() {
  const { workspace } = await requireWorkspace();
  const [hostels, origin] = await Promise.all([
    prisma.hostel.findMany({ where:{workspaceId:workspace.id}, include:{rooms:{orderBy:{name:"asc"}}}, orderBy:{name:"asc"} }),
    publicOrigin(),
  ]);
  const locations = hostels.flatMap(hostel => [
    { key:`h-${hostel.id}`, title:hostel.name, subtitle:"Спільні зони хостелу", url:`${origin}/report/maintenance?hostelId=${hostel.id}` },
    ...hostel.rooms.map(room => ({ key:`r-${room.id}`, title:`${hostel.name} · ${room.name}`, subtitle:"Заявка з кімнати", url:`${origin}/report/maintenance?hostelId=${hostel.id}&roomId=${room.id}` })),
  ]);
  const cards = await Promise.all(locations.map(async location => ({...location, qr:await QRCode.toDataURL(location.url,{width:360,margin:2,color:{dark:"#111214",light:"#fffefa"}})})));

  return <main className="operations-page p-4 sm:p-6 lg:p-8"><header className="operations-header"><div><p className="eyebrow">ДЛЯ ДРУКУ</p><h1 className="text-4xl font-bold">QR-коди заявок</h1><p className="mt-2 text-slate-500">Роздрукуйте потрібний код і наклейте в кімнаті або спільній зоні</p></div><span className="primary-action rounded-xl px-5 py-3 font-semibold print:hidden">Друк: ⌘/Ctrl + P</span></header>
  <div className="qr-grid mt-6">{cards.map(card=><article key={card.key} className="qr-card"><div className="qr-brand"><b>StayBase</b><span>Технічна заявка</span></div><Image unoptimized width={260} height={260} src={card.qr} alt={`QR-код ${card.title}`}/><h2>{card.title}</h2><p>{card.subtitle}</p><strong>Відскануйте та опишіть проблему</strong><small>{card.url}</small></article>)}</div></main>;
}
