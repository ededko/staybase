import { createLeadApplication, updateLeadStatus } from "@/app/actions/applications";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/session";
import Link from "next/link";

const statusLabels: Record<string, string> = {
  NEW: "Новий", CONTACTED: "Зв’язались", VIEWING: "Перегляд", CONFIRMED: "Підтверджено", MOVED_IN: "Заселено", REJECTED: "Відмова",
};
const sourceLabels: Record<string, string> = { MANUAL: "Вручну", WEBSITE: "Сайт", FACEBOOK: "Facebook", INSTAGRAM: "Instagram", OLX: "OLX", AIRBNB: "Airbnb", OTHER: "Інше" };

export default async function ApplicationsPage() {
  const { workspace } = await requireWorkspace();
  const [applications, hostels] = await Promise.all([
    prisma.leadApplication.findMany({ where: { workspaceId: workspace.id }, include: { hostel: true }, orderBy: { createdAt: "desc" } }),
    prisma.hostel.findMany({ where: { workspaceId: workspace.id }, orderBy: { name: "asc" } }),
  ]);

  return <main className="operations-page p-4 sm:p-6 lg:p-8">
    <header className="operations-header"><div><p className="eyebrow">ДОВГОСТРОКОВЕ ЗАСЕЛЕННЯ</p><h1 className="text-4xl font-bold">Запити на заселення</h1><p className="mt-2 text-slate-500">Усі потенційні мешканці та історія роботи з ними</p></div></header>
    <section className="operations-form mt-6 rounded-2xl border bg-white p-5 shadow-sm">
      <h2 className="text-xl font-bold">+ Додати запит</h2>
      <form action={createLeadApplication} className="form-grid mt-4">
        <label>Ім’я та прізвище<input name="fullName" required placeholder="Наприклад, Іван Коваль" /></label>
        <label>Телефон<input name="phone" required inputMode="tel" placeholder="+48..." /></label>
        <label>Email<input name="email" type="email" placeholder="Необов’язково" /></label>
        <label>Джерело<select name="source">{Object.entries(sourceLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Хостел<select name="hostelId"><option value="">Ще не вибрано</option>{hostels.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}</select></label>
        <label>Кількість людей<input name="peopleCount" type="number" min="1" defaultValue="1" /></label>
        <label>Бажана дата заселення<input name="desiredMoveIn" type="date" /></label>
        <label>Місяців проживання<input name="stayMonths" type="number" min="1" placeholder="Наприклад, 6" /></label>
        <label>Бюджет, zł<input name="budget" type="number" min="0" step="0.01" /></label>
        <label>Відповідальний<input name="assignedTo" placeholder="Ім’я адміністратора" /></label>
        <label className="form-wide">Коментар<textarea name="notes" rows={3} placeholder="Побажання, домовленості, коли передзвонити" /></label>
        <button className="primary-action form-submit rounded-xl px-5 py-3 font-semibold">Зберегти запит</button>
      </form>
      <p className="integration-note mt-4">Підготовлено для автоматичних джерел: Facebook Lead Ads, Instagram, сайт та майбутня PMS/Airbnb інтеграція.</p>
    </section>
    <section className="mt-8"><div className="section-heading"><div><p className="eyebrow">В РОБОТІ</p><h2>{applications.length} запитів</h2></div></div>
      <div className="operations-grid mt-4">{applications.map(item => <article key={item.id} className="operation-card">
        <div className="operation-card-top"><div><span className={`status-pill status-${item.status.toLowerCase()}`}>{statusLabels[item.status]}</span><h3>{item.fullName}</h3><p>{item.phone} · {sourceLabels[item.source] || item.source}</p></div><b>{item.peopleCount} ос.</b></div>
        <div className="operation-meta"><span>🏢 {item.hostel?.name || "Хостел не вибрано"}</span><span>📅 {item.desiredMoveIn?.toLocaleDateString("uk-UA") || "Дата не вказана"}</span><span>⏳ {item.stayMonths ? `${item.stayMonths} міс.` : "Термін не вказано"}</span></div>
        {item.notes && <p className="operation-description">{item.notes}</p>}
        <Link href={`/residents/new?applicationId=${item.id}`} className="mt-3 inline-block rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white">Заселити</Link><form action={updateLeadStatus} className="status-form"><input type="hidden" name="id" value={item.id} /><select name="status" defaultValue={item.status}>{Object.entries(statusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select><button>Змінити</button></form>
      </article>)}{applications.length === 0 && <Empty text="Поки немає запитів на заселення." />}</div>
    </section>
  </main>;
}

function Empty({text}:{text:string}) { return <div className="empty-state">{text}</div>; }
