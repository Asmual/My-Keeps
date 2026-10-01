import React from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';
import { getServerSession } from '@/lib/auth/session';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header initialSession={session} />
      <div className="flex-1 flex min-w-0">
        <Sidebar />
        <main className="flex-1 min-w-0 px-4 sm:px-6 md:px-10 py-6 pb-20 sm:pb-6 overflow-x-hidden">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
