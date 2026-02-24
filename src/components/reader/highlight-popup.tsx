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
        // touchstart for faster dismiss on iOS (no 300ms click delay)
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
          // p-2 gives a 44px touch target (28px circle + 8px padding each side) without changing visuals
          className={`flex items-center justify-center p-2 rounded-full transition-transform hover:scale-110 active:scale-95 ${
            activeColor === color ? 'ring-2 ring-offset-1 ring-primary' : ''
          }`}
          title={`Highlight ${HIGHLIGHT_COLORS[color].label}`}
        >
          <span
            className="block h-6 w-6 rounded-full"
            style={{ backgroundColor: HIGHLIGHT_COLORS[color].bg }}
          />
        </button>
      ))}
    </div>
  );
}
