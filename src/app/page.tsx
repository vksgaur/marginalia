'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { AddArticleForm } from '@/components/library/add-article-form';
import { ArticleGrid } from '@/components/library/article-grid';
import { ReaderView } from '@/components/reader/reader-view';
import { useAppStore } from '@/lib/store';

export default function HomePage() {
  const activeArticleId = useAppStore((s) => s.activeArticleId);

  return (
    <AppLayout>
      <AddArticleForm />
      <ArticleGrid />
      {activeArticleId && <ReaderView />}
    </AppLayout>
  );
}
