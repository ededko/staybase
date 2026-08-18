import Link from "next/link";
import { createMaintenanceTicket, updateMaintenanceStatus } from "@/app/actions/maintenance";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/session";

const statusLabels: Record<string,string> = { NEW:"Нова", ACCEPTED:"Прийнята", IN_PROGRESS:"В роботі", DONE:"Виконана" };
const priorityLabels: Record<string,string> = { LOW:"Низька", NORMAL:"Звичайна", URGENT:"Термінова" };
const categories = ["Вода / сантехніка", "Електрика", "Замок / двері", "Ліжко / меблі", "Прибирання", "Постіль / речі", "Опалення", "Інше"];

export default async function MaintenancePage() {
  const { workspace } = await requireWorkspace();
  const [tickets, hostels] = await Promise.all([
    prisma.maintenanceTicket.findMany({ where:{workspaceId:workspace.id}, include:{hostel:true,room:true}, orderBy:[{status:"asc"},{createdAt:"desc"}] }),
    prisma.hostel.findMany({ where:{workspaceId:workspace.id}, include:{rooms:{orderBy:{name:"asc"}}}, orderBy:{name:"asc"} }),
  ]);
  const openCount = tickets.filter(t=>t.status!=="DONE").length;
  const urgentCount = tickets.filter(t=>t.priority==="URGENT"&&t.status!=="DONE").length;

  return <main className="operations-page p-4 sm:p-6 lg:p-8">
    <header className="operations-header"><div><p className="eyebrow">ОБСЛУГОВУВАННЯ</p><h1 className="text-4xl font-bold">Ремонтні заявки</h1><p className="mt-2 text-slate-500">Поломки, постачання та завдання для команди</p></div><Link className="primary-action rounded-xl px-5 py-3 font-semibold" href="/maintenance/qr">QR-коди</Link></header>
    <div className="mini-metrics mt-5"><div><b>{openCount}</b><span>Відкрито</span></div><div className="danger"><b>{urgentCount}</b><span>Термінових</span></div><div><b>{tickets.filter(t=>t.status==="DONE").length}</b><span>Виконано</span></div></div>
    <section className="operations-form mt-6 rounded-2xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">+ Створити заявку вручну</h2>
      <form action={createMaintenanceTicket} className="form-grid mt-4">
        <label>Хостел<select name="hostelId" required><option value="">Оберіть</option>{hostels.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
        <label>Кімната<select name="roomId"><option value="">Спільна зона / не вказано</option>{hostels.flatMap(h=>h.rooms.map(r=><option key={r.id} value={r.id}>{h.name} · {r.name}</option>))}</select></label>
        <label>Категорія<select name="category">{categories.map(c=><option key={c}>{c}</option>)}</select></label>
        <label>Терміновість<select name="priority"><option value="NORMAL">Звичайна</option><option value="URGENT">Термінова</option><option value="LOW">Низька</option></select></label>
        <label>Хто повідомив<input name="reporterName" placeholder="Ім’я" /></label><label>Телефон<input name="reporterPhone" inputMode="tel" /></label>
        <label>Відповідальний<input name="assignedTo" placeholder="Майстер або працівник" /></label><label>Посилання на фото<input name="photoUrl" type="url" placeholder="Необов’язково" /></label>
        <label className="form-wide">Що сталося<textarea name="description" required rows={3} placeholder="Коротко опишіть проблему" /></label>
        <button className="primary-action form-submit rounded-xl px-5 py-3 font-semibold">Створити заявку</button>
      </form>
    </section>
    <section className="mt-8"><div className="section-heading"><div><p className="eyebrow">СПИСОК</p><h2>Усі заявки</h2></div></div><div className="operations-grid mt-4">
      {tickets.map(ticket=><article key={ticket.id} className={`operation-card priority-${ticket.priority.toLowerCase()}`}><div className="operation-card-top"><div><span className={`status-pill status-${ticket.status.toLowerCase()}`}>{statusLabels[ticket.status]}</span><h3>{ticket.category}</h3><p>{ticket.hostel.name}{ticket.room ? ` · ${ticket.room.name}`:" · спільна зона"}</p></div><span className={`priority-badge ${ticket.priority.toLowerCase()}`}>{priorityLabels[ticket.priority]}</span></div><p className="operation-description">{ticket.description}</p><div className="operation-meta"><span>🕓 {ticket.createdAt.toLocaleString("uk-UA")}</span>{ticket.assignedTo&&<span>👤 {ticket.assignedTo}</span>}{ticket.reporterName&&<span>Від: {ticket.reporterName}</span>}</div>{ticket.photoUrl&&<a className="text-sm text-blue-600" href={ticket.photoUrl} target="_blank" rel="noreferrer">Відкрити фото →</a>}<form action={updateMaintenanceStatus} className="status-form"><input type="hidden" name="id" value={ticket.id}/><select name="status" defaultValue={ticket.status}>{Object.entries(statusLabels).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><button>Змінити</button></form></article>)}
      {tickets.length===0&&<div className="empty-state">Поки немає ремонтних заявок.</div>}
    </div></section>
  </main>;
}
