'use client';

import { useState } from 'react';
import { useHighlights, deleteHighlight } from '@/lib/hooks/use-highlights';
import { NoteModal } from './note-modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { HIGHLIGHT_COLORS } from '@/lib/constants';
import { AddToCollection } from './add-to-collection';
import { ShareCard } from '@/components/shared/share-card';
import { Trash2, MessageSquare, Copy, X, Highlighter, Share2, Download, Search } from 'lucide-react';
import { exportHighlightsAsMarkdown, downloadFile } from '@/lib/export';
import { useToast } from '@/components/shared/toast';
import { useArticle } from '@/lib/hooks/use-articles';
import type { Highlight } from '@/lib/types';

interface HighlightsPanelProps {
  articleId: string;
  onClose: () => void;
}

export function HighlightsPanel({ articleId, onClose }: HighlightsPanelProps) {
  const highlights = useHighlights(articleId);
  const article = useArticle(articleId);
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);
  const [sharingHighlight, setSharingHighlight] = useState<Highlight | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { toast } = useToast();

  const handleCopyAll = () => {
    if (!highlights || highlights.length === 0) return;

    const text = highlights
      .map((h) => {
        let entry = `> ${h.text}`;
        if (h.note) entry += `\n\nNote: ${h.note}`;
        return entry;
      })
      .join('\n\n---\n\n');

    navigator.clipboard.writeText(text);
    toast('Highlights copied to clipboard');
  };

  const handleDelete = async (id: string) => {
    await deleteHighlight(id);
    toast('Highlight removed');
  };

  const handleExportMarkdown = async () => {
    const md = await exportHighlightsAsMarkdown(articleId);
    const slug = article?.title
      ? article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50)
      : articleId;
    downloadFile(md, `${slug}-highlights.md`, 'text/markdown');
    toast('Highlights exported');
  };

  const filteredHighlights = highlights?.filter((h) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return h.text.toLowerCase().includes(q) || h.note.toLowerCase().includes(q);
  });

  return (
    <div className="w-80 border-l border-border/50 bg-inherit flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Highlighter className="h-4 w-4" />
          <span className="text-sm font-medium">
            Highlights ({highlights?.length || 0})
          </span>
        </div>
        <div className="flex items-center gap-1">
          {highlights && highlights.length > 0 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleExportMarkdown}
                title="Export as Markdown"
              >
                <Download className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={handleCopyAll}
                title="Copy all highlights"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Search */}
      {highlights && highlights.length > 0 && (
        <div className="px-3 py-2 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search highlights…"
              className="w-full text-xs bg-muted/50 border border-input rounded-md pl-8 pr-2.5 py-1.5 outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>
      )}

      {/* Highlights list */}
      <ScrollArea className="flex-1">
        {!filteredHighlights || filteredHighlights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Highlighter className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              {searchQuery ? 'No highlights match your search' : 'Select text in the article to create highlights'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredHighlights!.map((highlight) => (
              <div
                key={highlight.id}
                className="group rounded-md border border-border/50 p-3 hover:bg-accent/30 transition-colors"
              >
                {/* Color indicator + text */}
                <div className="flex gap-2">
                  <div
                    className="w-1 rounded-full flex-shrink-0"
                    style={{ backgroundColor: HIGHLIGHT_COLORS[highlight.color].bg }}
                  />
                  <p className="text-sm line-clamp-3 flex-1">{highlight.text}</p>
                </div>

                {/* Note */}
                {highlight.note && (
                  <p className="text-xs text-muted-foreground mt-2 pl-3 italic">
                    {highlight.note}
                  </p>
                )}

                {/* Actions */}
                {/* Always visible on mobile (no hover), fade in on desktop hover */}
                <div className="flex items-center gap-1 mt-2 pl-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setEditingHighlight(highlight)}
                    title="Add note"
                  >
                    <MessageSquare className="h-3 w-3" />
                  </Button>
                  <AddToCollection
                    highlightId={highlight.id}
                    currentCollectionId={highlight.collectionId ?? null}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setSharingHighlight(highlight)}
                    title="Share highlight"
                  >
                    <Share2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      navigator.clipboard.writeText(highlight.text);
                      toast('Copied');
                    }}
                    title="Copy highlight"
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => handleDelete(highlight.id)}
                    title="Delete highlight"
                  >
                    <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      {/* Note Modal */}
      {editingHighlight && (
        <NoteModal
          highlight={editingHighlight}
          onClose={() => setEditingHighlight(null)}
        />
      )}

      {/* Share Card */}
      {sharingHighlight && (
        <ShareCard
          open={!!sharingHighlight}
          onOpenChange={() => setSharingHighlight(null)}
          text={sharingHighlight.text}
          note={sharingHighlight.note}
          color={sharingHighlight.color}
          articleTitle={article?.title || ''}
          siteName={article?.siteName || ''}
        />
      )}
    </div>
  );
}
