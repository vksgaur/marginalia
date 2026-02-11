'use client';

import { useAuth } from '@/components/shared/auth-provider';
import {
  useCollections,
  addHighlightToCollection,
  removeHighlightFromCollection,
} from '@/lib/hooks/use-highlights';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Layers, Check } from 'lucide-react';
import { useToast } from '@/components/shared/toast';

interface AddToCollectionProps {
  highlightId: string;
  currentCollectionId: string | null;
}

export function AddToCollection({ highlightId, currentCollectionId }: AddToCollectionProps) {
  const { user } = useAuth();
  const userId = user?.uid || null;
  const collections = useCollections(userId);
  const { toast } = useToast();

  const handleSelect = async (collectionId: string) => {
    if (currentCollectionId === collectionId) {
      await removeHighlightFromCollection(highlightId);
      toast('Removed from collection');
    } else {
      await addHighlightToCollection(highlightId, collectionId);
      toast('Added to collection');
    }
  };

  if (!collections || collections.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          title="Add to collection"
        >
          <Layers className={`h-3 w-3 ${currentCollectionId ? 'text-primary' : ''}`} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="start">
        {collections.map((c) => (
          <button
            key={c.id}
            onClick={() => handleSelect(c.id)}
            className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent text-left"
          >
            <span className="flex-1 truncate">{c.name}</span>
            {currentCollectionId === c.id && (
              <Check className="h-3.5 w-3.5 text-primary" />
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
