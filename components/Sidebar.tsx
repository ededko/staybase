
import Link from "next/link";

const menu = [
  {
    name: "Dashboard",
    href: "/",
    icon: "🏠",
  },
  {
    name: "Хостели",
    href: "/hostels",
    icon: "🏢",
  },
  {
    name: "Кімнати",
    href: "#",
    icon: "🛏️",
  },
  {
    name: "Мешканці",
    href: "/residents",
    icon: "👤",
  },
  {
    name: "Платежі",
    href: "/payments",
    icon: "💳",
  },
  {
    name: "Заявки",
    href: "#",
    icon: "📝",
  },
  {
    name: "Відгуки",
    href: "#",
    icon: "⭐",
  },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white">
      <div className="border-b border-slate-800 p-6">
        <h1 className="text-2xl font-bold">
          StayBase
        </h1>

        <p className="text-slate-400">
          CRM
        </p>
      </div>

      <nav className="p-4">
        {menu.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className="mb-2 flex items-center gap-3 rounded-xl px-4 py-3 hover:bg-slate-800"
          >
            <span>{item.icon}</span>

            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
