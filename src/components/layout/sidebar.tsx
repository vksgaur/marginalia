'use client';

import { useAppStore } from '@/lib/store';
import { useArticleCount, useAllTags } from '@/lib/hooks/use-articles';
import { useFolders, useFolderArticleCounts } from '@/lib/hooks/use-folders';
import { FolderList } from '@/components/organization/folder-list';
import { TagCloud } from '@/components/organization/tag-cloud';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  BookOpen,
  Star,
  Archive,
  BookMarked,
  Shuffle,
  Library,
} from 'lucide-react';
import type { FilterOption } from '@/lib/types';
import { db } from '@/lib/db';

const FILTERS: { key: FilterOption; label: string; icon: React.ReactNode }[] = [
  { key: 'all', label: 'All Articles', icon: <Library className="h-4 w-4" /> },
  { key: 'unread', label: 'Unread', icon: <BookOpen className="h-4 w-4" /> },
  { key: 'favorites', label: 'Favorites', icon: <Star className="h-4 w-4" /> },
  { key: 'archived', label: 'Archive', icon: <Archive className="h-4 w-4" /> },
];

export function Sidebar() {
  const currentFilter = useAppStore((s) => s.currentFilter);
  const setFilter = useAppStore((s) => s.setFilter);
  const currentFolderId = useAppStore((s) => s.currentFolderId);
  const setFolderId = useAppStore((s) => s.setFolderId);
  const currentTagFilter = useAppStore((s) => s.currentTagFilter);
  const setTagFilter = useAppStore((s) => s.setTagFilter);
  const setActiveArticleId = useAppStore((s) => s.setActiveArticleId);

  const articleCount = useArticleCount();
  const allTags = useAllTags();
  const folders = useFolders();
  const folderCounts = useFolderArticleCounts();

  const handleSurpriseMe = async () => {
    const articles = await db.articles
      .filter((a) => !a.isRead && !a.isArchived)
      .toArray();
    if (articles.length > 0) {
      const random = articles[Math.floor(Math.random() * articles.length)];
      setActiveArticleId(random.id);
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
              onClick={() => setFilter(f.key)}
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
            onClick={handleSurpriseMe}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
          >
            <Shuffle className="h-4 w-4" />
            <span>Surprise Me</span>
          </button>
        </div>

        <Separator className="my-3" />

        {/* Folders */}
        <FolderList
          folders={folders || []}
          folderCounts={folderCounts || new Map()}
          currentFolderId={currentFolderId}
          onSelectFolder={setFolderId}
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
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{articleCount.total} articles</span>
            <span>{articleCount.unread} unread</span>
          </div>
        </div>
      )}
    </div>
  );
}
