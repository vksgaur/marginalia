'use client';

import { useState } from 'react';
import { useHighlights, deleteHighlight } from '@/lib/hooks/use-highlights';
import { NoteModal } from './note-modal';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { HIGHLIGHT_COLORS } from '@/lib/constants';
import { Trash2, MessageSquare, Copy, X, Highlighter } from 'lucide-react';
import { useToast } from '@/components/shared/toast';
import type { Highlight } from '@/lib/types';

interface HighlightsPanelProps {
  articleId: string;
  onClose: () => void;
}

export function HighlightsPanel({ articleId, onClose }: HighlightsPanelProps) {
  const highlights = useHighlights(articleId);
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);
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
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleCopyAll}
              title="Copy all highlights"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Highlights list */}
      <ScrollArea className="flex-1">
        {!highlights || highlights.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            <Highlighter className="h-8 w-8 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">
              Select text in the article to create highlights
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {highlights.map((highlight) => (
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
                <div className="flex items-center gap-1 mt-2 pl-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setEditingHighlight(highlight)}
                    title="Add note"
                  >
                    <MessageSquare className="h-3 w-3" />
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
    </div>
  );
}
