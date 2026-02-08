'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useHighlights, addHighlight, deleteHighlight } from '@/lib/hooks/use-highlights';
import { updateArticle } from '@/lib/hooks/use-articles';
import { HighlightPopup } from './highlight-popup';
import { FONT_SIZES, LINE_HEIGHTS, CONTENT_WIDTHS, READER_THEMES } from '@/lib/constants';
import DOMPurify from 'dompurify';
import type { Highlight, HighlightColor } from '@/lib/types';

interface ReaderContentProps {
  articleId: string;
  content: string;
  onScrollProgress: (progress: number) => void;
}

export function ReaderContent({ articleId, content, onScrollProgress }: ReaderContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionData, setSelectionData] = useState<{
    paragraphIndex: number;
    startOffset: number;
    endOffset: number;
  } | null>(null);

  const readerTheme = useAppStore((s) => s.readerTheme);
  const fontFamily = useAppStore((s) => s.fontFamily);
  const fontSize = useAppStore((s) => s.fontSize);
  const lineHeight = useAppStore((s) => s.lineHeight);
  const contentWidth = useAppStore((s) => s.contentWidth);
  const selectedColor = useAppStore((s) => s.selectedHighlightColor);

  const highlights = useHighlights(articleId);

  // Sanitize content
  const sanitizedContent = DOMPurify.sanitize(content, {
    ADD_TAGS: ['iframe'],
    ADD_ATTR: ['allow', 'allowfullscreen', 'frameborder', 'scrolling'],
  });

  // Apply highlights to content
  const applyHighlights = useCallback(() => {
    if (!contentRef.current || !highlights) return;

    // Remove existing marks
    contentRef.current.querySelectorAll('mark[data-highlight-id]').forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
        parent.removeChild(mark);
        parent.normalize();
      }
    });

    // Get all text-containing elements (paragraphs)
    const paragraphs = contentRef.current.querySelectorAll(
      'p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption'
    );

    for (const highlight of highlights) {
      const para = paragraphs[highlight.paragraphIndex];
      if (!para) continue;

      try {
        applyHighlightToElement(para, highlight);
      } catch {
        // Highlight position might be stale, skip gracefully
      }
    }
  }, [highlights]);

  // Re-apply highlights when content or highlights change
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.innerHTML = sanitizedContent;
      applyHighlights();
    }
  }, [sanitizedContent, applyHighlights]);

  // Handle scroll progress
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const progress = scrollHeight <= clientHeight
        ? 100
        : Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
      onScrollProgress(progress);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onScrollProgress]);

  // Handle text selection for highlighting
  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !contentRef.current) {
      setPopupPosition(null);
      return;
    }

    const text = selection.toString().trim();
    if (!text) {
      setPopupPosition(null);
      return;
    }

    // Check if selection is within our content
    const range = selection.getRangeAt(0);
    if (!contentRef.current.contains(range.commonAncestorContainer)) {
      setPopupPosition(null);
      return;
    }

    // Find the paragraph index
    const paragraphs = contentRef.current.querySelectorAll(
      'p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption'
    );

    let paragraphIndex = -1;
    let startNode = range.startContainer;

    // Walk up to find containing paragraph
    while (startNode && startNode !== contentRef.current) {
      for (let i = 0; i < paragraphs.length; i++) {
        if (paragraphs[i].contains(startNode)) {
          paragraphIndex = i;
          break;
        }
      }
      if (paragraphIndex !== -1) break;
      startNode = startNode.parentNode!;
    }

    if (paragraphIndex === -1) {
      setPopupPosition(null);
      return;
    }

    // Calculate offsets relative to the paragraph's text content
    const para = paragraphs[paragraphIndex];
    const textWalker = document.createTreeWalker(para, NodeFilter.SHOW_TEXT);
    let charCount = 0;
    let startOffset = 0;
    let endOffset = 0;
    let foundStart = false;
    let foundEnd = false;

    while (textWalker.nextNode()) {
      const node = textWalker.currentNode;
      if (node === range.startContainer) {
        startOffset = charCount + range.startOffset;
        foundStart = true;
      }
      if (node === range.endContainer) {
        endOffset = charCount + range.endOffset;
        foundEnd = true;
        break;
      }
      charCount += node.textContent?.length || 0;
    }

    if (!foundStart || !foundEnd) {
      setPopupPosition(null);
      return;
    }

    // Position popup near selection
    const rect = range.getBoundingClientRect();
    const containerRect = scrollContainerRef.current?.getBoundingClientRect();
    if (containerRect) {
      setPopupPosition({
        x: rect.left + rect.width / 2 - containerRect.left,
        y: rect.top - containerRect.top - 10,
      });
    }

    setSelectedText(text);
    setSelectionData({ paragraphIndex, startOffset, endOffset });
  }, []);

  // Create highlight
  const handleCreateHighlight = useCallback(
    async (color: HighlightColor) => {
      if (!selectedText || !selectionData) return;

      await addHighlight({
        articleId,
        text: selectedText,
        color,
        paragraphIndex: selectionData.paragraphIndex,
        startOffset: selectionData.startOffset,
        endOffset: selectionData.endOffset,
      });

      window.getSelection()?.removeAllRanges();
      setPopupPosition(null);
      setSelectedText('');
      setSelectionData(null);
    },
    [articleId, selectedText, selectionData]
  );

  // Handle clicking on existing highlights
  const handleContentClick = useCallback(
    (e: React.MouseEvent) => {
      const target = e.target as HTMLElement;
      const mark = target.closest('mark[data-highlight-id]');
      if (mark) {
        const highlightId = mark.getAttribute('data-highlight-id');
        if (highlightId && highlights) {
          // For now, clicking a highlight could open notes - we'll dispatch an event
          const event = new CustomEvent('highlight-click', {
            detail: { highlightId },
          });
          window.dispatchEvent(event);
        }
      }
    },
    [highlights]
  );

  const themeStyles = READER_THEMES[readerTheme];

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto custom-scrollbar"
      style={{ backgroundColor: themeStyles.bg, color: themeStyles.text }}
    >
      <div
        className="mx-auto px-6 py-8"
        style={{ maxWidth: CONTENT_WIDTHS[contentWidth].maxWidth }}
      >
        <div
          ref={contentRef}
          className={`reader-content ${fontFamily === 'serif' ? 'font-serif' : 'font-sans'}`}
          style={{
            fontSize: FONT_SIZES[fontSize].size,
            lineHeight: LINE_HEIGHTS[lineHeight].value,
          }}
          onMouseUp={handleMouseUp}
          onClick={handleContentClick}
        />
      </div>

      {/* Highlight popup */}
      {popupPosition && (
        <HighlightPopup
          x={popupPosition.x}
          y={popupPosition.y}
          onSelectColor={handleCreateHighlight}
          onDismiss={() => setPopupPosition(null)}
          activeColor={selectedColor}
        />
      )}
    </div>
  );
}

function applyHighlightToElement(element: Element, highlight: Highlight) {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let charCount = 0;
  const nodes: { node: Text; start: number; end: number }[] = [];

  while (walker.nextNode()) {
    const node = walker.currentNode as Text;
    const len = node.textContent?.length || 0;
    const nodeStart = charCount;
    const nodeEnd = charCount + len;

    if (nodeEnd > highlight.startOffset && nodeStart < highlight.endOffset) {
      nodes.push({
        node,
        start: Math.max(0, highlight.startOffset - nodeStart),
        end: Math.min(len, highlight.endOffset - nodeStart),
      });
    }

    charCount += len;
  }

  // Apply marks in reverse order to preserve offsets
  for (let i = nodes.length - 1; i >= 0; i--) {
    const { node, start, end } = nodes[i];
    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, end);

    const mark = document.createElement('mark');
    mark.setAttribute('data-color', highlight.color);
    mark.setAttribute('data-highlight-id', highlight.id);
    range.surroundContents(mark);
  }
}
