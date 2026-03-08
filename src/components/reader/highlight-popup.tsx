'use client';

import { useEffect, useRef, useState } from 'react';
import { HIGHLIGHT_COLORS } from '@/lib/constants';
import { MessageSquare, Trash2 } from 'lucide-react';
import type { HighlightColor } from '@/lib/types';

interface HighlightPopupProps {
  x: number;
  y: number;
  mobile?: boolean;
  onSelectColor: (color: HighlightColor, note?: string) => void;
  onDismiss: () => void;
  activeColor: HighlightColor;
}

export function HighlightPopup({ x, y, mobile, onSelectColor, onDismiss, activeColor }: HighlightPopupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [showNote, setShowNote] = useState(false);
  const [noteText, setNoteText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (showNote) textareaRef.current?.focus();
  }, [showNote]);

  useEffect(() => {
    let mounted = true;
    const handleDismiss = (e: Event) => {
      if (mounted && ref.current && !ref.current.contains(e.target as Node)) {
        onDismiss();
      }
    };
    // Delay to avoid immediate dismiss from the selection touch/click that opened the popup
    const timer = setTimeout(() => {
      if (mounted) {
        document.addEventListener('mousedown', handleDismiss);
        document.addEventListener('touchstart', handleDismiss, { passive: true });
      }
    }, 100);
    return () => {
      mounted = false;
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleDismiss);
      document.removeEventListener('touchstart', handleDismiss);
    };
  }, [onDismiss]);

  // Always fixed: viewport coords map 1-to-1 with the fixed inset-0 ReaderView wrapper.
  const positionStyle = mobile
    ? { left: '50%', transform: 'translateX(-50%)', bottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }
    : { left: `${x}px`, top: `${y}px`, transform: 'translate(-50%, -100%)' };

  return (
    <div
      ref={ref}
      className="fixed z-50 bg-popover border border-border rounded-lg shadow-xl animate-in fade-in zoom-in-95"
      style={positionStyle}
    >
      {/* Color swatches + note toggle */}
      <div className="flex items-center gap-1.5 px-2.5 py-2">
        {(Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]).map((color) => (
          <button
            key={color}
            onClick={(e) => {
              e.stopPropagation();
              onSelectColor(color, noteText.trim() || undefined);
            }}
            className={`flex items-center justify-center p-2 rounded-full transition-transform hover:scale-110 active:scale-95 ${
              activeColor === color ? 'ring-2 ring-offset-1 ring-primary' : ''
            }`}
            title={`Highlight ${HIGHLIGHT_COLORS[color].label}`}
          >
            <span className="block h-6 w-6 rounded-full" style={{ backgroundColor: HIGHLIGHT_COLORS[color].bg }} />
          </button>
        ))}
        <div className="w-px h-5 bg-border mx-0.5 flex-shrink-0" />
        <button
          onClick={(e) => { e.stopPropagation(); setShowNote((v) => !v); }}
          className={`flex items-center justify-center p-2 rounded-full transition-colors ${
            showNote ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          }`}
          title="Add a note"
        >
          <MessageSquare className="h-4 w-4" />
        </button>
      </div>

      {/* Inline note textarea — expands when note toggle is active */}
      {showNote && (
        <div className="px-2.5 pb-2.5 min-w-[220px]">
          <textarea
            ref={textareaRef}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') { setShowNote(false); setNoteText(''); }
            }}
            placeholder="Type a note, then pick a color to save..."
            className="w-full min-h-[70px] text-xs bg-muted/50 rounded-md px-2.5 py-1.5 resize-none outline-none focus:ring-1 focus:ring-ring border border-input"
          />
        </div>
      )}
    </div>
  );
}

// ——— Context popup shown when tapping an existing highlight ———

interface HighlightContextPopupProps {
  currentColor: HighlightColor;
  hasNote: boolean;
  x: number;
  y: number;
  onRecolor: (color: HighlightColor) => void;
  onNote: () => void;
  onDelete: () => void;
  onDismiss: () => void;
}

export function HighlightContextPopup({
  currentColor,
  hasNote,
  x,
  y,
  onRecolor,
  onNote,
  onDelete,
  onDismiss,
}: HighlightContextPopupProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let mounted = true;
    const handleDismiss = (e: Event) => {
      if (mounted && ref.current && !ref.current.contains(e.target as Node)) {
        onDismiss();
      }
    };
    const timer = setTimeout(() => {
      if (mounted) {
        document.addEventListener('mousedown', handleDismiss);
        document.addEventListener('touchstart', handleDismiss, { passive: true });
      }
    }, 100);
    return () => {
      mounted = false;
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleDismiss);
      document.removeEventListener('touchstart', handleDismiss);
    };
  }, [onDismiss]);

  return (
    <div
      ref={ref}
      className="fixed z-50 flex items-center gap-1.5 px-2.5 py-2 bg-popover border border-border rounded-lg shadow-xl animate-in fade-in zoom-in-95"
      style={{ left: `${x}px`, top: `${y}px`, transform: 'translate(-50%, -100%)' }}
    >
      {(Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]).map((color) => (
        <button
          key={color}
          onClick={(e) => { e.stopPropagation(); onRecolor(color); }}
          className={`flex items-center justify-center p-2 rounded-full transition-transform hover:scale-110 active:scale-95 ${
            currentColor === color ? 'ring-2 ring-offset-1 ring-primary' : ''
          }`}
          title={`Change to ${HIGHLIGHT_COLORS[color].label}`}
        >
          <span className="block h-6 w-6 rounded-full" style={{ backgroundColor: HIGHLIGHT_COLORS[color].bg }} />
        </button>
      ))}
      <div className="w-px h-5 bg-border mx-0.5 flex-shrink-0" />
      <button
        onClick={(e) => { e.stopPropagation(); onNote(); }}
        className={`flex items-center justify-center p-2 rounded-full transition-colors hover:bg-accent ${
          hasNote ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        }`}
        title={hasNote ? 'Edit note' : 'Add note'}
      >
        <MessageSquare className="h-4 w-4" />
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="flex items-center justify-center p-2 rounded-full transition-colors hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
        title="Remove highlight"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
