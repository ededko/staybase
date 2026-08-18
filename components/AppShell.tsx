"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function AppShell({
  userName,
  role,
  permissions,
  children,
}: {
  userName: string;
  role?: "OWNER" | "ADMIN" | "STAFF";
  permissions: string[];
  children: React.ReactNode;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="app-shell min-h-screen md:flex">
      <div className="hidden h-screen shrink-0 md:block">
        <Sidebar role={role} permissions={permissions} />
      </div>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <button
            aria-label="Закрити меню"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)}
          />
          <div className="relative h-full shadow-2xl">
            <Sidebar role={role} permissions={permissions} mobile onNavigate={() => setMenuOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header userName={userName} onMenuOpen={() => setMenuOpen(true)} />
        <main className="min-w-0 flex-1 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
