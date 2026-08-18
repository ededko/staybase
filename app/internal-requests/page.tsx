import { createInternalRequest, updateInternalRequest } from "@/app/actions/internal-requests";
import { prisma } from "@/lib/prisma";
import { requireWorkspace } from "@/lib/session";

const categoryLabels = { PURCHASE: "Закупівля", CLEANING: "Прибирання", LINEN: "Постіль / інвентар", REPAIR: "Ремонт", TRANSPORT: "Транспорт", BILL: "Рахунок до оплати", HR: "Кадрове питання", OTHER: "Інше" } as const;
const statusLabels = { NEW: "Нова", REVIEW: "На розгляді", APPROVED: "Погоджена", IN_PROGRESS: "У роботі", DONE: "Виконана", REJECTED: "Відхилена" } as const;

export default async function InternalRequestsPage() {
  const { workspace, session, permissions } = await requireWorkspace();
  const canViewAll = permissions.includes("REQUESTS_VIEW");
  const canCreate = permissions.includes("REQUESTS_CREATE");
  const canEdit = permissions.includes("REQUESTS_EDIT");
  const [requests, hostels, members] = await Promise.all([
    prisma.internalRequest.findMany({
      where: { workspaceId: workspace.id, ...(!canViewAll ? { OR: [{ requestedByUserId: session.user.id }, { assignedToUserId: session.user.id }] } : {}) },
      include: { hostel: true, room: true },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.hostel.findMany({ where: { workspaceId: workspace.id }, include: { rooms: { orderBy: { name: "asc" } } }, orderBy: { name: "asc" } }),
    prisma.workspaceMember.findMany({ where: { workspaceId: workspace.id }, include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } }),
  ]);
  const userNames = new Map(members.map((member) => [member.user.id, member.user.name]));

  return <main className="operations-page p-4 sm:p-6 lg:p-8">
    <header className="operations-header"><div><p className="eyebrow">КОМАНДА</p><h1 className="text-4xl font-bold">Внутрішні заявки</h1><p className="mt-2 text-slate-500">Закупівлі, рахунки й завдання між працівниками</p></div></header>
    {canViewAll && <div className="mini-metrics mt-5"><div><b>{requests.filter((item) => item.status === "NEW").length}</b><span>Нових</span></div><div><b>{requests.filter((item) => item.status === "REVIEW").length}</b><span>На розгляді</span></div><div><b>{requests.filter((item) => item.status === "IN_PROGRESS").length}</b><span>У роботі</span></div></div>}
    {canCreate && <section className="operations-form mt-6 rounded-2xl border bg-white p-5 shadow-sm"><h2 className="text-xl font-bold">+ Подати заявку</h2>
      <form action={createInternalRequest} className="form-grid mt-4">
        <label>Категорія<select name="category">{Object.entries(categoryLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Терміновість<select name="priority"><option value="NORMAL">Звичайна</option><option value="URGENT">Термінова</option><option value="LOW">Низька</option></select></label>
        <label>Хостел<select name="hostelId"><option value="">Не вказано</option>{hostels.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
        <label>Кімната<select name="roomId"><option value="">Не вказано</option>{hostels.flatMap((hostel) => hostel.rooms.map((room) => <option key={room.id} value={room.id}>{hostel.name} · {room.name}</option>))}</select></label>
        <label>Коротка назва<input name="title" required placeholder="Наприклад: купити засіб для підлоги" /></label>
        <label>Орієнтовна сума, zł<input name="amount" type="number" min="0" step="0.01" /></label>
        <label>Потрібно до<input name="dueDate" type="date" /></label>
        <label>Фото або рахунок<input name="attachment" type="file" accept="image/*,application/pdf" capture="environment" /></label>
        <label className="form-wide">Деталі<textarea name="description" required rows={3} /></label>
        <button className="primary-action form-submit rounded-xl px-5 py-3 font-semibold">Подати заявку</button>
      </form>
    </section>}
    <section className="operations-grid mt-7">
      {requests.map((request) => <article key={request.id} className={`operation-card priority-${request.priority.toLowerCase()}`}>
        <div className="operation-card-top"><div><span className={`status-pill status-${request.status.toLowerCase()}`}>{statusLabels[request.status]}</span><h3>{request.title}</h3><p>{categoryLabels[request.category]}{request.hostel ? ` · ${request.hostel.name}` : ""}{request.room ? ` · ${request.room.name}` : ""}</p></div>{request.amount && <b>{Number(request.amount).toFixed(2)} zł</b>}</div>
        <p className="operation-description">{request.description}</p>
        <div className="operation-meta"><span>Подав: {userNames.get(request.requestedByUserId) || "Працівник"}</span><span>{request.createdAt.toLocaleString("uk-UA")}</span>{request.assignedToUserId && <span>Виконавець: {userNames.get(request.assignedToUserId)}</span>}</div>
        {request.attachmentUrl && <a href={request.attachmentUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-blue-600">Відкрити вкладення →</a>}
        {canEdit && <form action={updateInternalRequest} className="status-form"><input type="hidden" name="id" value={request.id} /><select name="assignedToUserId" defaultValue={request.assignedToUserId || ""}><option value="">Без виконавця</option>{members.map((member) => <option key={member.user.id} value={member.user.id}>{member.user.name}</option>)}</select><select name="status" defaultValue={request.status}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button>Зберегти</button></form>}
      </article>)}
      {requests.length === 0 && <div className="empty-state">Заявок поки немає.</div>}
    </section>
  </main>;
}
