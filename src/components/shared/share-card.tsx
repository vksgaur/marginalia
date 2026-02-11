'use client';

import { useRef } from 'react';
import { toPng } from 'html-to-image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HIGHLIGHT_COLORS } from '@/lib/constants';
import { Download, Copy } from 'lucide-react';
import { useToast } from '@/components/shared/toast';
import type { HighlightColor } from '@/lib/types';

interface ShareCardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  text: string;
  note: string;
  color: HighlightColor;
  articleTitle: string;
  siteName: string;
}

const CARD_BG: Record<HighlightColor, { bg: string; accent: string }> = {
  yellow: { bg: '#fffbeb', accent: '#eab308' },
  green: { bg: '#f0fdf4', accent: '#22c55e' },
  blue: { bg: '#eff6ff', accent: '#3b82f6' },
  pink: { bg: '#fdf2f8', accent: '#ec4899' },
  orange: { bg: '#fff7ed', accent: '#f97316' },
};

export function ShareCard({
  open,
  onOpenChange,
  text,
  note,
  color,
  articleTitle,
  siteName,
}: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { bg, accent } = CARD_BG[color];

  const generateImage = async () => {
    if (!cardRef.current) return null;
    return toPng(cardRef.current, {
      pixelRatio: 2,
      backgroundColor: bg,
    });
  };

  const handleCopy = async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;
    const blob = await (await fetch(dataUrl)).blob();
    await navigator.clipboard.write([
      new ClipboardItem({ 'image/png': blob }),
    ]);
    toast('Image copied to clipboard');
  };

  const handleDownload = async () => {
    const dataUrl = await generateImage();
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.download = `highlight-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    toast('Image downloaded');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Highlight</DialogTitle>
        </DialogHeader>

        {/* Card preview */}
        <div
          ref={cardRef}
          style={{ backgroundColor: bg }}
          className="rounded-lg p-6 space-y-4"
        >
          <div className="flex gap-3">
            <div
              className="w-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: accent }}
            />
            <div className="space-y-3 flex-1">
              <p
                className="text-base leading-relaxed"
                style={{ color: '#1a1a1a', fontStyle: 'italic' }}
              >
                &ldquo;{text}&rdquo;
              </p>

              {note && (
                <p className="text-sm" style={{ color: '#6b7280' }}>
                  {note}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t" style={{ borderColor: `${accent}33` }}>
            <div>
              <p className="text-sm font-medium" style={{ color: '#374151' }}>
                {articleTitle}
              </p>
              <p className="text-xs" style={{ color: '#9ca3af' }}>
                {siteName}
              </p>
            </div>
            <p className="text-xs font-medium" style={{ color: accent }}>
              Marginalia
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleCopy} className="flex-1">
            <Copy className="h-4 w-4 mr-2" />
            Copy Image
          </Button>
          <Button variant="outline" onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
