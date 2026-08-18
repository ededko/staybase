import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import AppShell from "@/components/AppShell";
import { getCurrentSession, getWorkspaceMembership } from "@/lib/session";
import { effectivePermissions } from "@/lib/permissions";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "StayBase CRM",
  description: "CRM для мережі хостелів",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();
  const membership = session ? await getWorkspaceMembership() : null;

  return (
    <html
      lang="uk"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="bg-slate-100">
        {session ? (
          <AppShell userName={session.user.name} role={membership?.role} permissions={membership ? effectivePermissions(membership) : []}>{children}</AppShell>
        ) : (
          <main className="flex min-h-screen items-center justify-center p-6">
            {children}
          </main>
        )}
      </body>
    </html>
  );
}
