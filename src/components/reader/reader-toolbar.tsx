'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useHighlightCount } from '@/lib/hooks/use-highlights';
import { useArticle } from '@/lib/hooks/use-articles';
import { ReaderSettings } from './reader-settings';
import { ArticleEditor } from './article-editor';
import { Button } from '@/components/ui/button';
import { HIGHLIGHT_COLORS } from '@/lib/constants';
import {
  ArrowLeft,
  Highlighter,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Tags,
} from 'lucide-react';
import type { HighlightColor } from '@/lib/types';

interface ReaderToolbarProps {
  title: string;
  url: string;
  articleId: string;
  onClose: () => void;
  onPrevArticle?: () => void;
  onNextArticle?: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export function ReaderToolbar({
  title,
  url,
  articleId,
  onClose,
  onPrevArticle,
  onNextArticle,
  hasPrev,
  hasNext,
}: ReaderToolbarProps) {
  const isHighlightsPanelOpen = useAppStore((s) => s.isHighlightsPanelOpen);
  const toggleHighlightsPanel = useAppStore((s) => s.toggleHighlightsPanel);
  const selectedColor = useAppStore((s) => s.selectedHighlightColor);
  const setSelectedColor = useAppStore((s) => s.setSelectedHighlightColor);
  const highlightCount = useHighlightCount(articleId);
  const article = useArticle(articleId);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 border-b border-border/50 bg-inherit">
        {/* Back */}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Navigation — hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onPrevArticle}
            disabled={!hasPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onNextArticle}
            disabled={!hasNext}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Title */}
        <span className="flex-1 truncate text-sm font-medium mx-1 sm:mx-2">{title}</span>

        {/* Highlight color selector — hidden on very small screens */}
        <div className="hidden md:flex items-center gap-1 border border-border/50 rounded-md px-2 py-1">
          {(Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]).map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`h-5 w-5 rounded-full transition-transform ${
                selectedColor === color
                  ? 'scale-110 ring-2 ring-offset-1 ring-primary'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: HIGHLIGHT_COLORS[color].bg }}
              title={HIGHLIGHT_COLORS[color].label}
            />
          ))}
        </div>

        {/* Edit tags/folder button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setIsEditorOpen(true)}
          title="Edit tags & folder"
        >
          <Tags className="h-4 w-4" />
        </Button>

        {/* Highlights panel toggle */}
        <Button
          variant={isHighlightsPanelOpen ? 'secondary' : 'ghost'}
          size="sm"
          className="h-8 gap-1.5"
          onClick={toggleHighlightsPanel}
        >
          <Highlighter className="h-3.5 w-3.5" />
          {(highlightCount ?? 0) > 0 && (
            <span className="text-xs bg-primary text-primary-foreground rounded-full px-1.5 min-w-[20px] text-center">
              {highlightCount}
            </span>
          )}
        </Button>

        {/* External link — hidden on mobile */}
        <a href={url} target="_blank" rel="noopener noreferrer" className="hidden sm:block">
          <Button variant="ghost" size="icon" className="h-8 w-8" title="Open original">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>

        {/* Settings */}
        <ReaderSettings />
      </div>

      {/* Article editor dialog */}
      {article && (
        <ArticleEditor
          article={article}
          open={isEditorOpen}
          onOpenChange={setIsEditorOpen}
        />
      )}
    </>
  );
}
