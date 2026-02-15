'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useAuth } from '@/components/shared/auth-provider';
import { useArticleCount, useAllTags } from '@/lib/hooks/use-articles';
import { useFolders, useFolderArticleCounts } from '@/lib/hooks/use-folders';
import { FolderList } from '@/components/organization/folder-list';
import { TagCloud } from '@/components/organization/tag-cloud';
import { CollectionList } from '@/components/organization/collection-list';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  Star,
  Archive,
  BookMarked,
  Shuffle,
  Library,
  Clock,
  BarChart3,
} from 'lucide-react';
import type { FilterOption, ReadTimeFilter } from '@/lib/types';
import { db } from '@/lib/db';

const READ_TIME_FILTERS: { key: ReadTimeFilter; label: string; description: string }[] = [
  { key: 'short', label: 'Quick', description: '<5 min' },
  { key: 'medium', label: 'Medium', description: '5-15 min' },
  { key: 'long', label: 'Long', description: '>15 min' },
];

const FILTERS: { key: FilterOption; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All Articles', icon: <Library className="h-4 w-4" /> },
  { key: 'unread', label: 'Unread', icon: <BookOpen className="h-4 w-4" /> },
  { key: 'favorites', label: 'Favorites', icon: <Star className="h-4 w-4" /> },
  { key: 'archived', label: 'Archive', icon: <Archive className="h-4 w-4" /> },
];

export function Sidebar() {
  const { user } = useAuth();
  const userId = user?.uid || null;
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);

  const currentFilter = useAppStore((s) => s.currentFilter);
  const setFilter = useAppStore((s) => s.setFilter);
  const currentFolderId = useAppStore((s) => s.currentFolderId);
  const setFolderId = useAppStore((s) => s.setFolderId);
  const currentTagFilter = useAppStore((s) => s.currentTagFilter);
  const setTagFilter = useAppStore((s) => s.setTagFilter);
  const setActiveArticleId = useAppStore((s) => s.setActiveArticleId);
  const readTimeFilter = useAppStore((s) => s.readTimeFilter);
  const setReadTimeFilter = useAppStore((s) => s.setReadTimeFilter);
  const setSurpriseArticleId = useAppStore((s) => s.setSurpriseArticleId);
  const setStatsOpen = useAppStore((s) => s.setStatsOpen);
  const setSidebarOpen = useAppStore((s) => s.setSidebarOpen);

  // Close sidebar on mobile after selecting a filter
  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const articleCount = useArticleCount(userId);
  const allTags = useAllTags(userId);
  const folders = useFolders(userId);
  const folderCounts = useFolderArticleCounts(userId);

  const handleSurpriseMe = async () => {
    const articles = await db.articles
      .filter((a) => !a.isRead && !a.isArchived && a.userId === userId)
      .toArray();
    if (articles.length > 0) {
      const random = articles[Math.floor(Math.random() * articles.length)];
      setSurpriseArticleId(random.id);
    }
  };

  return (
    <div className="flex h-full w-64 flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-4">
        <BookMarked className="h-6 w-6 text-primary" />
        <h1 className="text-lg font-bold tracking-tight">Marginalia</h1>
      </div>

      <Separator />

      <ScrollArea className="flex-1 px-2 py-2">
        {/* Smart Filters */}
        <div className="space-y-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => { setFilter(f.key); closeSidebarOnMobile(); }}
              className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                currentFilter === f.key && !currentFolderId && !currentTagFilter
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
              }`}
            >
              {f.icon}
              <span>{f.label}</span>
              {f.key === 'all' && articleCount && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {articleCount.total}
                </span>
              )}
              {f.key === 'unread' && articleCount && articleCount.unread > 0 && (
                <span className="ml-auto text-xs text-muted-foreground">
                  {articleCount.unread}
                </span>
              )}
            </button>
          ))}

          {/* Surprise Me */}
          <button
            onClick={() => { handleSurpriseMe(); closeSidebarOnMobile(); }}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          >
            <Shuffle className="h-4 w-4" />
            <span>Surprise Me</span>
          </button>
        </div>

        <Separator className="my-3" />

        {/* Read Time Filter */}
        <div className="px-1">
          <div className="flex items-center gap-2 px-2 py-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">By Length</span>
          </div>
          <div className="flex gap-1 px-2">
            {READ_TIME_FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => { setReadTimeFilter(f.key!); closeSidebarOnMobile(); }}
                className={`flex-1 rounded-md px-2 py-1.5 text-xs transition-colors ${
                  readTimeFilter === f.key
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                }`}
                title={f.description}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <Separator className="my-3" />

        {/* Folders */}
        <FolderList
          folders={folders || []}
          folderCounts={folderCounts || new Map()}
          currentFolderId={currentFolderId}
          onSelectFolder={setFolderId}
          userId={userId}
        />

        <Separator className="my-3" />

        {/* Collections */}
        <CollectionList
          activeCollectionId={activeCollectionId}
          onSelectCollection={setActiveCollectionId}
        />

        <Separator className="my-3" />

        {/* Tags */}
        <TagCloud
          tags={allTags || []}
          currentTag={currentTagFilter}
          onSelectTag={setTagFilter}
        />
      </ScrollArea>

      {/* Stats footer */}
      {articleCount && (
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{articleCount.total} articles</span>
            <button
              onClick={() => setStatsOpen(true)}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
              title="Reading Stats"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Stats</span>
            </button>
            <span>{articleCount.unread} unread</span>
          </div>
        </div>
      )}
    </div>
  );
}
