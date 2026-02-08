'use client';

import { useAppStore } from '@/lib/store';
import { ThemeToggle } from '@/components/shared/theme-toggle';
import { UserMenu } from '@/components/shared/user-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
} from 'lucide-react';
import type { SortOption } from '@/lib/types';

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: 'dateAdded', label: 'Date Added' },
  { key: 'lastRead', label: 'Last Read' },
  { key: 'readingTime', label: 'Reading Time' },
  { key: 'title', label: 'Title (A-Z)' },
];

export function Header() {
  const isSidebarOpen = useAppStore((s) => s.isSidebarOpen);
  const toggleSidebar = useAppStore((s) => s.toggleSidebar);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const viewMode = useAppStore((s) => s.viewMode);
  const setViewMode = useAppStore((s) => s.setViewMode);
  const sortOption = useAppStore((s) => s.sortOption);
  const setSortOption = useAppStore((s) => s.setSortOption);

  return (
    <header className="flex items-center gap-2 sm:gap-3 border-b border-border px-3 sm:px-4 py-3">
      {/* Sidebar toggle — hamburger on mobile, panel icons on desktop */}
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
        <span className="md:hidden">
          <Menu className="h-4 w-4" />
        </span>
        <span className="hidden md:inline">
          {isSidebarOpen ? (
            <PanelLeftClose className="h-4 w-4" />
          ) : (
            <PanelLeftOpen className="h-4 w-4" />
          )}
        </span>
      </Button>

      {/* Search */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {/* Sort */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Sort">
              <ArrowUpDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SORT_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.key}
                onClick={() => setSortOption(opt.key)}
                className={sortOption === opt.key ? 'bg-accent' : ''}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* View mode */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
          title={viewMode === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
        >
          {viewMode === 'grid' ? (
            <List className="h-4 w-4" />
          ) : (
            <LayoutGrid className="h-4 w-4" />
          )}
        </Button>

        {/* Theme */}
        <ThemeToggle />

        {/* User menu */}
        <UserMenu />
      </div>
    </header>
  );
}
