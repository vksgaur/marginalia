'use client';

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { useArticle } from '@/lib/hooks/use-articles';
import { useAppStore } from '@/lib/store';
import { getRecommendations } from '@/lib/recommendations';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Clock, Sparkles } from 'lucide-react';

interface RecommendationsProps {
  articleId: string;
}

export function Recommendations({ articleId }: RecommendationsProps) {
  const currentArticle = useArticle(articleId);
  const setActiveArticleId = useAppStore((s) => s.setActiveArticleId);

  const allArticles = useLiveQuery(async () => {
    return db.articles.toArray();
  }, []);

  const recommendations = useMemo(() => {
    if (!currentArticle || !allArticles) return [];
    return getRecommendations(currentArticle, allArticles);
  }, [currentArticle, allArticles]);

  if (recommendations.length === 0) return null;

  return (
    <div className="border-t border-border/30 mt-12 pt-8 pb-12">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium">You might also like</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {recommendations.map(({ article, matchedTags }) => (
          <button
            key={article.id}
            onClick={() => setActiveArticleId(article.id)}
            className="flex gap-3 rounded-lg border border-border/50 p-3 text-left hover:bg-accent/30 transition-colors"
          >
            {article.thumbnail ? (
              <div className="h-16 w-20 flex-shrink-0 rounded overflow-hidden bg-muted">
                <img
                  src={article.thumbnail}
                  alt=""
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
            ) : (
              <div className="h-16 w-20 flex-shrink-0 rounded bg-muted flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-muted-foreground/30" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium line-clamp-2 leading-snug">
                {article.title}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                <span>{article.siteName}</span>
                <span className="flex items-center gap-0.5">
                  <Clock className="h-3 w-3" />
                  {article.readingTime} min
                </span>
              </div>
              {matchedTags.length > 0 && (
                <div className="flex gap-1 mt-1.5">
                  {matchedTags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-[10px] py-0 h-4">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
