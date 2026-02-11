'use client';

import { useAppStore } from '@/lib/store';
import { useAuth } from '@/components/shared/auth-provider';
import { useDailyHighlights } from '@/lib/hooks/use-highlights';
import { HIGHLIGHT_COLORS } from '@/lib/constants';
import { X, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function DailyHighlights() {
  const { user } = useAuth();
  const userId = user?.uid || null;
  const dailyHighlightDismissedDate = useAppStore((s) => s.dailyHighlightDismissedDate);
  const dismissDailyHighlights = useAppStore((s) => s.dismissDailyHighlights);
  const setActiveArticleId = useAppStore((s) => s.setActiveArticleId);

  const highlights = useDailyHighlights(userId);

  // Don't show if dismissed today
  if (dailyHighlightDismissedDate === new Date().toDateString()) return null;
  if (!highlights || highlights.length === 0) return null;

  return (
    <div className="mx-6 mt-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-yellow-500" />
          <h3 className="text-sm font-medium">Daily Highlights</h3>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={dismissDailyHighlights}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="space-y-2.5">
        {highlights.map((h) => (
          <button
            key={h.id}
            onClick={() => setActiveArticleId(h.articleId)}
            className="flex gap-2 w-full text-left rounded-md p-2 hover:bg-accent/50 transition-colors"
          >
            <div
              className="w-1 rounded-full flex-shrink-0 mt-0.5"
              style={{ backgroundColor: HIGHLIGHT_COLORS[h.color].bg }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm line-clamp-2">{h.text}</p>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {h.articleTitle}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
