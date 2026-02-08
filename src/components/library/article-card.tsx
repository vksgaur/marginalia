'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { toggleFavorite, toggleArchive, deleteArticle } from '@/lib/hooks/use-articles';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/shared/toast';
import {
  Star,
  Archive,
  Trash2,
  Clock,
  ExternalLink,
  BookOpen,
  ArchiveRestore,
} from 'lucide-react';
import type { Article, ViewMode } from '@/lib/types';

interface ArticleCardProps {
  article: Article;
  viewMode: ViewMode;
}

export function ArticleCard({ article, viewMode }: ArticleCardProps) {
  const setActiveArticleId = useAppStore((s) => s.setActiveArticleId);
  const { toast } = useToast();
  const [showDelete, setShowDelete] = useState(false);

  const handleDelete = async () => {
    await deleteArticle(article.id);
    toast('Article deleted');
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite(article.id);
  };

  const handleArchive = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleArchive(article.id);
    toast(article.isArchived ? 'Moved to library' : 'Archived');
  };

  const timeAgo = getRelativeTime(article.dateAdded);

  if (viewMode === 'list') {
    return (
      <>
        <div
          className="group flex items-center gap-4 px-6 py-3 cursor-pointer hover:bg-accent/50 transition-colors border-b border-border"
          onClick={() => setActiveArticleId(article.id)}
        >
          {/* Thumbnail */}
          {article.thumbnail && (
            <div className="h-12 w-18 flex-shrink-0 rounded overflow-hidden bg-muted">
              <img
                src={article.thumbnail}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3
              className={`font-medium text-sm truncate ${
                article.isRead ? 'text-muted-foreground' : 'text-foreground'
              }`}
            >
              {article.title}
            </h3>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
              <span>{article.siteName}</span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {article.readingTime} min
              </span>
              <span>{timeAgo}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="hidden md:flex gap-1 flex-shrink-0">
            {article.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs py-0 h-5">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Progress */}
          {article.readProgress > 0 && article.readProgress < 100 && (
            <div className="w-12 h-1.5 bg-muted rounded-full flex-shrink-0">
              <div
                className="h-full rounded-full bg-blue-500"
                style={{ width: `${article.readProgress}%` }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <button onClick={handleFavorite} className="p-1.5 rounded hover:bg-accent">
              <Star
                className={`h-3.5 w-3.5 ${
                  article.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                }`}
              />
            </button>
            <button onClick={handleArchive} className="p-1.5 rounded hover:bg-accent">
              {article.isArchived ? (
                <ArchiveRestore className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Archive className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDelete(true);
              }}
              className="p-1.5 rounded hover:bg-accent"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        </div>

        <ConfirmDialog
          open={showDelete}
          onOpenChange={setShowDelete}
          title="Delete Article"
          description="This will permanently delete this article and all its highlights."
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={handleDelete}
        />
      </>
    );
  }

  // Grid view
  return (
    <>
      <div
        className="group cursor-pointer rounded-lg border border-border bg-card overflow-hidden transition-all hover:shadow-md hover:border-primary/20"
        onClick={() => setActiveArticleId(article.id)}
      >
        {/* Thumbnail */}
        {article.thumbnail ? (
          <div className="h-36 overflow-hidden bg-muted">
            <img
              src={article.thumbnail}
              alt=""
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          </div>
        ) : (
          <div className="h-36 bg-muted flex items-center justify-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/30" />
          </div>
        )}

        {/* Progress bar */}
        {article.readProgress > 0 && article.readProgress < 100 && (
          <div className="h-1 bg-muted">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${article.readProgress}%` }}
            />
          </div>
        )}

        {/* Content */}
        <div className="p-4">
          <h3
            className={`font-medium text-sm line-clamp-2 leading-snug ${
              article.isRead ? 'text-muted-foreground' : 'text-foreground'
            }`}
          >
            {article.title}
          </h3>

          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
            {article.excerpt}
          </p>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {article.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs py-0 h-5">
                  {tag}
                </Badge>
              ))}
              {article.tags.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{article.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span>{article.siteName}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{article.readingTime} min</span>
            </div>
          </div>
        </div>

        {/* Actions overlay */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
          <div className="flex items-center gap-0.5">
            <button onClick={handleFavorite} className="p-1.5 rounded hover:bg-accent">
              <Star
                className={`h-3.5 w-3.5 ${
                  article.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'
                }`}
              />
            </button>
            <button onClick={handleArchive} className="p-1.5 rounded hover:bg-accent">
              {article.isArchived ? (
                <ArchiveRestore className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Archive className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="p-1.5 rounded hover:bg-accent"
            >
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDelete(true);
              }}
              className="p-1.5 rounded hover:bg-accent"
            >
              <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        title="Delete Article"
        description="This will permanently delete this article and all its highlights."
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </>
  );
}

function getRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
}
