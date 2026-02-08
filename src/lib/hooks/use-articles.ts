'use client';

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/db';
import { nanoid } from 'nanoid';
import type { Article, FilterOption, SortOption } from '@/lib/types';

export function useArticles(
  filter: FilterOption,
  folderId: string | null,
  tagFilter: string | null,
  searchQuery: string,
  sortOption: SortOption,
  userId: string | null
) {
  return useLiveQuery(async () => {
    let articles = await db.articles.toArray();

    // Scope by user — show only this user's articles (or anonymous articles if no user)
    articles = articles.filter((a) => a.userId === userId);

    // Apply filter
    if (filter === 'favorites') articles = articles.filter((a) => a.isFavorite);
    else if (filter === 'archived') articles = articles.filter((a) => a.isArchived);
    else if (filter === 'unread') articles = articles.filter((a) => !a.isRead && !a.isArchived);
    else articles = articles.filter((a) => !a.isArchived); // 'all' hides archived

    // Filter by folder
    if (folderId) articles = articles.filter((a) => a.folderId === folderId);

    // Filter by tag
    if (tagFilter) articles = articles.filter((a) => a.tags.includes(tagFilter));

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.url.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sort
    articles.sort((a, b) => {
      switch (sortOption) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'readingTime':
          return a.readingTime - b.readingTime;
        case 'lastRead':
          return (b.lastReadAt || '').localeCompare(a.lastReadAt || '');
        case 'dateAdded':
        default:
          return b.dateAdded.localeCompare(a.dateAdded);
      }
    });

    return articles;
  }, [filter, folderId, tagFilter, searchQuery, sortOption, userId]);
}

export function useArticle(id: string | null) {
  return useLiveQuery(async () => {
    if (!id) return null;
    return db.articles.get(id);
  }, [id]);
}

export function useAllTags(userId: string | null) {
  return useLiveQuery(async () => {
    const articles = await db.articles.filter((a) => a.userId === userId).toArray();
    const tagMap = new Map<string, number>();
    for (const article of articles) {
      for (const tag of article.tags) {
        tagMap.set(tag, (tagMap.get(tag) || 0) + 1);
      }
    }
    return Array.from(tagMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }, [userId]);
}

export function useArticleCount(userId: string | null) {
  return useLiveQuery(async () => {
    const articles = await db.articles.filter((a) => a.userId === userId).toArray();
    const total = articles.length;
    const unread = articles.filter((a) => !a.isRead && !a.isArchived).length;
    return { total, unread };
  }, [userId]);
}

export async function addArticle(data: {
  url: string;
  title: string;
  content: string;
  excerpt: string;
  thumbnail: string;
  siteName: string;
  readingTime: number;
  tags?: string[];
  folderId?: string | null;
  userId?: string | null;
}) {
  // Check duplicates scoped by user
  const existing = await db.articles
    .filter((a) => a.url === data.url && a.userId === (data.userId || null))
    .first();
  if (existing) throw new Error('Article already saved');

  const article: Article = {
    id: nanoid(),
    url: data.url,
    title: data.title,
    content: data.content,
    excerpt: data.excerpt,
    thumbnail: data.thumbnail,
    siteName: data.siteName,
    isRead: false,
    isFavorite: false,
    isArchived: false,
    readProgress: 0,
    readingTime: data.readingTime,
    folderId: data.folderId || null,
    tags: data.tags || [],
    readCount: 0,
    totalReadTime: 0,
    lastReadAt: null,
    dateAdded: new Date().toISOString(),
    lastModified: new Date().toISOString(),
    syncStatus: 'pending',
    userId: data.userId || null,
  };

  await db.articles.add(article);
  return article;
}

export async function updateArticle(id: string, changes: Partial<Article>) {
  await db.articles.update(id, { ...changes, lastModified: new Date().toISOString() });
}

export async function deleteArticle(id: string) {
  await db.transaction('rw', db.articles, db.highlights, db.sessions, async () => {
    await db.highlights.where('articleId').equals(id).delete();
    await db.sessions.where('articleId').equals(id).delete();
    await db.articles.delete(id);
  });
}

export async function toggleFavorite(id: string) {
  const article = await db.articles.get(id);
  if (article) {
    await updateArticle(id, { isFavorite: !article.isFavorite });
  }
}

export async function toggleArchive(id: string) {
  const article = await db.articles.get(id);
  if (article) {
    await updateArticle(id, { isArchived: !article.isArchived });
  }
}

export async function markAsRead(id: string) {
  await updateArticle(id, { isRead: true, lastReadAt: new Date().toISOString() });
}
