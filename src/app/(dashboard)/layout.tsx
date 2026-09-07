import React from 'react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { MobileNav } from '@/components/layout/MobileNav';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <div className="flex-1 flex min-w-0">
        <div className="hidden sm:block">
          <Sidebar />
        </div>
        <main className="flex-1 min-w-0 px-4 sm:px-6 md:px-10 py-6 overflow-x-hidden">
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
