export const permissionGroups = [
  { label: "Dashboard", items: [["DASHBOARD_VIEW", "Перегляд Dashboard"]] },
  { label: "Хостели", items: [["HOSTELS_VIEW", "Перегляд"], ["HOSTELS_CREATE", "Додавання"], ["HOSTELS_EDIT", "Редагування"], ["HOSTELS_DELETE", "Видалення"]] },
  { label: "Кімнати й ліжка", items: [["ROOMS_VIEW", "Перегляд"], ["ROOMS_CREATE", "Додавання"], ["ROOMS_EDIT", "Редагування"], ["ROOMS_DELETE", "Видалення"]] },
  { label: "Мешканці", items: [["RESIDENTS_VIEW", "Перегляд"], ["RESIDENTS_CREATE", "Заселення"], ["RESIDENTS_EDIT", "Редагування / переселення"], ["RESIDENTS_CHECKOUT", "Виселення"]] },
  { label: "Платежі", items: [["PAYMENTS_VIEW", "Перегляд"], ["PAYMENTS_CREATE", "Приймання"], ["PAYMENTS_EDIT", "Редагування"], ["FINANCE_VIEW", "Фінансова статистика"]] },
  { label: "Запити на заселення", items: [["APPLICATIONS_VIEW", "Перегляд"], ["APPLICATIONS_CREATE", "Створення"], ["APPLICATIONS_EDIT", "Зміна статусу"]] },
  { label: "Ремонти", items: [["MAINTENANCE_VIEW", "Перегляд усіх"], ["MAINTENANCE_ASSIGNED", "Перегляд призначених собі"], ["MAINTENANCE_CREATE", "Створення"], ["MAINTENANCE_EDIT", "Призначення і статус"]] },
  { label: "Внутрішні заявки", items: [["REQUESTS_VIEW", "Перегляд усіх"], ["REQUESTS_OWN", "Власні та призначені"], ["REQUESTS_CREATE", "Створення"], ["REQUESTS_EDIT", "Призначення і статус"]] },
  { label: "Якість", items: [["QUALITY_VIEW", "Перегляд"], ["QUALITY_CREATE", "Створення"], ["QUALITY_EDIT", "Зміна статусу"]] },
  { label: "Команда", items: [["TEAM_VIEW", "Перегляд"], ["TEAM_MANAGE", "Запрошення й доступи"], ["AUDIT_VIEW", "Журнал дій"]] },
] as const;

export type Permission = typeof permissionGroups[number]["items"][number][0];

export const allPermissions = permissionGroups.flatMap((group) => group.items.map(([value]) => value)) as Permission[];

export function effectivePermissions(member: {
  role: "OWNER" | "ADMIN" | "STAFF";
  permissions: string[];
  permissionsConfigured: boolean;
}) {
  if (member.role === "OWNER") return allPermissions;
  if (!member.permissionsConfigured && member.role === "ADMIN") return allPermissions.filter((item) => item !== "TEAM_MANAGE");
  if (!member.permissionsConfigured && member.role === "STAFF") return ["REQUESTS_OWN", "REQUESTS_CREATE"] as Permission[];
  return member.permissions.filter((item): item is Permission => allPermissions.includes(item as Permission));
}

