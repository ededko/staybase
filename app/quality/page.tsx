import { createQualityEntry, updateQualityStatus } from "@/app/actions/quality";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/session";

const statuses:Record<string,string>={NEW:"Нове",REVIEWED:"Переглянуто",RESOLVED:"Вирішено"};
const categories=["Чистота","Шум","Персонал","Ремонт","Умови проживання","Безпека","Інше"];
export default async function QualityPage(){
 const {workspace}=await requireWorkspace();
 const [entries,hostels]=await Promise.all([prisma.qualityEntry.findMany({where:{workspaceId:workspace.id},include:{hostel:true,room:true},orderBy:{createdAt:"desc"}}),prisma.hostel.findMany({where:{workspaceId:workspace.id},include:{rooms:true},orderBy:{name:"asc"}})]);
 return <main className="operations-page p-4 sm:p-6 lg:p-8"><header className="operations-header"><div><p className="eyebrow">ВНУТРІШНІЙ КОНТРОЛЬ</p><h1 className="text-4xl font-bold">Якість</h1><p className="mt-2 text-slate-500">Відгуки, скарги та зауваження з незалежних платформ</p></div></header>
 <section className="operations-form mt-6 rounded-2xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">+ Додати відгук або зауваження</h2><form action={createQualityEntry} className="form-grid mt-4">
 <label>Джерело<select name="source"><option value="GOOGLE">Google</option><option value="AIRBNB">Airbnb</option><option value="FACEBOOK">Facebook</option><option value="DIRECT">Від мешканця</option><option value="INTERNAL">Внутрішнє</option><option value="OTHER">Інше</option></select></label>
 <label>Категорія<select name="category">{categories.map(c=><option key={c}>{c}</option>)}</select></label>
 <label>Хостел<select name="hostelId"><option value="">Не вказано</option>{hostels.map(h=><option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
 <label>Кімната<select name="roomId"><option value="">Не вказано</option>{hostels.flatMap(h=>h.rooms.map(r=><option key={r.id} value={r.id}>{h.name} · {r.name}</option>))}</select></label>
 <label>Автор<input name="authorName" placeholder="Ім’я або анонімно" /></label><label>Оцінка<select name="rating"><option value="">Без оцінки</option>{[5,4,3,2,1].map(n=><option key={n} value={n}>{n} / 5</option>)}</select></label>
 <label>Відповідальний<input name="assignedTo" placeholder="Кому показати / хто вирішує" /></label><label className="form-wide">Текст<textarea name="text" required rows={4} placeholder="Вставте текст відгуку або опишіть зауваження" /></label>
 <button className="primary-action form-submit rounded-xl px-5 py-3 font-semibold">Зберегти</button></form></section>
 <section className="mt-8"><div className="section-heading"><div><p className="eyebrow">ЖУРНАЛ</p><h2>{entries.length} записів</h2></div></div><div className="operations-grid mt-4">{entries.map(e=><article key={e.id} className="operation-card"><div className="operation-card-top"><div><span className={`status-pill status-${e.status.toLowerCase()}`}>{statuses[e.status]}</span><h3>{e.category}</h3><p>{e.source} · {e.hostel?.name||"Без хостелу"}{e.room?` · ${e.room.name}`:""}</p></div>{e.rating&&<b className="rating">{e.rating} ★</b>}</div><p className="operation-description">{e.text}</p><div className="operation-meta">{e.authorName&&<span>Автор: {e.authorName}</span>}{e.assignedTo&&<span>Відповідальний: {e.assignedTo}</span>}<span>{e.createdAt.toLocaleDateString("uk-UA")}</span></div><form action={updateQualityStatus} className="status-form"><input type="hidden" name="id" value={e.id}/><select name="status" defaultValue={e.status}>{Object.entries(statuses).map(([v,l])=><option key={v} value={v}>{l}</option>)}</select><button>Змінити</button></form></article>)}{entries.length===0&&<div className="empty-state">Журнал якості поки порожній.</div>}</div></section></main>;
}
