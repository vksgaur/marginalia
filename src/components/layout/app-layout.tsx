'use client';

import { useAppStore } from '@/lib/store';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { ToastProvider } from '@/components/shared/toast';
import { KeyboardShortcuts } from '@/components/shared/keyboard-shortcuts';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const isSidebarOpen = useAppStore((s) => s.isSidebarOpen);

  return (
    <ToastProvider>
      <KeyboardShortcuts />
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Sidebar */}
        <aside
          className={`${
            isSidebarOpen ? 'w-64' : 'w-0'
          } flex-shrink-0 overflow-hidden transition-all duration-200 ease-in-out border-r border-border bg-card`}
        >
          <Sidebar />
        </aside>

        {/* Main content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header />
          <main className="flex-1 overflow-y-auto custom-scrollbar">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
