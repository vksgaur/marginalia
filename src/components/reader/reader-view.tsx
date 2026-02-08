'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAppStore } from '@/lib/store';
import { useArticle } from '@/lib/hooks/use-articles';
import { updateArticle, markAsRead } from '@/lib/hooks/use-articles';
import { useReadingSession } from '@/lib/hooks/use-reading-session';
import { ReaderToolbar } from './reader-toolbar';
import { ReaderContent } from './reader-content';
import { ReadingProgress } from './reading-progress';
import { HighlightsPanel } from './highlights-panel';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { Loader2 } from 'lucide-react';

export function ReaderView() {
  const activeArticleId = useAppStore((s) => s.activeArticleId);
  const setActiveArticleId = useAppStore((s) => s.setActiveArticleId);
  const isHighlightsPanelOpen = useAppStore((s) => s.isHighlightsPanelOpen);
  const toggleHighlightsPanel = useAppStore((s) => s.toggleHighlightsPanel);

  const article = useArticle(activeArticleId);
  const { startSession, endSession } = useReadingSession(activeArticleId);
  const progressRef = useRef(0);

  // Get all non-archived articles for navigation
  const allArticles = useLiveQuery(async () => {
    return db.articles.filter((a) => !a.isArchived).sortBy('dateAdded');
  }, []);

  const currentIndex = allArticles?.findIndex((a) => a.id === activeArticleId) ?? -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && allArticles ? currentIndex < allArticles.length - 1 : false;

  // Start reading session
  useEffect(() => {
    if (activeArticleId && article) {
      startSession();
      markAsRead(activeArticleId);
      return () => {
        endSession();
      };
    }
  }, [activeArticleId, article, startSession, endSession]);

  // Save progress on unmount
  useEffect(() => {
    return () => {
      if (activeArticleId && progressRef.current > 0) {
        updateArticle(activeArticleId, { readProgress: progressRef.current });
      }
    };
  }, [activeArticleId]);

  const handleClose = useCallback(() => {
    if (activeArticleId && progressRef.current > 0) {
      updateArticle(activeArticleId, { readProgress: progressRef.current });
    }
    setActiveArticleId(null);
  }, [activeArticleId, setActiveArticleId]);

  const handleScrollProgress = useCallback(
    (progress: number) => {
      progressRef.current = progress;
    },
    []
  );

  const handlePrevArticle = useCallback(() => {
    if (hasPrev && allArticles) {
      if (activeArticleId) {
        updateArticle(activeArticleId, { readProgress: progressRef.current });
      }
      setActiveArticleId(allArticles[currentIndex - 1].id);
    }
  }, [hasPrev, allArticles, currentIndex, activeArticleId, setActiveArticleId]);

  const handleNextArticle = useCallback(() => {
    if (hasNext && allArticles) {
      if (activeArticleId) {
        updateArticle(activeArticleId, { readProgress: progressRef.current });
      }
      setActiveArticleId(allArticles[currentIndex + 1].id);
    }
  }, [hasNext, allArticles, currentIndex, activeArticleId, setActiveArticleId]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowLeft' && !e.metaKey && !e.ctrlKey) {
        handlePrevArticle();
      } else if (e.key === 'ArrowRight' && !e.metaKey && !e.ctrlKey) {
        handleNextArticle();
      } else if (e.key === 'h' && !e.metaKey && !e.ctrlKey) {
        const active = document.activeElement;
        if (active?.tagName !== 'INPUT' && active?.tagName !== 'TEXTAREA') {
          toggleHighlightsPanel();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, handlePrevArticle, handleNextArticle, toggleHighlightsPanel]);

  if (!activeArticleId) return null;

  if (!article) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <ReadingProgress progress={progressRef.current} />

      <ReaderToolbar
        title={article.title}
        url={article.url}
        articleId={article.id}
        onClose={handleClose}
        onPrevArticle={handlePrevArticle}
        onNextArticle={handleNextArticle}
        hasPrev={hasPrev}
        hasNext={hasNext}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Article content */}
        <ReaderContent
          articleId={article.id}
          content={article.content}
          onScrollProgress={handleScrollProgress}
        />

        {/* Highlights panel */}
        {isHighlightsPanelOpen && (
          <HighlightsPanel
            articleId={article.id}
            onClose={toggleHighlightsPanel}
          />
        )}
      </div>
    </div>
  );
}
