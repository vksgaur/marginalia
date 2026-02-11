'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useHighlights, addHighlight, deleteHighlight } from '@/lib/hooks/use-highlights';
import { useAnnotations, addAnnotation } from '@/lib/hooks/use-annotations';
import { useAuth } from '@/components/shared/auth-provider';
import { updateArticle } from '@/lib/hooks/use-articles';
import { HighlightPopup } from './highlight-popup';
import { AnnotationMarker, AddAnnotationButton } from './annotation-marker';
import { Recommendations } from './recommendations';
import { FONT_SIZES, LINE_HEIGHTS, CONTENT_WIDTHS, READER_THEMES } from '@/lib/constants';
import DOMPurify from 'dompurify';
import type { Highlight, HighlightColor } from '@/lib/types';

interface ReaderContentProps {
  articleId: string;
  content: string;
  articleTags: string[];
  onScrollProgress: (progress: number) => void;
}

export function ReaderContent({ articleId, content, articleTags, onScrollProgress }: ReaderContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionData, setSelectionData] = useState<{
    paragraphIndex: number;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  const [paragraphTops, setParagraphTops] = useState<number[]>([]);
  const [editingNewAnnotation, setEditingNewAnnotation] = useState<number | null>(null);
  const [newAnnotationText, setNewAnnotationText] = useState('');
  const newAnnotationRef = useRef<HTMLTextAreaElement>(null);

  const readerTheme = useAppStore((s) => s.readerTheme);
  const fontFamily = useAppStore((s) => s.fontFamily);
  const fontSize = useAppStore((s) => s.fontSize);
  const lineHeight = useAppStore((s) => s.lineHeight);
  const contentWidth = useAppStore((s) => s.contentWidth);
  const selectedColor = useAppStore((s) => s.selectedHighlightColor);
  const setSelectedColor = useAppStore((s) => s.setSelectedHighlightColor);
  const tagColorMap = useAppStore((s) => s.tagColorMap);

  const { user } = useAuth();
  const highlights = useHighlights(articleId);
  const annotations = useAnnotations(articleId);

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

      // Measure paragraph positions for annotation gutter
      const paragraphs = contentRef.current.querySelectorAll(
        'p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption'
      );
      const contentTop = contentRef.current.offsetTop;
      const tops = Array.from(paragraphs).map((p) => (p as HTMLElement).offsetTop - contentTop);
      setParagraphTops(tops);
    }
  }, [sanitizedContent, applyHighlights]);

  // Focus new annotation textarea
  useEffect(() => {
    if (editingNewAnnotation !== null && newAnnotationRef.current) {
      newAnnotationRef.current.focus();
    }
  }, [editingNewAnnotation]);

  const handleAddAnnotation = async (paragraphIndex: number) => {
    if (!newAnnotationText.trim()) {
      setEditingNewAnnotation(null);
      return;
    }
    await addAnnotation({
      articleId,
      paragraphIndex,
      text: newAnnotationText.trim(),
      userId: user?.uid || null,
    });
    setNewAnnotationText('');
    setEditingNewAnnotation(null);
  };

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

    // Auto-select highlight color based on article tags
    for (const tag of articleTags) {
      if (tagColorMap[tag]) {
        setSelectedColor(tagColorMap[tag]);
        break;
      }
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
  }, [articleTags, tagColorMap, setSelectedColor]);

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

  // Build annotation map by paragraphIndex
  const annotationMap = new Map<number, typeof annotations extends (infer T)[] | undefined ? T : never>();
  if (annotations) {
    for (const a of annotations) {
      annotationMap.set(a.paragraphIndex, a);
    }
  }

  return (
    <div
      ref={scrollContainerRef}
      className="flex-1 overflow-y-auto custom-scrollbar"
      style={{ backgroundColor: themeStyles.bg, color: themeStyles.text }}
    >
      <div
        className="mx-auto px-6 py-8 flex"
        style={{ maxWidth: `calc(${CONTENT_WIDTHS[contentWidth].maxWidth} + 3rem)` }}
      >
        {/* Annotation gutter */}
        <div ref={gutterRef} className="w-10 flex-shrink-0 relative hidden md:block">
          {paragraphTops.map((top, i) => {
            const existing = annotationMap.get(i);
            if (existing) {
              return <AnnotationMarker key={existing.id} annotation={existing} top={top} />;
            }
            if (editingNewAnnotation === i) {
              return (
                <div
                  key={`new-${i}`}
                  className="absolute right-0 z-30 w-56 animate-in fade-in slide-in-from-left-2"
                  style={{ top: `${top}px` }}
                >
                  <div className="rounded-lg border border-primary/30 bg-card shadow-lg p-2">
                    <textarea
                      ref={newAnnotationRef}
                      value={newAnnotationText}
                      onChange={(e) => setNewAnnotationText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAddAnnotation(i);
                        if (e.key === 'Escape') { setEditingNewAnnotation(null); setNewAnnotationText(''); }
                      }}
                      className="w-full text-xs bg-transparent border-none outline-none resize-none min-h-[60px]"
                      style={{ color: themeStyles.text }}
                      placeholder="Write your note..."
                    />
                    <div className="flex justify-end gap-1 mt-1">
                      <button
                        onClick={() => { setEditingNewAnnotation(null); setNewAnnotationText(''); }}
                        className="text-xs px-2 py-0.5 rounded hover:bg-accent text-muted-foreground"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAddAnnotation(i)}
                        className="text-xs px-2 py-0.5 rounded bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              );
            }
            return (
              <AddAnnotationButton
                key={`add-${i}`}
                top={top}
                onClick={() => setEditingNewAnnotation(i)}
              />
            );
          })}
        </div>

        {/* Article content */}
        <div className="flex-1 min-w-0">
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

          {/* Recommendations */}
          <Recommendations articleId={articleId} />
        </div>
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
