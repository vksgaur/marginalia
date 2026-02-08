'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { AddArticleForm } from '@/components/library/add-article-form';
import { ArticleGrid } from '@/components/library/article-grid';
import { ReaderView } from '@/components/reader/reader-view';
import { LoginScreen } from '@/components/shared/login-screen';
import { useAuth } from '@/components/shared/auth-provider';
import { useAppStore } from '@/lib/store';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const activeArticleId = useAppStore((s) => s.activeArticleId);
  const { user, loading, isConfigured } = useAuth();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If Firebase is configured but user isn't signed in, show login
  if (isConfigured && !user) {
    return <LoginScreen />;
  }

  // If Firebase is NOT configured, allow anonymous usage (local only)
  return (
    <AppLayout>
      <AddArticleForm />
      <ArticleGrid />
      {activeArticleId && <ReaderView />}
    </AppLayout>
  );
}
