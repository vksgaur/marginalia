'use client';

import { useEffect, useRef } from 'react';
import { HIGHLIGHT_COLORS } from '@/lib/constants';
import type { HighlightColor } from '@/lib/types';

interface HighlightPopupProps {
  x: number;
  y: number;
  onSelectColor: (color: HighlightColor) => void;
  onDismiss: () => void;
  activeColor: HighlightColor;
}

export function HighlightPopup({ x, y, onSelectColor, onDismiss, activeColor }: HighlightPopupProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onDismiss();
      }
    };
    // Delay to avoid immediate dismiss
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 100);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [onDismiss]);

  return (
    <div
      ref={ref}
      className="absolute z-50 flex items-center gap-1.5 bg-popover border border-border rounded-lg shadow-xl px-2.5 py-2 animate-in fade-in zoom-in-95"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      {(Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]).map((color) => (
        <button
          key={color}
          onClick={(e) => {
            e.stopPropagation();
            onSelectColor(color);
          }}
          className={`h-7 w-7 rounded-full transition-transform hover:scale-110 ${
            activeColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''
          }`}
          style={{ backgroundColor: HIGHLIGHT_COLORS[color].bg }}
          title={`Highlight ${HIGHLIGHT_COLORS[color].label}`}
        />
      ))}
    </div>
  );
}
