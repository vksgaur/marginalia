'use client';

import { useAppStore } from '@/lib/store';
import { useAuth } from '@/components/shared/auth-provider';
import { useArticles } from '@/lib/hooks/use-articles';
import { ArticleCard } from './article-card';
import { BulkToolbar } from './bulk-toolbar';
import { EmptyState } from './empty-state';
import { Loader2 } from 'lucide-react';

export function ArticleGrid() {
  const { user } = useAuth();
  const userId = user?.uid || null;

  const filter = useAppStore((s) => s.currentFilter);
  const folderId = useAppStore((s) => s.currentFolderId);
  const tagFilter = useAppStore((s) => s.currentTagFilter);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const sortOption = useAppStore((s) => s.sortOption);
  const viewMode = useAppStore((s) => s.viewMode);
  const readTimeFilter = useAppStore((s) => s.readTimeFilter);
  const searchScope = useAppStore((s) => s.searchScope);

  const articles = useArticles(filter, folderId, tagFilter, searchQuery, sortOption, userId, readTimeFilter, searchScope);

  if (articles === undefined) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (articles.length === 0) {
    return <EmptyState />;
  }

  const articleIds = articles.map((a) => a.id);

  if (viewMode === 'list') {
    return (
      <div>
        <BulkToolbar allArticleIds={articleIds} />
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} viewMode="list" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <BulkToolbar allArticleIds={articleIds} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-6">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} viewMode="grid" />
        ))}
      </div>
    </div>
  );
}
