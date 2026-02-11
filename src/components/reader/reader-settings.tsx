'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { FONT_FAMILIES, FONT_SIZES, LINE_HEIGHTS, CONTENT_WIDTHS, READER_THEMES, HIGHLIGHT_COLORS } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Settings, Type, AlignLeft, MoveHorizontal, Palette, Tag, X, Plus } from 'lucide-react';
import type { FontFamily, FontSize, LineHeight, ContentWidth, ReaderTheme, HighlightColor } from '@/lib/types';

export function ReaderSettings() {
  const readerTheme = useAppStore((s) => s.readerTheme);
  const setReaderTheme = useAppStore((s) => s.setReaderTheme);
  const fontFamily = useAppStore((s) => s.fontFamily);
  const setFontFamily = useAppStore((s) => s.setFontFamily);
  const fontSize = useAppStore((s) => s.fontSize);
  const setFontSize = useAppStore((s) => s.setFontSize);
  const lineHeight = useAppStore((s) => s.lineHeight);
  const setLineHeight = useAppStore((s) => s.setLineHeight);
  const contentWidth = useAppStore((s) => s.contentWidth);
  const setContentWidth = useAppStore((s) => s.setContentWidth);
  const tagColorMap = useAppStore((s) => s.tagColorMap);
  const setTagColor = useAppStore((s) => s.setTagColor);
  const removeTagColor = useAppStore((s) => s.removeTagColor);
  const [newTag, setNewTag] = useState('');
  const [newColor, setNewColor] = useState<HighlightColor>('yellow');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="Reader settings">
          <Settings className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-4 space-y-4">
        {/* Theme */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
            <Palette className="h-3 w-3" />
            Theme
          </div>
          <div className="flex gap-2">
            {(Object.entries(READER_THEMES) as [ReaderTheme, typeof READER_THEMES.light][]).map(
              ([key, theme]) => (
                <button
                  key={key}
                  onClick={() => setReaderTheme(key)}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-medium border transition-all ${
                    readerTheme === key
                      ? 'border-primary ring-1 ring-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                  style={{ backgroundColor: theme.bg, color: theme.text }}
                >
                  {theme.label}
                </button>
              )
            )}
          </div>
        </div>

        {/* Font Family */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
            <Type className="h-3 w-3" />
            Font
          </div>
          <div className="flex gap-2">
            {(Object.entries(FONT_FAMILIES) as [FontFamily, typeof FONT_FAMILIES.sans][]).map(
              ([key, font]) => (
                <button
                  key={key}
                  onClick={() => setFontFamily(key)}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-medium border transition-all ${
                    fontFamily === key
                      ? 'border-primary bg-accent'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {font.label}
                </button>
              )
            )}
          </div>
        </div>

        {/* Font Size */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
            <Type className="h-3 w-3" />
            Size
          </div>
          <div className="flex gap-1">
            {(Object.entries(FONT_SIZES) as [FontSize, typeof FONT_SIZES.medium][]).map(
              ([key, size]) => (
                <button
                  key={key}
                  onClick={() => setFontSize(key)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs border transition-all ${
                    fontSize === key
                      ? 'border-primary bg-accent font-medium'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {size.label}
                </button>
              )
            )}
          </div>
        </div>

        {/* Line Height */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
            <AlignLeft className="h-3 w-3" />
            Spacing
          </div>
          <div className="flex gap-1">
            {(Object.entries(LINE_HEIGHTS) as [LineHeight, typeof LINE_HEIGHTS.normal][]).map(
              ([key, lh]) => (
                <button
                  key={key}
                  onClick={() => setLineHeight(key)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs border transition-all ${
                    lineHeight === key
                      ? 'border-primary bg-accent font-medium'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {lh.label}
                </button>
              )
            )}
          </div>
        </div>

        {/* Content Width */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
            <MoveHorizontal className="h-3 w-3" />
            Width
          </div>
          <div className="flex gap-1">
            {(Object.entries(CONTENT_WIDTHS) as [ContentWidth, typeof CONTENT_WIDTHS.medium][]).map(
              ([key, w]) => (
                <button
                  key={key}
                  onClick={() => setContentWidth(key)}
                  className={`flex-1 rounded-md px-2 py-1.5 text-xs border transition-all ${
                    contentWidth === key
                      ? 'border-primary bg-accent font-medium'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {w.label}
                </button>
              )
            )}
          </div>
        </div>
        {/* Tag Colors */}
        <div>
          <div className="flex items-center gap-2 mb-2 text-xs font-medium text-muted-foreground">
            <Tag className="h-3 w-3" />
            Tag Colors
          </div>

          {/* Existing mappings */}
          {Object.entries(tagColorMap).length > 0 && (
            <div className="space-y-1 mb-2">
              {Object.entries(tagColorMap).map(([tag, color]) => (
                <div key={tag} className="flex items-center gap-2">
                  <div
                    className="h-3.5 w-3.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: HIGHLIGHT_COLORS[color].bg }}
                  />
                  <span className="text-xs flex-1 truncate">{tag}</span>
                  <button
                    onClick={() => removeTagColor(tag)}
                    className="p-0.5 rounded hover:bg-accent"
                  >
                    <X className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add new mapping */}
          <div className="flex items-center gap-1.5">
            <Input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Tag name"
              className="h-7 text-xs flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && newTag.trim()) {
                  setTagColor(newTag.trim().toLowerCase(), newColor);
                  setNewTag('');
                }
              }}
            />
            <div className="flex gap-0.5">
              {(Object.keys(HIGHLIGHT_COLORS) as HighlightColor[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setNewColor(c)}
                  className={`h-5 w-5 rounded-full ${newColor === c ? 'ring-2 ring-offset-1 ring-primary' : ''}`}
                  style={{ backgroundColor: HIGHLIGHT_COLORS[c].bg }}
                />
              ))}
            </div>
            <button
              onClick={() => {
                if (newTag.trim()) {
                  setTagColor(newTag.trim().toLowerCase(), newColor);
                  setNewTag('');
                }
              }}
              className="p-1 rounded hover:bg-accent"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
