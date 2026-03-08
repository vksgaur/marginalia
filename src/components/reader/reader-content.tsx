'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore } from '@/lib/store';
import { useHighlights, addHighlight, updateHighlight, deleteHighlight } from '@/lib/hooks/use-highlights';
import { useAnnotations, addAnnotation } from '@/lib/hooks/use-annotations';
import { useAuth } from '@/components/shared/auth-provider';
import { HighlightPopup, HighlightContextPopup } from './highlight-popup';
import { NoteModal } from './note-modal';
import { AnnotationMarker, AddAnnotationButton } from './annotation-marker';
import { Recommendations } from './recommendations';
import { FONT_SIZES, LINE_HEIGHTS, CONTENT_WIDTHS, READER_THEMES, HIGHLIGHT_COLORS } from '@/lib/constants';
import DOMPurify from 'dompurify';
import type { Highlight, HighlightColor } from '@/lib/types';

interface ReaderContentProps {
  articleId: string;
  content: string;
  articleTags: string[];
  onScrollProgress: (progress: number) => void;
  onScrollDirection?: (dir: 'up' | 'down') => void;
  initialProgress?: number;
}

// Ordered color keys for keyboard shortcuts 1-5
const HIGHLIGHT_COLOR_KEYS = Object.keys(HIGHLIGHT_COLORS) as HighlightColor[];

export function ReaderContent({ articleId, content, articleTags, onScrollProgress, onScrollDirection, initialProgress }: ReaderContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number; mobile: boolean } | null>(null);
  const [selectedText, setSelectedText] = useState('');
  const [selectionData, setSelectionData] = useState<{
    paragraphIndex: number;
    startOffset: number;
    endOffset: number;
  } | null>(null);
  const [paragraphTops, setParagraphTops] = useState<number[]>([]);
  const [activeHighlightContext, setActiveHighlightContext] = useState<{ id: string; x: number; y: number } | null>(null);
  const [noteHighlight, setNoteHighlight] = useState<Highlight | null>(null);
  const [editingNewAnnotation, setEditingNewAnnotation] = useState<number | null>(null);
  const [newAnnotationText, setNewAnnotationText] = useState('');
  const newAnnotationRef = useRef<HTMLTextAreaElement>(null);
  const hasScrolled = useRef(false);
  const lastScrollTopRef = useRef(0);

  const readerTheme = useAppStore((s) => s.readerTheme);
  const fontFamily = useAppStore((s) => s.fontFamily);
  const fontSize = useAppStore((s) => s.fontSize);
  const lineHeight = useAppStore((s) => s.lineHeight);
  const contentWidth = useAppStore((s) => s.contentWidth);
  const selectedColor = useAppStore((s) => s.selectedHighlightColor);
  const setSelectedColor = useAppStore((s) => s.setSelectedHighlightColor);
  const tagColorMap = useAppStore((s) => s.tagColorMap);
  const isZenMode = useAppStore((s) => s.isZenMode);

  const { user } = useAuth();
  const highlights = useHighlights(articleId);
  const annotations = useAnnotations(articleId);

  // Sanitize content
  const sanitizedContent = DOMPurify.sanitize(content);

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
    if (!contentRef.current) return;

    contentRef.current.innerHTML = sanitizedContent;
    applyHighlights();

    // Measure paragraph positions for annotation gutter.
    // Must also re-run after images load (ResizeObserver fires on layout shifts).
    const el = contentRef.current;
    const measureParagraphTops = () => {
      if (!el) return;
      const paragraphs = el.querySelectorAll(
        'p, li, h1, h2, h3, h4, h5, h6, blockquote, td, th, figcaption'
      );
      const contentTop = el.offsetTop;
      const tops = Array.from(paragraphs).map((p) => (p as HTMLElement).offsetTop - contentTop);
      setParagraphTops(tops);
    };

    measureParagraphTops();

    const ro = new ResizeObserver(measureParagraphTops);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sanitizedContent, applyHighlights]);

  // Restore scroll position when article opens (runs once after first content paint)
  useEffect(() => {
    if (hasScrolled.current || !initialProgress || initialProgress <= 0) return;
    const container = scrollContainerRef.current;
    if (!container) return;
    const timer = setTimeout(() => {
      const { scrollHeight, clientHeight } = container;
      container.scrollTop = (initialProgress / 100) * (scrollHeight - clientHeight);
      hasScrolled.current = true;
    }, 80);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialProgress]); // intentionally omits sanitizedContent — only restore once

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

      // Notify parent of scroll direction for toolbar hide/show
      if (onScrollDirection) {
        const dir = scrollTop > lastScrollTopRef.current + 4 ? 'down'
          : scrollTop < lastScrollTopRef.current - 4 ? 'up'
          : null;
        if (dir) onScrollDirection(dir);
      }
      lastScrollTopRef.current = scrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [onScrollProgress]);

  // Core selection handler — safe to call from any event (mouseup, touchend, selectionchange).
  // Idempotent: calling it twice with the same live selection just re-renders the same popup.
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

    // Position the popup.
    // On touch devices: use a fixed bar at the bottom of the screen so it doesn't
    // overlap the iOS native "Copy / Look Up" callout that appears above the selection.
    // On desktop: use fixed viewport coordinates — the outer ReaderView div is
    // `fixed inset-0`, so viewport coords map 1-to-1 with the absolute/fixed offsets.
    // Do NOT add scrollTop: getBoundingClientRect() already returns viewport coords,
    // and adding scrollTop caused the popup to drift down as the user scrolled.
    // pointer: coarse = finger/stylus (iPad + keyboard still gets floating popup)
    const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
    if (isTouchDevice) {
      setPopupPosition({ x: 0, y: 0, mobile: true });
    } else {
      const rect = range.getBoundingClientRect();
      setPopupPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        mobile: false,
      });
    }

    setSelectedText(text);
    setSelectionData({ paragraphIndex, startOffset, endOffset });
  }, [articleTags, tagColorMap, setSelectedColor]);

  // Mobile selection detection.
  //
  // iOS Safari does NOT reliably fire `selectionchange` for non-editable divs (known
  // WebKit limitation on older iOS). The event that IS reliable is `touchend` — it fires
  // when the user lifts their finger after the initial long-press selection.
  //
  // Strategy:
  //  • touchend  → primary trigger for iOS (fires on finger-lift after long-press)
  //  • selectionchange → secondary trigger, covers handle-drag finalization + desktop
  //
  // handleMouseUp is idempotent so calling it from both sources is harmless.
  useEffect(() => {
    // touchend: fired when user lifts finger; selection is finalized at this point.
    const onTouchEnd = () => {
      // Small delay so WebKit has time to commit the selection object.
      setTimeout(handleMouseUp, 50);
    };

    // selectionchange debounce: catches handle-drag adjustments and desktop mouse drag.
    let scTimer: ReturnType<typeof setTimeout>;
    const onSelectionChange = () => {
      clearTimeout(scTimer);
      scTimer = setTimeout(handleMouseUp, 200);
    };

    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('selectionchange', onSelectionChange);
    return () => {
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('selectionchange', onSelectionChange);
      clearTimeout(scTimer);
    };
  }, [handleMouseUp]);

  // Create highlight (note is optional — passed when user types in the inline note field)
  const handleCreateHighlight = useCallback(
    async (color: HighlightColor, note?: string) => {
      if (!selectedText || !selectionData) return;

      await addHighlight({
        articleId,
        text: selectedText,
        color,
        note,
        paragraphIndex: selectionData.paragraphIndex,
        startOffset: selectionData.startOffset,
        endOffset: selectionData.endOffset,
        userId: user?.uid || null,
      });

      window.getSelection()?.removeAllRanges();
      setPopupPosition(null);
      setSelectedText('');
      setSelectionData(null);
    },
    [articleId, selectedText, selectionData, user]
  );

  // Keyboard shortcuts: 1-5 highlight with that color, Escape dismisses popup
  useEffect(() => {
    if (!popupPosition) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active?.tagName === 'TEXTAREA' || active?.tagName === 'INPUT') return;
      if (e.key === 'Escape') {
        window.getSelection()?.removeAllRanges();
        setPopupPosition(null);
        setSelectedText('');
        setSelectionData(null);
        return;
      }
      const digit = parseInt(e.key, 10);
      if (digit >= 1 && digit <= 5) {
        e.preventDefault();
        handleCreateHighlight(HIGHLIGHT_COLOR_KEYS[digit - 1]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [popupPosition, handleCreateHighlight]);

  // Undo: Cmd/Ctrl+Z removes the most recent highlight for this article
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key !== 'z') return;
      const active = document.activeElement;
      if (active?.tagName === 'TEXTAREA' || active?.tagName === 'INPUT') return;
      if (!highlights || highlights.length === 0) return;
      e.preventDefault();
      const last = [...highlights].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )[0];
      deleteHighlight(last.id);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [highlights]);

  // Handle clicking on existing highlights — show the context popup (recolor / note / delete)
  const handleContentClick = useCallback(
    (e: React.MouseEvent) => {
      // Don't intercept while user has an active text selection
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed) return;

      const target = e.target as HTMLElement;
      const mark = target.closest('mark[data-highlight-id]');
      if (mark) {
        const highlightId = mark.getAttribute('data-highlight-id');
        if (highlightId) {
          setPopupPosition(null);
          const rect = (mark as HTMLElement).getBoundingClientRect();
          setActiveHighlightContext({
            id: highlightId,
            x: rect.left + rect.width / 2,
            y: rect.top - 8,
          });
        }
      }
    },
    []
  );

  const handleRecolorHighlight = useCallback(async (id: string, color: HighlightColor) => {
    await updateHighlight(id, { color });
    setActiveHighlightContext(null);
  }, []);

  const handleDeleteFromContext = useCallback(async (id: string) => {
    await deleteHighlight(id);
    setActiveHighlightContext(null);
  }, []);

  const handleNoteFromContext = useCallback((id: string) => {
    const h = highlights?.find((h) => h.id === id);
    if (h) {
      setNoteHighlight(h);
      setActiveHighlightContext(null);
    }
  }, [highlights]);

  const handleResumeClick = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !initialProgress) return;
    const { scrollHeight, clientHeight } = container;
    container.scrollTo({ top: (initialProgress / 100) * (scrollHeight - clientHeight), behavior: 'smooth' });
  }, [initialProgress]);

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
      style={{ backgroundColor: themeStyles.bg, color: themeStyles.text, overscrollBehavior: 'contain' }}
    >
      {/* Resume chip — shown when article was partially read */}
      {initialProgress && initialProgress > 5 && initialProgress < 98 && (
        <div className="sticky top-3 z-20 flex justify-center pointer-events-none">
          <button
            onClick={handleResumeClick}
            className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all animate-in fade-in slide-in-from-top-2"
          >
            Resume — {initialProgress}%
          </button>
        </div>
      )}

      <div
        className="mx-auto px-6 py-8 flex"
        style={{ maxWidth: `calc(${CONTENT_WIDTHS[contentWidth].maxWidth} + 3rem)` }}
      >
        {/* Annotation gutter — hidden in zen mode */}
        <div ref={gutterRef} className={`w-10 flex-shrink-0 relative hidden md:block transition-opacity duration-300 ${isZenMode ? 'opacity-0 pointer-events-none' : ''}`}>
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

      {/* Highlight popup — new selection */}
      {popupPosition && (
        <HighlightPopup
          x={popupPosition.x}
          y={popupPosition.y}
          mobile={popupPosition.mobile}
          onSelectColor={handleCreateHighlight}
          onDismiss={() => setPopupPosition(null)}
          activeColor={selectedColor}
        />
      )}

      {/* Context popup — tapping an existing highlight */}
      {activeHighlightContext && (() => {
        const h = highlights?.find((h) => h.id === activeHighlightContext.id);
        if (!h) return null;
        return (
          <HighlightContextPopup
            currentColor={h.color}
            hasNote={!!h.note}
            x={activeHighlightContext.x}
            y={activeHighlightContext.y}
            onRecolor={(color) => handleRecolorHighlight(activeHighlightContext.id, color)}
            onNote={() => handleNoteFromContext(activeHighlightContext.id)}
            onDelete={() => handleDeleteFromContext(activeHighlightContext.id)}
            onDismiss={() => setActiveHighlightContext(null)}
          />
        );
      })()}

      {/* Note modal — opened from context popup */}
      {noteHighlight && (
        <NoteModal
          highlight={noteHighlight}
          onClose={() => setNoteHighlight(null)}
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
