import type { HighlightColor, FontFamily, FontSize, LineHeight, ContentWidth, ReaderTheme } from './types';

export const HIGHLIGHT_COLORS: Record<HighlightColor, { bg: string; label: string }> = {
  yellow: { bg: '#fef08a', label: 'Yellow' },
  green: { bg: '#bbf7d0', label: 'Green' },
  blue: { bg: '#bfdbfe', label: 'Blue' },
  pink: { bg: '#fbcfe8', label: 'Pink' },
  orange: { bg: '#fed7aa', label: 'Orange' },
};

export const FONT_FAMILIES: Record<FontFamily, { label: string; className: string }> = {
  sans: { label: 'Sans-serif', className: 'font-sans' },
  serif: { label: 'Serif', className: 'font-serif' },
};

export const FONT_SIZES: Record<FontSize, { label: string; size: string }> = {
  small: { label: 'Small', size: '0.9rem' },
  medium: { label: 'Medium', size: '1.05rem' },
  large: { label: 'Large', size: '1.2rem' },
  xlarge: { label: 'Extra Large', size: '1.4rem' },
};

export const LINE_HEIGHTS: Record<LineHeight, { label: string; value: string }> = {
  compact: { label: 'Compact', value: '1.5' },
  normal: { label: 'Normal', value: '1.75' },
  relaxed: { label: 'Relaxed', value: '2' },
};

export const CONTENT_WIDTHS: Record<ContentWidth, { label: string; maxWidth: string }> = {
  narrow: { label: 'Narrow', maxWidth: '580px' },
  medium: { label: 'Medium', maxWidth: '700px' },
  wide: { label: 'Wide', maxWidth: '860px' },
};

export const READER_THEMES: Record<ReaderTheme, { label: string; bg: string; text: string }> = {
  light: { label: 'Light', bg: '#ffffff', text: '#1a1a1a' },
  dark: { label: 'Dark', bg: '#1a1a2e', text: '#e0e0e0' },
  sepia: { label: 'Sepia', bg: '#f4ecd8', text: '#5b4636' },
};

export const FOLDER_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e',
  '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899',
];

export const WORDS_PER_MINUTE = 238;
