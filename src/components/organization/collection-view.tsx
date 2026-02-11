'use client';

import { useCollectionHighlights, removeHighlightFromCollection } from '@/lib/hooks/use-highlights';
import { useArticle } from '@/lib/hooks/use-articles';
import { HIGHLIGHT_COLORS } from '@/lib/constants';
import { useAppStore } from '@/lib/store';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { X, Layers } from 'lucide-react';
import { useToast } from '@/components/shared/toast';

interface CollectionViewProps {
  collectionId: string;
  collectionName: string;
  onClose: () => void;
}

export function CollectionView({ collectionId, collectionName, onClose }: CollectionViewProps) {
  const highlights = useCollectionHighlights(collectionId);
  const { toast } = useToast();

  const handleRemove = async (highlightId: string) => {
    await removeHighlightFromCollection(highlightId);
    toast('Removed from collection');
  };

  return (
    <div className="mx-6 mt-4 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" />
          <h3 className="text-sm font-medium">{collectionName}</h3>
          <span className="text-xs text-muted-foreground">({highlights?.length || 0})</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="max-h-80">
        {!highlights || highlights.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            No highlights in this collection yet.
          </p>
        ) : (
          <div className="p-3 space-y-2">
            {highlights.map((h) => (
              <CollectionHighlightCard
                key={h.id}
                highlight={h}
                onRemove={() => handleRemove(h.id)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

function CollectionHighlightCard({
  highlight,
  onRemove,
}: {
  highlight: { id: string; articleId: string; text: string; color: string; note: string };
  onRemove: () => void;
}) {
  const article = useArticle(highlight.articleId);
  const setActiveArticleId = useAppStore((s) => s.setActiveArticleId);
  const color = highlight.color as keyof typeof HIGHLIGHT_COLORS;

  return (
    <div className="group flex gap-2 rounded-md border border-border/50 p-3 hover:bg-accent/30 transition-colors">
      <div
        className="w-1 rounded-full flex-shrink-0"
        style={{ backgroundColor: HIGHLIGHT_COLORS[color]?.bg || '#fef08a' }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm line-clamp-2">{highlight.text}</p>
        {highlight.note && (
          <p className="text-xs text-muted-foreground mt-1 italic">{highlight.note}</p>
        )}
        <button
          onClick={() => setActiveArticleId(highlight.articleId)}
          className="text-xs text-primary hover:underline mt-1"
        >
          {article?.title || 'Open article'}
        </button>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100"
        onClick={onRemove}
        title="Remove from collection"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
