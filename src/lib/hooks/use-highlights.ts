'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import type { Highlight, HighlightColor } from '@/lib/types';

export function useHighlights(articleId: string | null) {
  return useLiveQuery(async () => {
    if (!articleId) return [];
    return db.highlights.where('articleId').equals(articleId).sortBy('timestamp');
  }, [articleId]);
}

export function useHighlightCount(articleId: string | null) {
  return useLiveQuery(async () => {
    if (!articleId) return 0;
    return db.highlights.where('articleId').equals(articleId).count();
  }, [articleId]);
}

export function useAllHighlights() {
  return useLiveQuery(async () => {
    return db.highlights.orderBy('timestamp').reverse().toArray();
  }, []);
}

export async function addHighlight(data: {
  articleId: string;
  text: string;
  color: HighlightColor;
  paragraphIndex: number;
  startOffset: number;
  endOffset: number;
}) {
  const highlight: Highlight = {
    id: nanoid(),
    articleId: data.articleId,
    text: data.text,
    color: data.color,
    note: '',
    tags: [],
    paragraphIndex: data.paragraphIndex,
    startOffset: data.startOffset,
    endOffset: data.endOffset,
    timestamp: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    userId: null,
  };

  await db.highlights.add(highlight);
  return highlight;
}

export async function updateHighlight(id: string, changes: Partial<Highlight>) {
  await db.highlights.update(id, { ...changes, lastModified: new Date().toISOString() });
}

export async function deleteHighlight(id: string) {
  await db.highlights.delete(id);
}
