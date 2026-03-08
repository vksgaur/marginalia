'use client';

import { useEffect, useCallback, useRef, useState } from 'react';
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
  // progressRef holds the latest value for use in unmount/close handlers (avoids stale closure).
  // displayProgress is the state copy that actually drives the progress bar re-renders.
  const progressRef = useRef(0);
  const [displayProgress, setDisplayProgress] = useState(0);

  // Toolbar hide-on-scroll state
  const [toolbarVisible, setToolbarVisible] = useState(true);

  // Swipe navigation refs
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

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

  // Always show toolbar when a new article opens
  useEffect(() => {
    setToolbarVisible(true);
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
      setDisplayProgress(progress);
    },
    []
  );

  const handleScrollDirection = useCallback((dir: 'up' | 'down') => {
    setToolbarVisible(dir === 'up');
  }, []);

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

  // Swipe to navigate (mobile)
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    // Don't navigate while text is selected
    if (!window.getSelection()?.isCollapsed) {
      touchStartRef.current = null;
      return;
    }
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = Math.abs(t.clientY - touchStartRef.current.y);
    touchStartRef.current = null;

    if (Math.abs(dx) > 60 && dy < 50) {
      if (dx < 0) handleNextArticle(); // swipe left → next
      else handlePrevArticle();        // swipe right → prev
    }
  }, [handleNextArticle, handlePrevArticle]);

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
    <div
      className="fixed inset-0 z-50 flex flex-col bg-background"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Toolbar wrapper — slides up on scroll-down, back on scroll-up */}
      <div
        className="flex-shrink-0 transition-transform duration-200 ease-in-out"
        style={{ transform: toolbarVisible ? 'translateY(0)' : 'translateY(-100%)' }}
      >
        <ReadingProgress progress={displayProgress} />
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
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Article content */}
        <ReaderContent
          articleId={article.id}
          content={article.content}
          articleTags={article.tags}
          onScrollProgress={handleScrollProgress}
          onScrollDirection={handleScrollDirection}
          initialProgress={article.readProgress}
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
