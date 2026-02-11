'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import type { Highlight, HighlightColor, HighlightCollection } from '@/lib/types';

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
    collectionId: null,
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

// Daily highlights — 5 random highlights seeded by today's date
export function useDailyHighlights(userId: string | null) {
  return useLiveQuery(async () => {
    if (!userId) return [];
    const articles = await db.articles.filter((a) => a.userId === userId).toArray();
    const articleIds = new Set(articles.map((a) => a.id));
    const allHighlights = await db.highlights.toArray();
    const userHighlights = allHighlights.filter((h) => articleIds.has(h.articleId));
    if (userHighlights.length < 5) return [];

    // Seed random by today's date for consistency
    const seed = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
    }
    const seededRandom = (i: number) => {
      const x = Math.sin(hash + i) * 10000;
      return x - Math.floor(x);
    };

    // Fisher-Yates shuffle with seed
    const shuffled = [...userHighlights];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom(i) * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    const selected = shuffled.slice(0, 5);
    // Attach article title
    const articleMap = new Map(articles.map((a) => [a.id, a]));
    return selected.map((h) => ({
      ...h,
      articleTitle: articleMap.get(h.articleId)?.title || 'Unknown',
    }));
  }, [userId]);
}

// Search highlights by text
export function useSearchHighlights(query: string, userId: string | null) {
  return useLiveQuery(async () => {
    if (!query || !userId) return [];
    const articles = await db.articles.filter((a) => a.userId === userId).toArray();
    const articleIds = new Set(articles.map((a) => a.id));
    const allHighlights = await db.highlights.toArray();
    const q = query.toLowerCase();
    return allHighlights.filter(
      (h) => articleIds.has(h.articleId) && (h.text.toLowerCase().includes(q) || h.note.toLowerCase().includes(q))
    );
  }, [query, userId]);
}

// Collections
export function useCollections(userId: string | null) {
  return useLiveQuery(async () => {
    if (!userId) return [];
    return db.collections.filter((c) => c.userId === userId).sortBy('createdAt');
  }, [userId]);
}

export function useCollectionHighlights(collectionId: string | null) {
  return useLiveQuery(async () => {
    if (!collectionId) return [];
    return db.highlights.filter((h) => h.collectionId === collectionId).toArray();
  }, [collectionId]);
}

export async function addCollection(name: string, userId: string | null) {
  const collection: HighlightCollection = {
    id: nanoid(),
    name,
    userId,
    createdAt: new Date().toISOString(),
  };
  await db.collections.add(collection);
  return collection;
}

export async function deleteCollection(id: string) {
  // Remove collection reference from highlights
  const highlights = await db.highlights.filter((h) => h.collectionId === id).toArray();
  for (const h of highlights) {
    await db.highlights.update(h.id, { collectionId: null });
  }
  await db.collections.delete(id);
}

export async function addHighlightToCollection(highlightId: string, collectionId: string) {
  await db.highlights.update(highlightId, { collectionId, lastModified: new Date().toISOString() });
}

export async function removeHighlightFromCollection(highlightId: string) {
  await db.highlights.update(highlightId, { collectionId: null, lastModified: new Date().toISOString() });
}
