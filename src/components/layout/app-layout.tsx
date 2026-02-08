'use client';

import { useAppStore } from '@/lib/store';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { ToastProvider } from '@/components/shared/toast';
import { KeyboardShortcuts } from '@/components/shared/keyboard-shortcuts';

export function AppLayout({ children }: { children: React.ReactNode }) {
  const isSidebarOpen = useAppStore((s) => s.isSidebarOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);

  return (
    <ToastProvider>
      <KeyboardShortcuts />
      <div className="flex h-screen overflow-hidden bg-background">
        {/* Mobile overlay backdrop */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar — overlay on mobile, inline on desktop */}
        <aside
          className={`
            fixed md:relative z-40 md:z-auto
            h-full
            transition-all duration-200 ease-in-out
            border-r border-border bg-card
            ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0'}
            md:flex-shrink-0 md:overflow-hidden
          `}
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
