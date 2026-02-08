'use client';

import { useState } from 'react';
import { updateHighlight } from '@/lib/hooks/use-highlights';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HIGHLIGHT_COLORS } from '@/lib/constants';
import type { Highlight } from '@/lib/types';

interface NoteModalProps {
  highlight: Highlight;
  onClose: () => void;
}

export function NoteModal({ highlight, onClose }: NoteModalProps) {
  const [note, setNote] = useState(highlight.note);

  const handleSave = async () => {
    await updateHighlight(highlight.id, { note });
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="text-base">Add Note</DialogTitle>
        </DialogHeader>

        {/* Highlight preview */}
        <div className="flex gap-2 p-3 rounded-md bg-muted/50">
          <div
            className="w-1 rounded-full flex-shrink-0"
            style={{ backgroundColor: HIGHLIGHT_COLORS[highlight.color].bg }}
          />
          <p className="text-sm italic line-clamp-3">{highlight.text}</p>
        </div>

        {/* Note input */}
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Write your thoughts about this highlight..."
          className="w-full min-h-[120px] p-3 text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring"
          autoFocus
        />

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
