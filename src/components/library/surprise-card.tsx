'use client';

import { useAppStore } from '@/lib/store';
import { useArticle } from '@/lib/hooks/use-articles';
import { useHighlightCount } from '@/lib/hooks/use-highlights';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Shuffle, Tag } from 'lucide-react';
import { db } from '@/lib/db';
import { useAuth } from '@/components/shared/auth-provider';

export function SurpriseCard() {
  const surpriseArticleId = useAppStore((s) => s.surpriseArticleId);
  const setSurpriseArticleId = useAppStore((s) => s.setSurpriseArticleId);
  const setActiveArticleId = useAppStore((s) => s.setActiveArticleId);
  const { user } = useAuth();
  const userId = user?.uid || null;

  const article = useArticle(surpriseArticleId);
  const highlightCount = useHighlightCount(surpriseArticleId);

  const handleRead = () => {
    if (surpriseArticleId) {
      setActiveArticleId(surpriseArticleId);
      setSurpriseArticleId(null);
    }
  };

  const handleShuffle = async () => {
    const articles = await db.articles
      .filter((a) => !a.isRead && !a.isArchived && a.userId === userId && a.id !== surpriseArticleId)
      .toArray();
    if (articles.length > 0) {
      const random = articles[Math.floor(Math.random() * articles.length)];
      setSurpriseArticleId(random.id);
    }
  };

  if (!surpriseArticleId || !article) return null;

  return (
    <Dialog open={!!surpriseArticleId} onOpenChange={() => setSurpriseArticleId(null)}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        {/* Thumbnail */}
        {article.thumbnail ? (
          <div className="h-40 overflow-hidden bg-muted">
            <img
              src={article.thumbnail}
              alt=""
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-40 bg-muted flex items-center justify-center">
            <BookOpen className="h-12 w-12 text-muted-foreground/30" />
          </div>
        )}

        <div className="p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold leading-tight">{article.title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{article.siteName}</p>
          </div>

          {article.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-3">{article.excerpt}</p>
          )}

          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {article.readingTime} min
            </span>
            {highlightCount !== undefined && highlightCount > 0 && (
              <span>{highlightCount} highlights</span>
            )}
          </div>

          {article.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  <Tag className="h-3 w-3 mr-1" />
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button onClick={handleRead} className="flex-1">
              <BookOpen className="h-4 w-4 mr-2" />
              Read This
            </Button>
            <Button variant="outline" onClick={handleShuffle}>
              <Shuffle className="h-4 w-4 mr-2" />
              Shuffle
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
